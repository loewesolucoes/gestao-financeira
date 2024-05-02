import moment from 'moment';
import initSqlJs from 'sql.js';
import BigNumber from 'bignumber.js';
import localforage from 'localforage'


let SQL: import('sql.js').SqlJsStatic

export enum MapperTypes {
  DATE,
  DATE_TIME,
  NUMBER,
}

export enum TipoDeReceita {
  FIXO = 0,
  VARIAVEL = 1
}

export interface Caixa {
  id: BigNumber
  valor?: BigNumber
  data: moment.Moment
  tipo?: TipoDeReceita
  local?: string
  comentario?: string
  createdDate: moment.Moment
  updatedDate?: moment.Moment
}

export enum PeriodoTransacoes {
  ULTIMO_MES,
  TRES_ULTIMOS_MESES,
  SEIS_ULTIMOS_MESES,
  ULTIMO_ANO,
  TODO_HISTORICO,
}

const CAIXA_MAPPING = { data: MapperTypes.DATE_TIME, createdDate: MapperTypes.DATE_TIME, updatedDate: MapperTypes.DATE_TIME, };

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

  public async save(data: any) {
    await Promise.resolve();

    let result = {} as any;

    if (data?.id != null)
      result = this.update(data)
    else
      result = this.insert(data);

    this.persistDb();

    return result;
  }

  public async list(periodo: PeriodoTransacoes): Promise<Caixa[]> {
    await Promise.resolve();

    let query = "data > DATETIME('now', '-30 day')"

    switch (periodo) {
      case PeriodoTransacoes.TRES_ULTIMOS_MESES:
        query = "data > DATETIME('now', '-3 month')"
        break;
      case PeriodoTransacoes.SEIS_ULTIMOS_MESES:
        query = "data > DATETIME('now', '-6 month')"
        break;
      case PeriodoTransacoes.ULTIMO_ANO:
        query = "data > DATETIME('now', '-12 month')"
        break;
      case PeriodoTransacoes.TODO_HISTORICO:
        query = "1=1"
        break;

      default:
        break;
    }

    const result = this.db.exec(`select * FROM transacoes where ${query}`);

    if (!Array.isArray(result))
      throw new Error('simulacao não encontrada');

    return this.parseSqlResultToObj(result, CAIXA_MAPPING)[0] || [];
  }

  public async getSimulacao(id: string) {
    await Promise.resolve();

    const result = this.db.exec('select * from simulacao where id = $id', { "$id": id });

    if (result.length === 0)
      throw new Error('simulacao não encontrada');

    return this.parseSqlResultToObj(result, CAIXA_MAPPING)[0][0];
  }

  private parseSqlResultToObj(result: initSqlJs.QueryExecResult[], mapper?: { [key: string]: MapperTypes }) {
    return result.map(res => res.values.map(values => res.columns.reduce((p, n, i) => {
      const value = values[i];
      let original = true;

      if (n !== 'id' && value != null) {
        if (mapper != null) {
          if (mapper[n] === MapperTypes.DATE) {
            p[n] = moment(value as any, 'YYYY-MM-DD'); //2022-11-03 00:00:00
            original = false;
          } else if (mapper[n] === MapperTypes.DATE_TIME) {
            p[n] = moment(value as any, 'YYYY-MM-DD hh:mm:ss'); //2022-11-03 00:00:00
            original = false;
          } else if (mapper[n] === MapperTypes.NUMBER) {
            p[n] = value;
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

  private async insert(data: any) {
    const nextData = { ...data, createdDate: new Date() };
    const keys = Object.keys(nextData).filter(k => nextData[k] !== undefined);
    const command = `INSERT INTO simulacao (${keys.join(', ')}) VALUES (${keys.map(k => `$${k}`).join(', ')});SELECT LAST_INSERT_ROWID();`;
    const params = keys.reduce((p, n) => {
      let value = nextData[n] || null;

      if (value instanceof Date) {
        value = moment(value).format();
      }

      p[`$${n}`] = value;

      return p
    }, {} as any);

    const result = this.db.exec(command, params);

    nextData.id = result[0].values[0][0];

    return nextData;
  }

  private async update(data: any) {
    const nextData = { ...data, updatedDate: new Date() };
    const keys = Object.keys(nextData).filter(k => nextData[k] !== undefined);
    const command = `UPDATE simulacao SET ${keys.map(k => `${k}=$${k}`).join(', ')} WHERE id=$id`;
    const params = keys.reduce((p, n) => {
      let value = nextData[n] || null;

      if (value instanceof Date) {
        value = moment(value).format();
      }

      p[`$${n}`] = value;

      return p
    }, {} as any);

    this.db.exec(command, params);

    return this.getSimulacao(data.id);
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
    this.db.exec(`CREATE TABLE IF NOT EXISTS "transacoes" ("id" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"data" DATETIME NOT NULL,"tipo" INTEGER NULL DEFAULT NULL,"local" TEXT NULL DEFAULT NULL,"comentario" TEXT NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);

    await this.persistDb();
  }
}