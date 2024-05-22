import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.scss";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

const basePath = process.env.BASE_PATH || ''

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href={`${basePath}/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${basePath}/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${basePath}/favicon-16x16.png`} />
        <link rel="manifest" href={`${basePath}/site.webmanifest`} />
        <link rel="mask-icon" href={`${basePath}/safari-pinned-tab.svg`} color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#65a246" />
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
      <body className={inter.className}>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-54VR7557" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        {children}
      </body>
    </html>
  );
}


export async function generateMetadata({ params }): Promise<Metadata> {
  const title = "Gestão financeira";
  const description = "Nosso sistema de gestão financeira é uma solução abrangente e inteligente projetada para empresas e indivíduos. Com recursos avançados, como controle de caixa, balancetes automatizados, registro de notas fiscais e gerenciamento de investimentos, ajudamos você a manter suas finanças organizadas e tomar decisões informadas. Nossa interface amigável e segura permite que você acesse suas informações financeiras de qualquer lugar, garantindo eficiência e precisão. Escolha nossa plataforma para otimizar suas operações financeiras e alcançar seus objetivos.";
  const url = "https://loewesolucoes.github.io/gestao-financeira";
  const image = "https://loewesolucoes.github.io/gestao-financeira/site.png";

  return {
    title: title,
    description: description,
    creator: 'Érico de Souza Loewe',
    openGraph: {
      title: title,
      description: description,
      type: "website",
      url: url,
      images: image
    },
    twitter: {
      title: title,
      description: description,
      card: "summary_large_image",
      site: url,
      images: image
    },
  }
}