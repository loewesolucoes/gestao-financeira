"use client";
import React from "react"

import { EnvProvider } from "./env"
import { AuthProvider } from "./auth"
import { StorageProvider } from "./storage"
import { LoggingProvider } from "./logging"
import { LocationProvider } from "./location";
import { NotificationProvider } from "./notification";

export function AppProviders({ children }: any) {
  return (
    <EnvProvider>
      <NotificationProvider>
        <LocationProvider>
          <LoggingProvider>
            <AuthProvider>
              <StorageProvider>
                {children}
              </StorageProvider>
            </AuthProvider>
          </LoggingProvider>
        </LocationProvider>
      </NotificationProvider>
    </EnvProvider>
  )
}