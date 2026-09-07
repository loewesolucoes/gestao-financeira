import { TipoDeNotificacao } from "../repositories/notificacoes";

export interface NotificationBroadcastPayload {
  message: string
  titulo?: string
  tipo: TipoDeNotificacao
}

export class NotificationUtil {
  public static readonly TIME_TO_CLOSE_NOTIFICATION = 10000;
  public static readonly NOTIFICATION_BROADCAST_CHANNEL_KEY = 'NOTIFICATION_BROADCAST_CHANNEL_KEY'
  public static readonly broadcast: BroadcastChannel = new BroadcastChannel(NotificationUtil.NOTIFICATION_BROADCAST_CHANNEL_KEY);

  /** Mostra um toast efêmero e persiste como Notificação (sino) no NotificationContext. */
  public static send(message: string, titulo?: string): any {
    const payload: NotificationBroadcastPayload = { message, titulo, tipo: TipoDeNotificacao.NOTIFICACAO };

    NotificationUtil.broadcast.postMessage(payload);
  }

  /** Mostra um toast efêmero e persiste como Mensagem (envelope) no NotificationContext. */
  public static sendMensagem(titulo: string, descricao: string): any {
    const payload: NotificationBroadcastPayload = { message: descricao, titulo, tipo: TipoDeNotificacao.MENSAGEM };

    NotificationUtil.broadcast.postMessage(payload);
  }
}
