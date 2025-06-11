import { IDatabase } from "../repositories/database-connector";
import { DB_BROADCAST_CHANNEL_SW_KEY, UNIQUE_KEY } from "./common";

const DB_CHANNEL_SEND = `gestao-database-channel-send-${UNIQUE_KEY}`;
const DB_CHANNEL_RECEIVE = `gestao-database-channel-receive-${UNIQUE_KEY}`;

export class WorkerDatabaseConnector implements IDatabase {
  private readonly broadcastSend: BroadcastChannel = new BroadcastChannel(DB_CHANNEL_SEND);
  private readonly broadcastReceive: BroadcastChannel = new BroadcastChannel(DB_CHANNEL_RECEIVE);
  private readonly broadcastConnect: BroadcastChannel = new BroadcastChannel(DB_BROADCAST_CHANNEL_SW_KEY);
  private readonly onMessages: ((event: MessageEvent) => void)[] = [];
  private readonly onExecMessages: { [key: string]: (event: MessageEvent) => void } = {};
  private readonly workerName: string
  private currentId = 0;

  constructor(workerName: string) {
    this.workerName = `sw-${workerName}`;

    this.broadcastReceive.onmessage = (event) => {
      const { id } = event.data;
      const action = this.onExecMessages[id];

      if (action == null) {
        // se estiver dando erro nessa parte deve ser devido a possuir duas tabs abertas
        console.debug('invalid message id', id, event);

        throw new Error(`invalid message id => ${id} (pode ser que você esteja com outra tab aberta)`);
      }

      action(event);
      delete this.onExecMessages[id];
    }

    this.broadcastReceive.onmessageerror = (event) => {
      console.error('WorkerDatabaseConnector.onmessageerror', event);
    }

    this.broadcastConnect.postMessage({
      id: 'connect',
      swName: this.workerName,
      sendChannel: DB_CHANNEL_SEND,
      receiveChannel: DB_CHANNEL_RECEIVE,
    })
  }

  public setOnMessage(action: (e: MessageEvent) => void) {
    this.onMessages.push(action);
  }

  public postReceive(event: MessageEvent) {
    this.broadcastReceive.postMessage(event.data);
  }

  public async exec(sql: string, params?: any): Promise<initSqlJs.QueryExecResult[]> {
    const nextId = `${this.workerName}:exec-${this.currentId++}`;

    return new Promise((resolve, reject) => {
      this.onExecMessages[nextId] = event => {
        console.debug('WorkerDatabaseConnector.onmessage', event.data.id, nextId, event);

        if (event.data.id === nextId) {
          if (event.data.error)
            reject(event.data);
          else
            resolve(event.data.results);
        }
      };

      console.debug('WorkerDatabaseConnector.sending', 'exec', nextId, sql, params);

      this.broadcastSend.postMessage({
        id: nextId,
        action: "exec",
        sql: sql,
        params: params
      });
    });
  }

  public async export(): Promise<Uint8Array> {
    const nextId = `${this.workerName}:export-${this.currentId++}`;

    return new Promise((resolve, reject) => {
      this.onExecMessages[nextId] = event => {
        console.debug('WorkerDatabaseConnector.onmessage', event.data.id, nextId, event);

        if (event.data.id === nextId) {
          if (event.data.error)
            reject(event.data);
          else
            resolve(event.data.buffer);
        }
      };

      console.debug('WorkerDatabaseConnector.sending', 'export', nextId);

      this.broadcastSend.postMessage({
        id: nextId,
        action: "export",
      });
    });
  }

  public async open(data?: Buffer | ArrayLike<number> | null | undefined): Promise<any> {
    throw new Error("Method not implemented.");
  }
}