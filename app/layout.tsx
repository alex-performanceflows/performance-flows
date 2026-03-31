import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
        {/* Iubenda */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `var _iub = _iub || [];
_iub.csConfiguration = {
  "siteId": 0,
  "cookiePolicyId": 0,
  "lang": "it"
};`,
          }}
        />
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
