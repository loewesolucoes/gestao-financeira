"use client";

import React, { createContext, useEffect, useState } from "react"
import { NotificationUtil } from "../utils/notification";

interface NotificationMessage {
  message: string
}

const NotificationContext = createContext({
  notifications: [] as NotificationMessage[],
});

export function NotificationProvider(props: any) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const broadcast = new BroadcastChannel(NotificationUtil.NOTIFICATION_BROADCAST_CHANNEL_KEY);

    broadcast.onmessage = (event) => {
      setNotifications(n => [...n, event.data]);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
      }}
      {...props}
    />
  )
}

export const useNotification = () => React.useContext(NotificationContext)