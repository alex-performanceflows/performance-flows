import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Performance Flows | Agenzia eCommerce Profit-First per Shopify",
  description:
    "Scala il profitto del tuo e-commerce Shopify con il metodo ProfitFlow™. Performance Marketing, CRO, Marketing Automation e Google Ads orientati al profitto. Consulenza gratuita.",
  keywords: [
    "Google Ads Shopify",
    "ecommerce profit-first",
    "ProfitFlow",
    "Performance Marketing",
    "CRO Shopify",
    "Marketing Automation",
    "agenzia ecommerce Italia",
  ],
  authors: [{ name: "Performance Flows" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://performanceflows.com",
  },
  openGraph: {
    title: "Performance Flows | Agenzia eCommerce Profit-First per Shopify",
    description:
      "Scala il profitto del tuo e-commerce Shopify con il metodo ProfitFlow™. Google Ads, CRO, Tracking e Marketing Automation orientati al profitto.",
    url: "https://performanceflows.com",
    siteName: "Performance Flows",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Performance Flows | eCommerce Profit-First per Shopify",
    description:
      "Scala il profitto del tuo e-commerce Shopify con il metodo ProfitFlow™.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RLJYB22C34" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-RLJYB22C34');`,
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');`,
          }}
        />
        {/* Iubenda — cookie consent */}
        <script type="text/javascript" src="https://embeds.iubenda.com/widgets/bf381bbd-7740-49f9-b833-7c4b3ab340d8.js" async />
      </head>
      <body className="min-h-full flex flex-col">
        {/* GTM noscript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        {/* Iubenda policy embed loader */}
        <script type="text/javascript" src="https://cdn.iubenda.com/iubenda.js" async />
      </body>
    </html>
  );
}
