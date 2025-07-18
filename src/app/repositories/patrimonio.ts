import BigNumber from 'bignumber.js';
import { DefaultFields, DefaultRepository, MapperTypes, TableNames, DEFAULT_MAPPING } from './default';
import { PeriodoTransacoes, TransacoesRepository } from './transacoes';

export interface Patrimonio extends DefaultFields {
  valor?: BigNumber
  data: Date
  local?: string
  comentario?: string
  ordem?: number
}

export class PatrimonioRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...DEFAULT_MAPPING, data: MapperTypes.DATE_TIME, tipo: MapperTypes.NUMBER, monthYear: MapperTypes.IGNORE };

  public async listPatrimonio(periodo: PeriodoTransacoes): Promise<Patrimonio[]> {
    let query = TransacoesRepository.getQueryByPeriodo(periodo);

    const result = await this.db.exec(`SELECT strftime('%Y-%m', data) AS monthYear, * FROM ${TableNames.PATRIMONIO} where ${query} order by monthYear desc, ordem ASC`);

    if (!Array.isArray(result))
      throw new Error(`${TableNames.PATRIMONIO} não encontrado (a)`);

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0] || [];
  }

  public async listByMonth(month: string, year: string): Promise<Patrimonio[]> {
    const result = await this.db.exec(`select strftime('%Y-%m', data) AS monthYear, * FROM ${TableNames.PATRIMONIO} where strftime('%m', data) = $month and strftime('%Y', data) = $year order by monthYear desc, ordem asc`, { "$month": month, "$year": year });

    if (!Array.isArray(result))
      throw new Error(`${TableNames.PATRIMONIO} não encontrado (a)`);

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0] || [];
  }

  public async deletePeriod(month: string, year: string) {
    await this.db.exec(`delete from ${TableNames.PATRIMONIO} where strftime('%m', data) = $month and strftime('%Y', data) = $year`, { "$month": month, "$year": year })

    await this.persistDb();
  }
}