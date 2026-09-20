"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import Marquee from "@/components/ui/Marquee";

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
    <section className="bg-white border-b border-[color:var(--rule)] py-12 md:py-14">
      <div className="max-w-[88rem] mx-auto px-6 md:px-10">
        <ScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="h-px w-6 bg-brand-orange/70" aria-hidden="true" />
              <p className="eyebrow text-brand-text-light whitespace-nowrap">Partner ufficiali</p>
            </div>

            <Marquee className="flex-1" durationSeconds={42}>
              {partners.map((partner) => (
                <div key={partner.name} title={partner.name} className="desaturate-hover flex-shrink-0">
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
            </Marquee>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
