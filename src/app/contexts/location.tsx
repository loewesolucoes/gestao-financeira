"use client";

import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import React, { createContext, useState, useEffect } from "react"

interface LocationProviderContext {
  params: ReadonlyURLSearchParams
}

const defaultParams = { get: () => null } as any;
const LocationContext = createContext<LocationProviderContext>({
  params: defaultParams,
})

export function LocationProvider(props: any) {
  const [params, setParams] = useState(defaultParams);

  if (typeof window !== 'undefined' && params === defaultParams) {
    // eslint-disable-next-line
    const params = useSearchParams();
    setParams(params)
  }

  return (
    <LocationContext.Provider
      value={{
        params,
      }}
      {...props}
    />
  )
}

export const useLocation = () => React.useContext<LocationProviderContext>(LocationContext)