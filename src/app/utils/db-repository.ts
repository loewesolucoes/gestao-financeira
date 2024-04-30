import moment from 'moment';
import initSqlJs from 'sql.js';
import BigNumber from 'bignumber.js';

let SQL: import('sql.js').SqlJsStatic


export interface Caixa {
  id: BigNumber
}

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

  public static async persistLocalDump(dump?: string) {
    await Promise.resolve();
    localStorage.setItem(DbRepository.DB_NAME, dump || '');
  }

  public static async exportLocalDump() {
    await Promise.resolve();
    return localStorage.getItem(DbRepository.DB_NAME);
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

  public async list(): Promise<Caixa[]> {
    await Promise.resolve();

    const result = this.db.exec("SELECT name FROM sqlite_temp_master WHERE type='table';");

    if (!Array.isArray(result))
      throw new Error('simulacao não encontrada');

    return this.parseSqlResultToObj(result)[0] || [];
  }

  public async getSimulacao(id: string) {
    await Promise.resolve();

    const result = this.db.exec('select * from simulacao where id = $id', { "$id": id });

    if (result.length === 0)
      throw new Error('simulacao não encontrada');

    return this.parseSqlResultToObj(result)[0][0];
  }

  private parseSqlResultToObj(result: initSqlJs.QueryExecResult[]) {
    return result.map(res => res.values.map(values => res.columns.reduce((p, n, i) => {
      const value = values[i];

      p[n] = typeof (value) === 'number' ? BigNumber(value) : value;

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
    await Promise.resolve();

    // this.db.exec(`CREATE TABLE IF NOT EXISTS "simulacao" ( "id" INTEGER NOT NULL, "titulo" TEXT NULL DEFAULT NULL, "area" REAL NULL DEFAULT 0, "valor" REAL NULL DEFAULT 0, "itbi" REAL NULL DEFAULT 0, "escrituraERegistro" REAL NULL DEFAULT 0, "iptu" REAL NULL DEFAULT 0, "valorEntrada" REAL NULL DEFAULT 0, "taxaDeJuros" REAL NULL DEFAULT 0, "mesDeInicio" REAL NULL DEFAULT 0, "prazo" REAL NULL DEFAULT 0, "createdDate" DATETIME NOT NULL, "updatedDate" DATETIME NULL,PRIMARY KEY ("id"));`);
  }
}