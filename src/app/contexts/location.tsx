"use client";

import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
import React, { createContext, useState, useEffect, Suspense } from "react"

interface LocationProviderContext {
  params: ReadonlyURLSearchParams
  redirectTo: (path: string) => void
}

const defaultParams = { get: () => null } as any;
const LocationContext = createContext<LocationProviderContext>({
  params: defaultParams,
  redirectTo: (path: string) => { },
})

// `useSearchParams()` must be called unconditionally on every render of a
// single, dedicated component (wrapped in Suspense, per Next.js docs), rather
// than lazily/conditionally as before. Calling it conditionally (only until
// the first sync) breaks the Rules of Hooks and goes stale as soon as the
// query string changes while the surrounding tree stays mounted (e.g.
// switching tabs via `redirectTo` on the same page), causing a "Rendered
// fewer hooks than expected" crash.
function LocationParamsSync({ onParamsChange }: { onParamsChange: (params: ReadonlyURLSearchParams) => void }) {
  const params = useSearchParams();

  useEffect(() => {
    onParamsChange(params);
  }, [params, onParamsChange]);

  return null;
}

// Synchronously derive the initial params from the browser's current URL
// (instead of starting from `defaultParams` and waiting for an effect to
// sync). This matters for consumers that read a query param once on mount
// (e.g. `/auth/redirect` reading `code` in a `useEffect(..., [])`) — they
// must see the real value on the very first render, not a null placeholder
// that only becomes real one commit later.
function initialParamsFromWindow(): ReadonlyURLSearchParams {
  if (typeof window === 'undefined')
    return defaultParams;

  return new URLSearchParams(window.location.search) as unknown as ReadonlyURLSearchParams;
}

export function LocationProvider({ children, ...props }: any) {
  const router = useRouter()
  const [params, setParams] = useState<ReadonlyURLSearchParams>(initialParamsFromWindow);

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
    >
      <Suspense fallback={null}>
        <LocationParamsSync onParamsChange={setParams} />
      </Suspense>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => React.useContext<LocationProviderContext>(LocationContext)