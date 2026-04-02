import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indice di Scalabilità Shopify | Performance Flows",
  description:
    "Scopri il potenziale di crescita del tuo store Shopify con il nostro check-up gratuito in 3 minuti. 15 domande per valutare advertising, CRO, tracking e margini — risultato personalizzato immediato.",
  keywords: [
    "check-up ecommerce Shopify",
    "scalabilità store Shopify",
    "quiz performance ecommerce",
    "Google Ads Shopify audit",
    "ottimizzazione profitto Shopify",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://performanceflows.com/indice-di-scalabilita-shopify",
  },
  openGraph: {
    title: "Indice di Scalabilità Shopify — Check-up Gratuito in 3 Minuti",
    description:
      "Scopri quanto è scalabile il tuo store Shopify. 15 domande su advertising, CRO, tracking e margini. Risultato personalizzato gratuito.",
    url: "https://performanceflows.com/indice-di-scalabilita-shopify",
    siteName: "Performance Flows",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indice di Scalabilità Shopify | Performance Flows",
    description:
      "Check-up gratuito in 3 minuti per scoprire il potenziale di crescita del tuo store Shopify.",
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* FAQ schema for the quiz page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Indice di Scalabilità Shopify",
            description:
              "Check-up gratuito per valutare il potenziale di scalabilità del tuo store Shopify.",
            url: "https://performanceflows.com/indice-di-scalabilita-shopify",
            isPartOf: {
              "@type": "WebSite",
              name: "Performance Flows",
              url: "https://performanceflows.com",
            },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://performanceflows.com",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Indice di Scalabilità Shopify",
                  item: "https://performanceflows.com/indice-di-scalabilita-shopify",
                },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  );
}
