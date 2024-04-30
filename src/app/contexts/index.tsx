"use client";
import React from "react"

import { EnvProvider } from "./env"
import { AuthProvider } from "./auth"
import { StorageProvider } from "./storage"
import { LoggingProvider } from "./logging"

export function AppProviders({ children }: any) {
  return (
    <EnvProvider>
      <LoggingProvider>
        <AuthProvider>
          <StorageProvider>
            {children}
          </StorageProvider>
        </AuthProvider>
      </LoggingProvider>
    </EnvProvider>
  )
}