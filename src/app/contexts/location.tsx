"use client";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
import React, { createContext, useState } from "react"

interface LocationProviderContext {
  params: ReadonlyURLSearchParams
  redirectTo: (path: string) => void
}

const defaultParams = { get: () => null } as any;
const LocationContext = createContext<LocationProviderContext>({
  params: defaultParams,
  redirectTo: (path: string) => { },
})

export function LocationProvider(props: any) {
  const router = useRouter()
  const [params, setParams] = useState(defaultParams);

  if (typeof window !== 'undefined' && params === defaultParams) {
    // eslint-disable-next-line
    const params = useSearchParams();
    setParams(params)
  }

  function redirectTo(path: string) {
    router.push(path);
  }

  return (
    <LocationContext.Provider
      value={{
        params,
        redirectTo,
      }}
      {...props}
    />
  )
}

export const useLocation = () => React.useContext<LocationProviderContext>(LocationContext)