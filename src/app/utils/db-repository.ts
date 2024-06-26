import moment from 'moment';
import initSqlJs from 'sql.js';
import BigNumber from 'bignumber.js';
import localforage from 'localforage'


let SQL: import('sql.js').SqlJsStatic

export enum MapperTypes {
  DATE,
  DATE_TIME,
  NUMBER,
  IGNORE,
}

export enum TipoDeReceita {
  FIXO = 0,
  VARIAVEL = 1
}

export interface Transacoes {
  id: number
  valor?: BigNumber
  data: Date
  tipo?: TipoDeReceita
  local?: string
  comentario?: string
  createdDate: Date
  updatedDate?: Date
  ordem?: number
}

export interface Patrimonio {
  id: number
  valor?: BigNumber
  data: Date
  local?: string
  comentario?: string
  ordem?: number
  createdDate: Date
  updatedDate?: Date
}

export interface Notas {
  id: number
  data: Date
  descricao?: string
  comentario?: string
  tipo?: TipoDeNota
  createdDate: Date
  updatedDate?: Date
}

export interface Metas {
  id: number
  data: Date
  descricao?: string
  comentario?: string
  tipo?: TipoDeMeta
  createdDate: Date
  updatedDate?: Date
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

export enum TipoDeNota {
  NORMAL = 0,
  PRIMARY = 1,
  SECONDARY = 2,
  INFO = 3,
  SUCCESS = 4,
  WARNING = 5,
  DANGER = 6,
  LIGHT = 7,
  DARK = 8,
}

export enum TipoDeMeta {
  PESSOAL = 0,
  FINANCEIRA = 1,
}

export enum TableNames {
  TRANSACOES = "transacoes",
  PATRIMONIO = "patrimonio",
  NOTAS = "notas",
  METAS = "metas",
}

const DEFAULT_MAPPING = { data: MapperTypes.DATE_TIME, createdDate: MapperTypes.DATE_TIME, updatedDate: MapperTypes.DATE_TIME, monthYear: MapperTypes.IGNORE };
const CAIXA_MAPPING = { ...DEFAULT_MAPPING, tipo: MapperTypes.NUMBER, monthYear: MapperTypes.IGNORE };
const NOTA_MAPPING = { ...DEFAULT_MAPPING, tipo: MapperTypes.NUMBER };
const META_MAPPING = { ...DEFAULT_MAPPING, tipo: MapperTypes.NUMBER };

const BUFFER_TYPE = 'base64';

export class DbRepository {
  public static readonly DB_NAME = 'gestao-financeira.settings.db';
  private constructor(private db: import('sql.js').Database) { }

  public static async create(data?: ArrayLike<number> | Buffer | null) {
    if (SQL == null) {
      SQL = await initSqlJs({
        // Fetch sql.js wasm file from CDN
        // This way, we don't need to deal with webpack
        locateFile: (file) => `${process.env.BASE_PATH}/${file}`,
      })
    }

    const localDump = await DbRepository.exportLocalDump();

    if (data == null && localDump != null) {
      data = Buffer.from(localDump, BUFFER_TYPE);
    }

    const db = new SQL.Database(data);

    const repo = new DbRepository(db);

    await repo.runMigrations();

    if (process.env.NODE_ENV !== 'production') {
      //@ts-ignore
      window._db = db;
    }

    // repo.beforeClose();

    return repo;
  }

  public static async persistLocalDump(dump?: string): Promise<void> {
    await localforage.setItem(DbRepository.DB_NAME, dump || '');
  }

  public static async exportLocalDump(): Promise<string | null> {
    return await localforage.getItem<string>(DbRepository.DB_NAME);
  }

  public async exportOriginalDump() {
    await Promise.resolve();

    return this.db.export();
  }

  public async persistDb() {
    const dump = await this.exportDump();

    await DbRepository.persistLocalDump(dump)
    console.info("persistDb ok");
  }

  public async saveAll(tableName: TableNames, transacoes: Transacoes[]) {
    let allParams = {};
    let fullCommand = '';

    transacoes.forEach((x, i) => {
      let execution = {} as any;

      if (x.id == null)
        execution = this.createInsertCommand(tableName, x, `${i}`);
      else
        execution = this.createUpdateCommand(tableName, x, `${i}`);

      const { command, params } = execution;

      fullCommand = `${fullCommand};${command}`
      allParams = { ...allParams, ...params }
    })

    console.info('saveAll', fullCommand, allParams)

    this.db.exec(fullCommand, allParams);

    await this.persistDb();
  }

  public async deletePeriod(tableName: TableNames, month: string, year: string) {
    this.db.exec(`delete from ${tableName} where strftime('%m', data) = $month and strftime('%Y', data) = $year`, { "$month": month, "$year": year })

    await this.persistDb();
  }

  public async save(tableName: TableNames, data: any) {
    let result = {} as any;

    if (data?.id != null)
      result = this.update(tableName, data)
    else
      result = this.insert(tableName, data);

    await this.persistDb();

    return result;
  }

  public async delete(tableName: TableNames, id: number) {
    let result = {} as any;

    this.db.exec(`delete from ${tableName} where id = $id`, { "$id": id })

    await this.persistDb();

    return result;
  }

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

    const result = this.db.exec(query, { "$month": moment(yearAndMonth).format('MM'), "$year": moment(yearAndMonth).format('YYYY') });

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

    const result = this.db.exec(`select SUM(t.valor) as valorEmCaixa FROM transacoes t`);

    const { valorEmCaixa } = this.parseSqlResultToObj(result)[0][0] || {};

    const query = `SELECT strftime('%Y-%m', t.data) AS mes,
    SUM(t.valor) AS totalMes,
    SUM(SUM(t.valor)) OVER (ORDER BY strftime('%Y-%m', t.data)) AS totalAcumulado
    FROM transacoes t
    GROUP BY strftime('%Y-%m', t.data)
      `;

    const result2 = this.db.exec(query);

    const transacoesAcumuladaPorMes = this.parseSqlResultToObj(result2)[0] || [];

    return { valorEmCaixa, transacoesAcumuladaPorMes }
  }

  private getQueryByPeriodo(periodo: PeriodoTransacoes) {
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

  public async list<T>(tableName: TableNames): Promise<T[]> {
    await Promise.resolve();

    const result = this.db.exec(`SELECT strftime('%Y-%m', data) AS monthYear, * FROM ${tableName} order by data desc`);

    if (!Array.isArray(result))
      throw new Error(`${tableName} não encontrado (a)`);

    return this.parseSqlResultToObj(result, NOTA_MAPPING)[0] || [];
  }

  public async listCaixaOrPatrimonio(tableName: TableNames, periodo: PeriodoTransacoes): Promise<Transacoes[]> {
    await Promise.resolve();

    let query = this.getQueryByPeriodo(periodo);

    const result = this.db.exec(`SELECT strftime('%Y-%m', data) AS monthYear, * FROM ${tableName} where ${query} order by monthYear desc, ordem ASC`);

    if (!Array.isArray(result))
      throw new Error(`${tableName} não encontrado (a)`);

    return this.parseSqlResultToObj(result, CAIXA_MAPPING)[0] || [];
  }

  public async listByMonth(tableName: TableNames, month: string, year: string): Promise<Transacoes[]> {
    await Promise.resolve();

    const result = this.db.exec(`select strftime('%Y-%m', data) AS monthYear, * FROM ${tableName} where strftime('%m', data) = $month and strftime('%Y', data) = $year order by monthYear desc, ordem asc`, { "$month": month, "$year": year });

    if (!Array.isArray(result))
      throw new Error(`${tableName} não encontrado (a)`);

    return this.parseSqlResultToObj(result, CAIXA_MAPPING)[0] || [];
  }

  public async get(tableName: TableNames, id: string) {
    await Promise.resolve();

    const result = this.db.exec(`select * from ${tableName} where id = $id`, { "$id": id });

    if (result.length === 0)
      throw new Error(`${tableName} não encontrado (a)`);

    return this.parseSqlResultToObj(result, CAIXA_MAPPING)[0][0];
  }

  private async insert(tableName: TableNames, data: any) {
    const { command, params, nextData } = this.createInsertCommand(tableName, data);
    const fullCommand = `${command};SELECT LAST_INSERT_ROWID();`

    const result = this.db.exec(fullCommand, params);

    nextData.id = result[0].values[0][0];

    return nextData;
  }

  private createInsertCommand(tableName: TableNames, data: any, paramsPrefix: string = '') {
    const nextData = { ...data, createdDate: new Date() };
    const { keys, params } = this.parseToCommand(nextData, paramsPrefix);
    const command = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${keys.map(k => `$${k}${paramsPrefix}`).join(', ')})`;

    return { command, params, nextData }
  }

  private async update(tableName: TableNames, data: any) {
    const { command, params } = this.createUpdateCommand(tableName, data);

    this.db.exec(command, params);

    return this.get(tableName, data.id);
  }

  private createUpdateCommand(tableName: TableNames, data: any, paramsPrefix: string = '') {
    const nextData = { ...data, updatedDate: new Date() };
    const { keys, params } = this.parseToCommand(nextData, paramsPrefix);
    const command = `UPDATE ${tableName} SET ${keys.map(k => `${k}=$${k}${paramsPrefix}`).join(', ')} WHERE id=$id${paramsPrefix}`;

    return { command, params, nextData }
  }

  private parseSqlResultToObj(result: initSqlJs.QueryExecResult[], mapper?: { [key: string]: MapperTypes }) {
    return result.map(res => res.values.map(values => res.columns.reduce((p, n, i) => {
      const value = values[i];
      let original = true;

      if (n !== 'id' && value != null) {
        if (mapper != null) {
          if (mapper[n] === MapperTypes.DATE) {
            p[n] = moment(value as any, 'YYYY-MM-DD').toDate(); //2022-11-03 00:00:00
            original = false;
          } else if (mapper[n] === MapperTypes.DATE_TIME) {
            p[n] = moment(value as any, 'YYYY-MM-DD hh:mm:ss').toDate(); //2022-11-03 00:00:00
            original = false;
          } else if (mapper[n] === MapperTypes.NUMBER) {
            p[n] = value;
            original = false;
          } else if (mapper[n] === MapperTypes.IGNORE) {
            original = false;
          }
        }

        if (original && typeof (value) === 'number') {
          p[n] = BigNumber(value);
          original = false;
        }
      }

      if (original)
        p[n] = value;

      return p;
    }, {} as any)));
  }

  private parseToCommand(nextData: any, paramsPrefix: string = '') {
    const keys = Object.keys(nextData).filter(k => nextData[k] !== undefined);
    const params = keys.reduce((p, n) => {
      let value = nextData[n] ?? null;

      if (value instanceof Date) {
        value = moment(value).format();
      }

      if (value?._isBigNumber) {
        value = value.toNumber();
      }

      p[`$${n}${paramsPrefix}`] = value;

      return p;
    }, {} as any);

    return { keys, params };
  }

  private beforeClose() {
    const beforeUnload = (e: any) => {
      const message = "Ter certeza que deseja sair?";
      const event = e || window.event;

      // For IE and Firefox
      if (event) {
        event.returnValue = message;
      }

      this.persistDb();

      // For Safari
      return message;
    };

    window.addEventListener("beforeunload", beforeUnload);
  }

  private async exportDump() {
    await Promise.resolve();
    const exp = this.db.export();
    const dump = Buffer.from(exp).toString(BUFFER_TYPE);

    return dump;
  }

  private async runMigrations() {
    await Promise.resolve();

    const RUNNED_MIGRATION = 'runned';

    this.db.exec(`CREATE TABLE IF NOT EXISTS "migrations" ("id" INTEGER NOT NULL,"name" TEXT NULL DEFAULT NULL,"executedDate" DATETIME NULL,PRIMARY KEY ("id"));`);

    const result = this.db.exec('select * from "migrations"');
    const migrations = (this.parseSqlResultToObj(result)[0] || []).reduce((p, n) => { p[n.name] = n; return p; }, {} as any);

    if (migrations['transacoes'] == null) {
      this.db.exec(`CREATE TABLE IF NOT EXISTS "transacoes" ("id" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"data" DATETIME NOT NULL,"tipo" INTEGER NULL DEFAULT NULL,"local" TEXT NULL DEFAULT NULL,"comentario" TEXT NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['transacoes'] = RUNNED_MIGRATION;
    }

    if (migrations['transacoes_campo_ordem'] == null) {
      this.db.exec(`ALTER TABLE "transacoes" ADD COLUMN "ordem" INTEGER NULL;`);
      migrations['transacoes_campo_ordem'] = RUNNED_MIGRATION;
    }

    if (migrations['saldos'] == null) {
      this.db.exec(`CREATE TABLE IF NOT EXISTS "saldos" ("id" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"data" DATETIME NOT NULL,"local" TEXT NULL DEFAULT NULL,"comentario" TEXT NULL DEFAULT NULL, "ordem" INTEGER NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['saldos'] = RUNNED_MIGRATION;
    }

    if (migrations['rename_saldos_to_patrimonio'] == null) {
      this.db.exec(`ALTER TABLE 'saldos' RENAME TO 'patrimonio'`);
      migrations['rename_saldos_to_patrimonio'] = RUNNED_MIGRATION;
    }

    if (migrations['notas'] == null) {
      this.db.exec(`CREATE TABLE IF NOT EXISTS "notas" ("id" INTEGER NOT NULL,"data" DATETIME NOT NULL,"descricao" TEXT NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['notas'] = RUNNED_MIGRATION;
    }

    if (migrations['notas_campo_comentario_e_tipo'] == null) {
      this.db.exec(`ALTER TABLE "notas" ADD COLUMN "tipo" INTEGER NULL; ALTER TABLE "notas" ADD COLUMN "comentario" TEXT NULL;`);
      migrations['notas_campo_comentario_e_tipo'] = RUNNED_MIGRATION;
    }

    if (migrations['metas'] == null) {
      this.db.exec(`CREATE TABLE IF NOT EXISTS "metas" ("id" INTEGER NOT NULL,"data" DATETIME NOT NULL,"descricao" TEXT NULL DEFAULT NULL, "comentario" TEXT NULL, "tipo" INTEGER NULL, "done" INTEGER NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['metas'] = RUNNED_MIGRATION;
    }

    const runnedMigrations = Object.keys(migrations).filter(x => migrations[x] === RUNNED_MIGRATION).reduce((p, n) => { p.push({ name: n, executedDate: new Date() }); return p; }, [])

    let allParams = {};
    let fullCommand = '';

    if (runnedMigrations.length > 0) {
      runnedMigrations.forEach((x, i) => {
        const { keys, params } = this.parseToCommand(x, `${i}`);
        const command = `INSERT INTO "migrations" (${keys.join(', ')}) VALUES (${keys.map(k => `$${k}${i}`).join(', ')})`;

        fullCommand = `${fullCommand};${command}`
        allParams = { ...allParams, ...params }
      });

      this.db.exec(fullCommand, allParams);
    }

    await this.persistDb();
  }
}