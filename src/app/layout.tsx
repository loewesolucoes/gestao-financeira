import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.scss";
import "./ps-components.css";
import Script from "next/script";

// Design system fonts, self-hosted by next/font: Manrope for UI, Newsreader for display figures.
// _tokens.scss reads the CSS variables below as --font-sans / --font-display.
const sans = Manrope({ weight: ['500', '600', '700', '800'], subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const display = Newsreader({ weight: ['500'], subsets: ['latin'], variable: '--font-newsreader', display: 'swap' });

const basePath = process.env.BASE_PATH || ''

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={`${sans.variable} ${display.variable}`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${basePath}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${basePath}/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${basePath}/favicon-16x16.png`} />
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
        <link rel="mask-icon" href={`${basePath}/safari-pinned-tab.svg`} color="#1d6b41" />
        <meta name="msapplication-TileColor" content="#12301f" />
        <meta name="theme-color" content="#f4f3ee" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0e1210" media="(prefers-color-scheme: dark)" />
        <Script id="gtm" strategy="afterInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-54VR7557');
          `}
        </Script>
      </head>
      <body>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-54VR7557" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        {children}
      </body>
    </html>
  );
}


export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: process.env.NEXT_PUBLIC_TITLE,
    description: process.env.NEXT_PUBLIC_DESCRIPTION,
    creator: process.env.NEXT_PUBLIC_CREATOR,
    applicationName: process.env.NEXT_PUBLIC_TITLE,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: process.env.NEXT_PUBLIC_TITLE,
      startupImage: process.env.NEXT_PUBLIC_IMAGE,
    },
    openGraph: {
      title: process.env.NEXT_PUBLIC_TITLE,
      description: process.env.NEXT_PUBLIC_DESCRIPTION,
      type: "website",
      url: process.env.NEXT_PUBLIC_URL,
      images: process.env.NEXT_PUBLIC_IMAGE,
    },
    twitter: {
      title: process.env.NEXT_PUBLIC_TITLE,
      description: process.env.NEXT_PUBLIC_DESCRIPTION,
      card: "summary_large_image",
      site: process.env.NEXT_PUBLIC_URL,
      images: process.env.NEXT_PUBLIC_IMAGE,
    },
  }
}