
export interface IDatabase {
  exec(sql: string, params?: any): Promise<initSqlJs.QueryExecResult[]>
  export(): Promise<Uint8Array>
  open(data?: ArrayLike<number> | Buffer | null): Promise<any>
}


export class DatabaseConnector implements IDatabase {
  private currentId = 0;
  private readonly worker: Worker;
  private readonly onMessages: { [key: string]: (event: MessageEvent) => void } = {};

  constructor() {
    this.worker = new Worker(new URL("../workers/db-broadcast.ts", import.meta.url));
    this.worker.onerror = e => console.log("Worker error: ", e);
    this.worker.onmessage = (event) => {
      const { id } = event.data;
      const action = this.onMessages[id];

      if (action == null) {
        console.error('invalid message id', id, event);

        throw new Error(`invalid message id => ${id}`);
      }

      action(event);
      delete this.onMessages[id];
    }
  }

  public async exec(sql: string, params?: any): Promise<initSqlJs.QueryExecResult[]> {
    const nextId = `exec-${this.currentId++}`;

    return new Promise((resolve, reject) => {
      this.onMessages[nextId] = event => {
        console.debug('DatabaseConnector.onmessage', event.data.id, nextId, event);

        if (event.data.id === nextId) {
          if (event.data.error)
            reject(event.data);
          else
            resolve(event.data.results);
        }
      };

      console.debug('DatabaseConnector.sending', 'exec', nextId, sql, params);

      this.worker.postMessage({
        id: nextId,
        action: "exec",
        sql: sql,
        params: params
      });
    });
  }

  public async export(): Promise<Uint8Array> {
    const nextId = `export-${this.currentId++}`;

    return new Promise((resolve, reject) => {
      this.onMessages[nextId] = event => {
        console.debug('DatabaseConnector.onmessage', event.data.id, nextId, event);
        if (event.data.id === nextId) {
          if (event.data.error)
            reject(event.data);
          else
            resolve(event.data.buffer);
        }
      };

      console.debug('DatabaseConnector.sending', 'export', nextId);

      this.worker.postMessage({
        id: nextId,
        action: "export",
      });
    });
  }

  public async open(data?: ArrayLike<number> | Buffer | null): Promise<any> {
    const nextId = `open-${this.currentId++}`;

    return new Promise((resolve, reject) => {
      this.onMessages[nextId] = event => {
        console.debug('DatabaseConnector.onmessage', event.data.id, nextId, event);
        if (event.data.id === nextId) {
          if (event.data.error)
            reject(event.data);
          else
            resolve(event.data);
        }
      };

      console.debug('DatabaseConnector.sending', 'open', nextId);

      this.worker.postMessage({
        id: nextId,
        action: "open",
        buffer: data, /*Optional. An ArrayBuffer representing an SQLite Database file*/
      });
    });
  }
}