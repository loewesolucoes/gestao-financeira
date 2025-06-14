import localforage from 'localforage'
import { Buffer } from 'buffer';
import { DefaultRepository } from '../repositories/default';
import { DatabaseConnector } from '../repositories/database-connector';

const BUFFER_TYPE = 'base64';

export class RepositoryUtil {
  public static readonly DB_NAME = 'gestao-financeira.settings.db';

  public static async create(data?: ArrayLike<number> | Buffer | null) {
    const localDump = await RepositoryUtil.exportLocalDump();

    if (data == null && localDump != null) {
      data = Buffer.from(localDump, BUFFER_TYPE);
    }

    const db = new DatabaseConnector();

    await db.open(data);

    const repo = new DefaultRepository(db);

    // @ts-ignore
    await repo.runMigrations();

    if (process.env.NODE_ENV !== 'production') {
      //@ts-ignore
      window._db = db;
    }

    // repo.beforeClose();

    return repo;
  }

  public static async persistLocalDump(dump?: string): Promise<void> {
    await localforage.setItem(RepositoryUtil.DB_NAME, dump || '');
  }

  public static async exportLocalDump(): Promise<string | null> {
    return await localforage.getItem<string>(RepositoryUtil.DB_NAME);
  }

  public static generateDumpFromExport(exp: Uint8Array) {
    return Buffer.from(exp).toString(BUFFER_TYPE);
  }
}