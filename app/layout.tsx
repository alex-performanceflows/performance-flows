import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import Script from "next/script";
import CookieConsent from "@/components/legal/CookieConsent";
import "./globals.css";

// GA4 viene montato da CookieConsent solo dopo il consenso. GTM si attiva solo
// se NEXT_PUBLIC_GTM_ID è configurato: senza, non montiamo nulla per evitare
// richieste a un container inesistente.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "G-RLJYB22C34";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Performance Flows | Agenzia eCommerce Profit-First per Shopify",
  description:
    "Scala il profitto del tuo e-commerce Shopify con il metodo ProfitFlow™. Performance Marketing, CRO, Marketing Automation e Google Ads orientati al profitto per store Shopify.",
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
    <html lang="it" className={`${inter.variable} ${dmSerif.variable} h-full antialiased`}>
      <head />
      <body className="min-h-full flex flex-col">
        {/* GTM noscript fallback */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0" width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {children}

        {/* Banner cookie + Google Analytics: GA4 viene caricato solo dopo il
            consenso, così prima della scelta non viene scritto alcun cookie. */}
        <CookieConsent ga4Id={GA4_ID} />

        {/* Google Tag Manager: solo se configurato */}
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}</Script>
        )}
      </body>
    </html>
  );
}
