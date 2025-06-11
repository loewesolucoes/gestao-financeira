import { DB_BROADCAST_CHANNEL_SW_KEY, GestaoMessage } from "./common";
import { WorkerDatabaseConnector } from "./db-connector";

console.debug('database-broadcast-worker start');

const sqlJsWorker = new Worker(process.env.NODE_ENV === 'development' ? `${process.env.BASE_PATH}/worker.sql-wasm-debug.js` : `${process.env.BASE_PATH}/worker.sql-wasm.js`);
// const worker = new Worker((new URL("sql.js/dist/worker.sql-wasm.js", import.meta.url)));

/* eslint-disable no-restricted-globals */

sqlJsWorker.onerror = e => console.error("Database worker error: ", e);
sqlJsWorker.onmessage = (event) => {
  console.debug('sqlJsWorker.onmessage', event);

  if (event.data.id?.startsWith('sw-')) {
    sendSWMessage(event);
  } else {
    self.postMessage(event.data);
  }
}

self.onmessage = (event: MessageEvent<GestaoMessage>) => {
  console.debug('self.onmessage', event);

  sqlJsWorker.postMessage(event.data);
};

const SERVICE_WORKERS_TO_BROADCAST = {} as { [key: string]: { sendChannel: BroadcastChannel, receiveChannel: BroadcastChannel } }
const broadcastChannel = new BroadcastChannel(DB_BROADCAST_CHANNEL_SW_KEY)

broadcastChannel.onmessageerror = (event) => { console.error('broadcastChannel.onmessageerror', event); }
broadcastChannel.onmessage = (event) => {
  const { id, swName, sendChannel, receiveChannel } = event.data
  
  console.log('broadcastChannel.onmessage', id, swName);
  
  if (id === 'connect') {
    const sendBroadcastChannel = new BroadcastChannel(sendChannel);
    const receiveBroadcastChannel = new BroadcastChannel(receiveChannel);
    
    sendBroadcastChannel.onmessageerror = (event) => { console.error('sendBroadcastChannel.onmessageerror', event); }
    sendBroadcastChannel.onmessage = event => {
      console.debug('sendBroadcastChannel.onmessage', event);
    
      sqlJsWorker.postMessage(event.data);
    };

    SERVICE_WORKERS_TO_BROADCAST[swName] = {
      sendChannel: sendBroadcastChannel,
      receiveChannel: receiveBroadcastChannel,
    }
  }
}

function sendSWMessage(event: MessageEvent<any>) {
  const { id } = event.data;
  const swName = `${id}`.split(':')[0];

  console.log('sendSWMessage', id, swName);

  SERVICE_WORKERS_TO_BROADCAST[swName].receiveChannel.postMessage(event.data);
}

console.debug('database-broadcast-worker end');

export { };

