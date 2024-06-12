// src/app/manifest.ts

import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    "id": "gestao-financeira",
    "name": process.env.NEXT_PUBLIC_TITLE,
    "short_name": process.env.NEXT_PUBLIC_TITLE,
    "start_url": `${process.env.BASE_PATH}/`,
    "icons": [
      {
        "src": `${process.env.BASE_PATH}/android-chrome-192x192.png`,
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": `${process.env.BASE_PATH}/android-chrome-512x512.png`,
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "theme_color": "#65a246",
    "background_color": "#65a246",
    "display": "standalone",
    "lang": "pt-br",
  };
}