import moment from 'moment';
import BigNumber from 'bignumber.js';
import { DefaultFields, DefaultRepository, MapperTypes, TableNames, DEFAULT_MAPPING } from './default';

export enum TipoDeEmprestimo {
  EMPRESTEI = 0,        // a receber
  TOMEI_EMPRESTADO = 1, // a pagar
}

export enum StatusEmprestimo {
  ATIVO = 'ativo',
  QUITADO = 'quitado',
  CANCELADO = 'cancelado',
}

export interface Emprestimos extends DefaultFields {
  tipo: TipoDeEmprestimo
  pessoa?: string
  valorTotal?: BigNumber
  numeroParcelas?: number
  dataInicio: Date
  comentario?: string
  cancelado?: boolean
}

export interface EmprestimoParcelas extends DefaultFields {
  emprestimoId: number
  numero: number
  valor?: BigNumber
  dataVencimento: Date
  pago?: boolean
  dataPagamento?: Date
}

export interface EmprestimoComParcelas extends Emprestimos {
  parcelas: EmprestimoParcelas[]
  status: StatusEmprestimo
}

export interface TotaisEmprestimosDoMes {
  aReceber: BigNumber
  aPagar: BigNumber
  parcelasDoMes: (EmprestimoParcelas & { pessoa?: string; tipo: TipoDeEmprestimo })[]
}

export class EmprestimosRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...DEFAULT_MAPPING, tipo: MapperTypes.NUMBER, numeroParcelas: MapperTypes.NUMBER, dataInicio: MapperTypes.DATE_TIME, cancelado: MapperTypes.BOOLEAN };
  public readonly PARCELAS_MAPPING = { ...DEFAULT_MAPPING, emprestimoId: MapperTypes.NUMBER, numero: MapperTypes.NUMBER, dataVencimento: MapperTypes.DATE_TIME, pago: MapperTypes.BOOLEAN, dataPagamento: MapperTypes.DATE_TIME };

  public async criarComParcelas(data: Omit<Emprestimos, 'id' | 'createdDate'>): Promise<EmprestimoComParcelas> {
    const { numeroParcelas, valorTotal, dataInicio } = data;

    if (numeroParcelas == null || numeroParcelas <= 0)
      throw new Error('Número de parcelas inválido');

    const valorParcela = BigNumber(valorTotal ?? 0).dividedBy(numeroParcelas);

    const emprestimo = await this.insert(TableNames.EMPRESTIMOS, data) as Emprestimos;

    const parcelas: Omit<EmprestimoParcelas, 'id' | 'createdDate'>[] = [];

    for (let i = 0; i < numeroParcelas; i++) {
      parcelas.push({
        emprestimoId: emprestimo.id,
        numero: i + 1,
        valor: valorParcela,
        dataVencimento: moment(dataInicio).add(i, 'months').toDate(),
        pago: false,
      } as any);
    }

    await this.saveAll(TableNames.EMPRESTIMO_PARCELAS, parcelas as any);

    const parcelasCriadas = await this.listParcelasByEmprestimo(emprestimo.id);

    return { ...emprestimo, parcelas: parcelasCriadas, status: this.deriveStatus(emprestimo, parcelasCriadas) };
  }

  public async listComParcelas(): Promise<EmprestimoComParcelas[]> {
    const emprestimos = await this.list<Emprestimos>(TableNames.EMPRESTIMOS);

    const parcelasResult = await this.db.exec(`SELECT * FROM ${TableNames.EMPRESTIMO_PARCELAS} ORDER BY emprestimoId ASC, numero ASC`);
    const parcelas = (this.parseSqlResultToObj(parcelasResult, this.PARCELAS_MAPPING)[0] || []) as EmprestimoParcelas[];

    return emprestimos.map(emprestimo => {
      const parcelasDoEmprestimo = parcelas.filter(p => p.emprestimoId === emprestimo.id);

      return {
        ...emprestimo,
        parcelas: parcelasDoEmprestimo,
        status: this.deriveStatus(emprestimo, parcelasDoEmprestimo),
      };
    });
  }

  public async marcarParcelaPaga(parcelaId: number, pago: boolean): Promise<EmprestimoParcelas> {
    const parcela = await this.getParcela(parcelaId);

    return this.updateParcela({ ...parcela, pago, dataPagamento: pago ? new Date() : null } as any);
  }

  public async editarParcela(parcelaId: number, data: Partial<Pick<EmprestimoParcelas, 'valor' | 'dataVencimento'>>): Promise<EmprestimoParcelas> {
    const parcela = await this.getParcela(parcelaId);

    return this.updateParcela({ ...parcela, ...data });
  }

  public async cancelar(emprestimoId: number): Promise<Emprestimos> {
    const emprestimo = await this.get<Emprestimos>(TableNames.EMPRESTIMOS, `${emprestimoId}`);

    return this.update(TableNames.EMPRESTIMOS, { ...emprestimo, cancelado: true }) as Promise<Emprestimos>;
  }

  public async totaisDoMes(yearAndMonth: Date): Promise<TotaisEmprestimosDoMes> {
    const query = `
      SELECT p.*, e.pessoa as pessoa, e.tipo as tipo
      FROM ${TableNames.EMPRESTIMO_PARCELAS} p
      INNER JOIN ${TableNames.EMPRESTIMOS} e ON e.id = p.emprestimoId
      WHERE strftime('%m', p.dataVencimento) = $month AND strftime('%Y', p.dataVencimento) = $year
      AND (e.cancelado IS NULL OR e.cancelado = 0)
      ORDER BY p.dataVencimento ASC;
    `;

    const result = await this.db.exec(query, { "$month": moment(yearAndMonth).format('MM'), "$year": moment(yearAndMonth).format('YYYY') });

    const mapper = { ...this.PARCELAS_MAPPING, tipo: MapperTypes.NUMBER };
    const parcelasDoMes = (this.parseSqlResultToObj(result, mapper)[0] || []) as (EmprestimoParcelas & { pessoa?: string; tipo: TipoDeEmprestimo })[];

    const aReceber = parcelasDoMes
      .filter(p => p.tipo === TipoDeEmprestimo.EMPRESTEI)
      .reduce((acc, p) => acc.plus(p.valor ?? 0), BigNumber(0));

    const aPagar = parcelasDoMes
      .filter(p => p.tipo === TipoDeEmprestimo.TOMEI_EMPRESTADO)
      .reduce((acc, p) => acc.plus(p.valor ?? 0), BigNumber(0));

    return { aReceber, aPagar, parcelasDoMes };
  }

  private async listParcelasByEmprestimo(emprestimoId: number): Promise<EmprestimoParcelas[]> {
    const result = await this.db.exec(`SELECT * FROM ${TableNames.EMPRESTIMO_PARCELAS} WHERE emprestimoId = $emprestimoId ORDER BY numero ASC`, { "$emprestimoId": emprestimoId });

    return (this.parseSqlResultToObj(result, this.PARCELAS_MAPPING)[0] || []) as EmprestimoParcelas[];
  }

  private async getParcela(parcelaId: number): Promise<EmprestimoParcelas> {
    const result = await this.db.exec(`SELECT * FROM ${TableNames.EMPRESTIMO_PARCELAS} WHERE id = $id`, { "$id": parcelaId });

    const parsed = this.parseSqlResultToObj(result, this.PARCELAS_MAPPING)[0]?.[0];

    if (parsed == null)
      throw new Error('Parcela não encontrada');

    return parsed as EmprestimoParcelas;
  }

  private async updateParcela(data: EmprestimoParcelas): Promise<EmprestimoParcelas> {
    const { command, params } = this.createUpdateCommand(TableNames.EMPRESTIMO_PARCELAS, data);

    await this.db.exec(command, params);
    await this.persistDb();

    return this.getParcela(data.id);
  }

  private deriveStatus(emprestimo: Emprestimos, parcelas: EmprestimoParcelas[]): StatusEmprestimo {
    if (emprestimo.cancelado)
      return StatusEmprestimo.CANCELADO;

    if (parcelas.some(p => !p.pago))
      return StatusEmprestimo.ATIVO;

    return StatusEmprestimo.QUITADO;
  }
}
