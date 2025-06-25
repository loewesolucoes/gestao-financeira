"use client";

import React, { createContext, useState } from "react"

interface ErrorHandlerProviderContext {
  handleError: (error: any) => void;
}

const ErrorHandlerContext = createContext<ErrorHandlerProviderContext>({
  handleError: console.error,
})

export function ErrorHandlerProvider(props: any) {
  const [error, setError] = useState<any>();

  function handleError(error: any) {
    setError(error);
  }

  if (error) {
    console.debug("ErrorHandlerProvider error", error);

    throw error;
  }

  return (
    <ErrorHandlerContext.Provider
      value={{
        handleError,
      }}
      {...props}
    />
  )
}

export const useErrorHandler = () => React.useContext<ErrorHandlerProviderContext>(ErrorHandlerContext)