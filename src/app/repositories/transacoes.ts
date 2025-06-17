import moment from 'moment';
import BigNumber from 'bignumber.js';
import { DefaultFields, DefaultRepository, MapperTypes, TableNames } from './default';
import { Metas } from './metas';

export interface Transacoes extends DefaultFields {
  valor?: BigNumber
  data: Date
  tipo?: TipoDeReceita
  local?: string
  comentario?: string
  categoriaId?: number
  ordem?: number
}

export enum TipoDeReceita {
  FIXO = 0,
  VARIAVEL = 1
}

export interface TransacoesAcumuladasPorMes {
  mes: string;
  totalAcumulado: BigNumber;
  totalMes: BigNumber;
}

export interface TransacoesAcumuladasPorMesHome {
  mes: string;
  receitasMes: BigNumber;
  despesasMes: BigNumber;
  totalAcumulado: BigNumber;
  totalMes: BigNumber;
  variacaoMes: BigNumber;
  variacaoPercentualMes: BigNumber;
  variacaoTrimestral: BigNumber;
  variacaoPercentualTrimestral: BigNumber;
  variacaoSemestral: BigNumber;
  variacaoPercentualSemestral: BigNumber;
  variacaoAnual: BigNumber;
  variacaoPercentualAnual: BigNumber;
  variacaoTresAnos: BigNumber;
  variacaoPercentualTresAnos: BigNumber;
}

export interface TotaisTransacoes {
  valorEmCaixa?: BigNumber
  transacoesAcumuladaPorMes: TransacoesAcumuladasPorMes[]
}

export interface TotaisHome {
  valorEmCaixa: BigNumber
  receitas: BigNumber
  despesas: BigNumber
  transacoesAcumuladaPorMes: TransacoesAcumuladasPorMesHome[]
  metas: Metas[]
}

export enum PeriodoTransacoes {
  ULTIMO_MES,
  TRES_ULTIMOS_MESES,
  SEIS_ULTIMOS_MESES,
  ULTIMO_ANO,
  TODO_HISTORICO,
}

export class TransacoesRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...super.DEFAULT_MAPPING, data: MapperTypes.DATE_TIME, tipo: MapperTypes.NUMBER, monthYear: MapperTypes.IGNORE, categoriaId: MapperTypes.NUMBER };

  public async totais(yearAndMonth: Date): Promise<TotaisHome> {
    await Promise.resolve();

    const query = `
    select SUM(t.valor) as valorEmCaixa FROM transacoes t;
    
    select SUM(t.valor) as receitas FROM transacoes t
    WHERE t.valor >= 0
    and strftime('%m', t.data) = $month and strftime('%Y', t.data) = $year;

    select SUM(t.valor) as despesas FROM transacoes t
    WHERE t.valor < 0
    and strftime('%m', t.data) = $month and strftime('%Y', t.data) = $year;

    WITH Totais AS (
      SELECT strftime('%Y-%m', t.data) AS mes,
          SUM(CASE WHEN t.valor >= 0 THEN t.valor ELSE 0 END) AS receitasMes,
          SUM(CASE WHEN t.valor < 0 THEN t.valor ELSE 0 END) AS despesasMes,
          SUM(t.valor) AS totalMes,
          SUM(SUM(t.valor)) OVER (ORDER BY strftime('%Y-%m', data)) AS totalAcumulado
      FROM transacoes t
      GROUP BY mes
    )
    SELECT mes,
      receitasMes,
      despesasMes,
        totalAcumulado,
        totalMes,
        totalAcumulado - LAG(totalAcumulado, 1, 0) OVER (ORDER BY mes) AS variacaoMes,
        (totalAcumulado - LAG(totalAcumulado, 1, 0) OVER (ORDER BY mes)) / LAG(totalAcumulado, 1, 1) OVER (ORDER BY mes) * 100 AS variacaoPercentualMes,
        totalAcumulado - LAG(totalAcumulado, 3, 0) OVER (ORDER BY mes) AS variacaoTrimestral,
        (totalAcumulado - LAG(totalAcumulado, 3, 0) OVER (ORDER BY mes)) / LAG(totalAcumulado, 3, 1) OVER (ORDER BY mes) * 100 AS variacaoPercentualTrimestral,
        totalAcumulado - LAG(totalAcumulado, 6, 0) OVER (ORDER BY mes) AS variacaoSemestral,
        (totalAcumulado - LAG(totalAcumulado, 6, 0) OVER (ORDER BY mes)) / LAG(totalAcumulado, 6, 1) OVER (ORDER BY mes) * 100 AS variacaoPercentualSemestral,
        totalAcumulado - LAG(totalAcumulado, 12, 0) OVER (ORDER BY mes) AS variacaoAnual,
        (totalAcumulado - LAG(totalAcumulado, 12, 0) OVER (ORDER BY mes)) / LAG(totalAcumulado, 12, 1) OVER (ORDER BY mes) * 100 AS variacaoPercentualAnual,
        totalAcumulado - LAG(totalAcumulado, 36, 0) OVER (ORDER BY mes) AS variacaoTresAnos,
        (totalAcumulado - LAG(totalAcumulado, 36, 0) OVER (ORDER BY mes)) / LAG(totalAcumulado, 36, 1) OVER (ORDER BY mes) * 100 AS variacaoPercentualTresAnos
    FROM Totais
    ORDER BY mes
    LIMIT -1 OFFSET 1;

    SELECT * FROM metas m
    WHERE strftime('%Y', m.data) = $year;
    `;

    const result = await this.db.exec(query, { "$month": moment(yearAndMonth).format('MM'), "$year": moment(yearAndMonth).format('YYYY') });

    const parsedResult = this.parseSqlResultToObj(result);

    return {
      valorEmCaixa: parsedResult[0][0]?.valorEmCaixa as any,
      receitas: parsedResult[1][0]?.receitas as any,
      despesas: parsedResult[2][0]?.despesas as any,
      transacoesAcumuladaPorMes: parsedResult[3] as any,
      metas: (parsedResult[4] as any)?.map(x => { x.tipo = x.tipo.toNumber(); return x; }),
    }
  }

  public async totaisCaixa(): Promise<TotaisTransacoes> {
    await Promise.resolve();

    const result = await this.db.exec(`select SUM(t.valor) as valorEmCaixa FROM transacoes t`);

    const { valorEmCaixa } = this.parseSqlResultToObj(result)[0][0] || {};

    const query = `SELECT strftime('%Y-%m', t.data) AS mes,
    SUM(t.valor) AS totalMes,
    SUM(SUM(t.valor)) OVER (ORDER BY strftime('%Y-%m', t.data)) AS totalAcumulado
    FROM transacoes t
    GROUP BY strftime('%Y-%m', t.data)
      `;

    const result2 = await this.db.exec(query);

    const transacoesAcumuladaPorMes = this.parseSqlResultToObj(result2)[0] || [];

    return { valorEmCaixa, transacoesAcumuladaPorMes }
  }

  public static getQueryByPeriodo(periodo: PeriodoTransacoes) {
    let query = "strftime('%Y-%m', data) = strftime('%Y-%m', DATETIME('now'))";

    switch (periodo) {
      case PeriodoTransacoes.TRES_ULTIMOS_MESES:
        query = "data > DATETIME('now', '-3 month')";
        break;
      case PeriodoTransacoes.SEIS_ULTIMOS_MESES:
        query = "data > DATETIME('now', '-6 month')";
        break;
      case PeriodoTransacoes.ULTIMO_ANO:
        query = "data > DATETIME('now', '-12 month')";
        break;
      case PeriodoTransacoes.TODO_HISTORICO:
        query = "1=1";
        break;

      default:
        break;
    }

    return query;
  }

  public async listCaixa(periodo: PeriodoTransacoes): Promise<Transacoes[]> {
    let query = TransacoesRepository.getQueryByPeriodo(periodo);

    const result = await this.db.exec(`SELECT strftime('%Y-%m', data) AS monthYear, * FROM ${TableNames.TRANSACOES} where ${query} order by monthYear desc, ordem ASC`);

    if (!Array.isArray(result))
      throw new Error(`${TableNames.TRANSACOES} não encontrado (a)`);

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0] || [];
  }

  public async listByMonth(month: string, year: string): Promise<Transacoes[]> {
    const result = await this.db.exec(`select strftime('%Y-%m', data) AS monthYear, * FROM ${TableNames.TRANSACOES} where strftime('%m', data) = $month and strftime('%Y', data) = $year order by monthYear desc, ordem asc`, { "$month": month, "$year": year });

    if (!Array.isArray(result))
      throw new Error(`${TableNames.TRANSACOES} não encontrado (a)`);

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0] || [];
  }

  public async deletePeriod(month: string, year: string) {
    await this.db.exec(`delete from ${TableNames.TRANSACOES} where strftime('%m', data) = $month and strftime('%Y', data) = $year`, { "$month": month, "$year": year })

    await this.persistDb();
  }
}