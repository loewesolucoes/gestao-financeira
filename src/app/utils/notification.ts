export class NotificationUtil {
  public static readonly TIME_TO_CLOSE_NOTIFICATION = 10000;
  public static readonly NOTIFICATION_BROADCAST_CHANNEL_KEY = 'NOTIFICATION_BROADCAST_CHANNEL_KEY'
  public static readonly broadcast: BroadcastChannel = new BroadcastChannel(NotificationUtil.NOTIFICATION_BROADCAST_CHANNEL_KEY);

  public static send(message: string): any {
    NotificationUtil.broadcast.postMessage({
      message,
    })
  }
}
