"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

// width/height = rapporto d'aspetto intrinseco del file: serve al browser per
// riservare lo spazio prima del caricamento (con w-auto e nessuna dimensione
// nota la larghezza calcolata resta 0 e l'immagine non viene mai disegnata).
const partners = [
  { name: "Google Partner", src: "/logos/partners/google-logo.svg", w: 74, h: 24, height: "h-6 md:h-7" },
  { name: "Shopify Partner", src: "/logos/partners/shopify-partner.svg", w: 304, h: 87, height: "h-6 md:h-7" },
  { name: "Klaviyo Partner", src: "/logos/partners/klaviyo-partner.svg", w: 581, h: 172, height: "h-5 md:h-6" },
  { name: "Channable Partner", src: "/logos/partners/channable-partner.svg", w: 762, h: 194, height: "h-5 md:h-6" },
  { name: "ProfitMetrics Partner", src: "/logos/partners/profitmetrics-partner.svg", w: 165, h: 24, height: "h-4 md:h-5" },
];

export default function Partners() {
  return (
    <section className="bg-white border-b border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
              Partner ufficiali
            </p>
            <div className="w-px h-8 bg-gray-200 hidden lg:block" />
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-12">
              {partners.map((partner) => (
                <div key={partner.name} title={partner.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.src}
                    alt={partner.name}
                    width={partner.w}
                    height={partner.h}
                    className={`${partner.height} w-auto`}
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
