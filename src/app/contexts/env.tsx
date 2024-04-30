"use client";

import React, { createContext, useState, useEffect } from "react"

const { version: packageVersion, name: packageName } = require('../../../package.json');


const EnvContext = createContext({
  isDev: false,
  logLevel: 'info',
  version: '',
  aplicationName: '',
})

export function EnvProvider(props: any) {
  const [isDev, setIsDev] = useState(false);
  const [logLevel, setLogLevel] = useState('info');
  const [version, setVersion] = useState(packageVersion);
  const [aplicationName, setAplicationName] = useState(packageName);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development')
    setLogLevel(process.env.LOG_LEVEL + '')
    setVersion(packageVersion);
    setAplicationName(packageName);
  }, [process.env]);

  return (
    <EnvContext.Provider
      value={{
        isDev,
        logLevel,
        version,
        aplicationName,
      }}
      {...props}
    />
  )
}

export const useEnv = () => React.useContext(EnvContext)