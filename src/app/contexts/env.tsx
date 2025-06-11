"use client";

import React, { createContext, useState, useEffect } from "react"

const { version: packageVersion, name: packageName } = require('../../../package.json');


const EnvContext = createContext({
  isDev: false,
  isMobile: false,
  logLevel: 'info',
  version: '',
  aplicationName: '',
})

export function EnvProvider(props: any) {
  const [isDev, setIsDev] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [logLevel, setLogLevel] = useState('info');
  const [version, setVersion] = useState(packageVersion);
  const [aplicationName, setAplicationName] = useState(packageName);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development')
    setLogLevel(process.env.LOG_LEVEL + '')
    setVersion(packageVersion);
    setAplicationName(packageName);
  }, [process.env]);


  function handleWindowSizeChange() {
    setIsMobile(window.innerWidth < 992);
  }

  useEffect(() => {
    handleWindowSizeChange();
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    }
  }, []);

  return (
    <EnvContext.Provider
      value={{
        isDev,
        isMobile,
        logLevel,
        version,
        aplicationName,
      }}
      {...props}
    />
  )
}

export const useEnv = () => React.useContext(EnvContext)