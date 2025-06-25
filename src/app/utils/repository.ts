import localforage from 'localforage'
import { Buffer } from 'buffer';
import { DefaultRepository } from '../repositories/default';
import { DatabaseConnector } from '../repositories/database-connector';

export class RepositoryUtil {
  public static readonly DB_NAME = 'gestao-financeira.settings.db';

  public static async create(data?: ArrayLike<number> | Buffer | null) {
    const localDump = await RepositoryUtil.exportLocalDump();

    if (data == null && localDump != null) {
      data = Buffer.from(await localDump.arrayBuffer());
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

  public static async persistLocalDump(dump?: Blob): Promise<void> {
    await localforage.setItem(RepositoryUtil.DB_NAME, dump || '');
  }

  public static async exportLocalDump(): Promise<Blob | null> {
    return await localforage.getItem<Blob>(RepositoryUtil.DB_NAME);
  }

  public static generateDumpFromExport(exp: Uint8Array) {
    // If exp is already a Blob, return it directly
    if (exp instanceof Blob) {
      return exp;
    }

    // If exp is an ArrayBuffer or Uint8Array, convert to Blob
    if (exp instanceof ArrayBuffer) {
      return new Blob([exp], { type: "application/octet-stream" });
    }
    // If exp is a Uint8Array, convert to Blob
    if (exp instanceof Uint8Array) {
      return new Blob([exp], { type: "application/octet-stream" });
    }

    // As a last resort, stringify and blob
    return new Blob([JSON.stringify(exp)], { type: "application/json" });
  }

  public static async parseFromBase64OrDefault(fileData: Blob): Promise<Blob> {
    const base64Check = await fileData.text();

    const isBase64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/gi.test(base64Check);

    if (isBase64) {
      console.debug('fileData is base64, decoding...');

      const decodedData = atob(base64Check);
      const byteNumbers = new Array(decodedData.length);

      for (let i = 0; i < decodedData.length; i++) {
        byteNumbers[i] = decodedData.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      fileData = new Blob([byteArray], { type: "application/octet-stream" });

      console.debug('fileData decoded successfully');
    } else {
      console.debug('fileData is not base64, returning as is');
    }

    return fileData;
  }
}