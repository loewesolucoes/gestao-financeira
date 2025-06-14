export enum WorkersActions {
  LOAD_ALL = "loadAll",
  CONNECT = "connect",
}

export interface GestaoMessage {
  id: number;
  action: WorkersActions;
  params: any;
}

export const UNIQUE_KEY = crypto.randomUUID();
export const DB_BROADCAST_CHANNEL_SW_KEY = 'DB_BROADCAST_CHANNEL_SW'