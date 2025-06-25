import BigNumber from "bignumber.js";
import moment from "moment";
import { RepositoryUtil } from "../utils/repository";
import { IDatabase } from "./database-connector";

export enum MapperTypes {
  TEXT,
  DATE,
  DATE_TIME,
  NUMBER,
  BOOLEAN,
  IGNORE,
}

export enum TableNames {
  TRANSACOES = "transacoes",
  PATRIMONIO = "patrimonio",
  NOTAS = "notas",
  METAS = "metas",
  PARAMETROS = "parametros",
  CATEGORIA_TRANSACOES = "categoria_transacoes",
}

export interface DefaultFields {
  id: number
  createdDate: Date
  updatedDate?: Date
}

const RUNNED_MIGRATION_CODE = 'runned';

export class DefaultRepository {
  public readonly DEFAULT_MAPPING = { createdDate: MapperTypes.DATE_TIME, updatedDate: MapperTypes.DATE_TIME };
  public constructor(protected db: IDatabase) { }

  public async saveAll(tableName: TableNames, items: DefaultFields[]) {
    const fullCommand = ['BEGIN TRANSACTION'];
    let allParams = {};

    console.debug('saveAll:start')

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      let execution = {} as any;

      if (item.id == null)
        execution = this.createInsertCommand(tableName, item, `${index}`);
      else
        execution = this.createUpdateCommand(tableName, item, `${index}`);

      const { command, params } = execution;

      fullCommand.push(command);
      allParams = Object.assign(allParams, params);
    }

    fullCommand.push('COMMIT');

    const fullCommandStr = fullCommand.join(';');

    console.debug('saveAll:parse:ok')

    await this.db.exec(fullCommandStr, allParams);

    console.debug('saveAll:exec:ok')

    await this.persistDb();

    console.debug('saveAll:persist:ok')

    console.debug('saveAll:end')
  }

  public async save(tableName: TableNames, data: any) {
    let result = {} as any;

    if (data?.id != null)
      result = await this.update(tableName, data);
    else
      result = await this.insert(tableName, data);

    await this.persistDb();

    return result;
  }

  public async delete(tableName: TableNames, id: number) {
    let result = {} as any;

    await this.db.exec(`delete from ${tableName} where id = $id`, { "$id": id })

    await this.persistDb();

    return result;
  }

  public async list<T>(tableName: TableNames): Promise<T[]> {
    const result = await this.db.exec(`SELECT * FROM ${tableName} order by createdDate desc`);

    if (!Array.isArray(result))
      throw new Error(`${tableName} não encontrado (a)`);

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0] || [];
  }

  public async get<T>(tableName: TableNames, id: string): Promise<T> {
    const result = await this.db.exec(`select * from ${tableName} where id = $id`, { "$id": id });

    if (result.length === 0)
      throw new Error(`${tableName} não encontrado (a)`);

    return this.parseSqlResultToObj(result, this.DEFAULT_MAPPING)[0][0];
  }

  protected async insert(tableName: TableNames, data: any) {
    const { command, params, nextData } = this.createInsertCommand(tableName, data);
    const fullCommand = `${command};SELECT LAST_INSERT_ROWID();`

    const result = await this.db.exec(fullCommand, params);

    nextData.id = result[0].values[0][0];

    return nextData;
  }

  protected createInsertCommand(tableName: TableNames, data: any, paramsPrefix: string = '') {
    const nextData = { ...this.parseModelBeforeSave(data), createdDate: new Date() };
    const { keys, params } = this.parseToCommand(nextData, paramsPrefix);
    const valuesCommand = `(${keys.map(k => `$${k}${paramsPrefix}`).join(', ')})`
    const command = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES ${valuesCommand}`;

    return { command, params, nextData, valuesCommand }
  }

  protected async update(tableName: TableNames, data: any) {
    const { command, params } = this.createUpdateCommand(tableName, data);

    await this.db.exec(command, params);

    return this.get(tableName, data.id);
  }

  protected createUpdateCommand(tableName: TableNames, data: any, paramsPrefix: string = '') {
    const nextData = { ...this.parseModelBeforeSave(data), updatedDate: new Date() };
    const { keys, params } = this.parseToCommand(nextData, paramsPrefix);
    const command = `UPDATE ${tableName} SET ${keys.map(k => `${k}=$${k}${paramsPrefix}`).join(', ')} WHERE id=$id${paramsPrefix}`;

    return { command, params, nextData }
  }

  private parseModelBeforeSave(data: any) {
    const nextData = { ...data };

    for (const key in nextData) {
      if (key.startsWith('__')) {
        delete nextData[key];
      }
    }
    return nextData;
  }

  protected parseSqlResultToObj(result: initSqlJs.QueryExecResult[], mapper?: { [key: string]: MapperTypes }) {
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
          } else if (mapper[n] === MapperTypes.BOOLEAN) {
            p[n] = !!value;
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

  protected parseToCommand(nextData: any, paramsPrefix: string = '') {
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

  protected async runMigrations() {
    await this.db.exec(`CREATE TABLE IF NOT EXISTS "migrations" ("id" INTEGER NOT NULL,"name" TEXT NULL DEFAULT NULL,"executedDate" DATETIME NULL,PRIMARY KEY ("id"));`);

    const result = await this.db.exec('select * from "migrations"');
    const migrations = (this.parseSqlResultToObj(result)[0] || []).reduce((p, n) => { p[n.name] = n; return p; }, {} as any);

    if (migrations['parametros'] == null) {
      await this.db.exec(`CREATE TABLE IF NOT EXISTS "parametros" ("id" INTEGER NOT NULL,"chave" TEXT NOT NULL,"valor" TEXT NULL, "createdDate" DATETIME NOT NULL, "updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['parametros'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['transacoes'] == null) {
      await this.db.exec(`CREATE TABLE IF NOT EXISTS "transacoes" ("id" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"data" DATETIME NOT NULL,"tipo" INTEGER NULL DEFAULT NULL,"local" TEXT NULL DEFAULT NULL,"comentario" TEXT NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['transacoes'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['transacoes_campo_ordem'] == null) {
      await this.db.exec(`ALTER TABLE "transacoes" ADD COLUMN "ordem" INTEGER NULL;`);
      migrations['transacoes_campo_ordem'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['saldos'] == null) {
      await this.db.exec(`CREATE TABLE IF NOT EXISTS "saldos" ("id" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"data" DATETIME NOT NULL,"local" TEXT NULL DEFAULT NULL,"comentario" TEXT NULL DEFAULT NULL, "ordem" INTEGER NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['saldos'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['rename_saldos_to_patrimonio'] == null) {
      await this.db.exec(`ALTER TABLE 'saldos' RENAME TO 'patrimonio'`);
      migrations['rename_saldos_to_patrimonio'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['notas'] == null) {
      await this.db.exec(`CREATE TABLE IF NOT EXISTS "notas" ("id" INTEGER NOT NULL,"data" DATETIME NOT NULL,"descricao" TEXT NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['notas'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['notas_campo_comentario_e_tipo'] == null) {
      await this.db.exec(`ALTER TABLE "notas" ADD COLUMN "tipo" INTEGER NULL; ALTER TABLE "notas" ADD COLUMN "comentario" TEXT NULL;`);
      migrations['notas_campo_comentario_e_tipo'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['metas'] == null) {
      await this.db.exec(`CREATE TABLE IF NOT EXISTS "metas" ("id" INTEGER NOT NULL,"data" DATETIME NOT NULL,"descricao" TEXT NULL DEFAULT NULL, "comentario" TEXT NULL, "tipo" INTEGER NULL, "done" INTEGER NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      migrations['metas'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['categoria_transacoes'] == null) {
      await this.db.exec(`CREATE TABLE IF NOT EXISTS "categoria_transacoes" ("id" INTEGER NOT NULL, "descricao" TEXT NULL DEFAULT NULL, "comentario" TEXT NULL, "tipo" INTEGER NULL, "active" INTEGER NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
      this.db.exec(`INSERT INTO "categoria_transacoes" (descricao, comentario, active, createdDate) VALUES ('Outros', 'Categoria para transações diversas', 1, datetime('now'));`);
      migrations['categoria_transacoes'] = RUNNED_MIGRATION_CODE;
    }

    if (migrations['categoria_transacoes_chave_estrangeira'] == null) {
      await this.db.exec(`
        PRAGMA foreign_keys = OFF;
        ALTER TABLE "transacoes" ADD COLUMN "categoriaId" INTEGER NOT NULL REFERENCES "categoria_transacoes" ("id") DEFAULT 1;
        PRAGMA foreign_keys = ON;
      `.trim());
      migrations['categoria_transacoes_chave_estrangeira'] = RUNNED_MIGRATION_CODE;
    }

    const runnedMigrations = Object.keys(migrations).filter(x => migrations[x] === RUNNED_MIGRATION_CODE).reduce((p, n) => { p.push({ name: n, executedDate: new Date() }); return p; }, [])

    let allParams = {};
    let fullCommand = '';

    if (runnedMigrations.length > 0) {
      runnedMigrations.forEach((x, i) => {
        const { keys, params } = this.parseToCommand(x, `${i}`);
        const command = `INSERT INTO "migrations" (${keys.join(', ')}) VALUES (${keys.map(k => `$${k}${i}`).join(', ')})`;

        fullCommand = `${fullCommand};${command}`
        allParams = { ...allParams, ...params }
      });

      await this.db.exec(fullCommand, allParams);
    }

    await this.persistDb();
  }

  public async exportOriginalDump() {
    return await this.db.export();
  }

  public async persistDb() {
    const dump = await this.exportDump();

    await RepositoryUtil.persistLocalDump(dump)
    console.debug("persistDb ok");
  }

  private async exportDump(): Promise<Blob> {
    const exp = await this.db.export();

    return RepositoryUtil.generateDumpFromExport(exp);
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
}