import { defaultCache } from '@serwist/next/browser';
import type { PrecacheEntry } from '@serwist/precaching';
import { installSerwist } from '@serwist/sw';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const cache = process.env.NODE_ENV === 'development' ? [] : defaultCache

const revision = crypto.randomUUID();
// https://serwist.pages.dev/
// https://medium.com/@uriser/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7
installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: cache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        revision,
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});