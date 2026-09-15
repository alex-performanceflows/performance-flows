"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

type Brand = {
  name: string;
  logo: string;
  url: string;
  /** Dimensioni intrinseche del file: servono al browser per riservare lo
   *  spazio, altrimenti con w-auto la larghezza resta 0 e il logo non appare. */
  w: number;
  h: number;
  /** Loghi solo-simbolo, senza wordmark: il nome va scritto sotto. */
  showName?: boolean;
};

const brands: Brand[] = [
  { name: "Gondolina Shoes", logo: "/logos/clients/gondolina.png", url: "https://www.gondolinaofficial.com", w: 2458, h: 603 },
  { name: "Coorie Beauty", logo: "/logos/clients/coorie.svg", url: "https://coorie-beauty.com", w: 97, h: 20 },
  { name: "VitaeDNA", logo: "/logos/clients/vitaedna.svg", url: "https://www.vitaedna.com", w: 238, h: 57 },
  { name: "Centogiri", logo: "/logos/clients/centogiri.png", url: "https://centogiri.com", w: 300, h: 229 },
  { name: "Onlywood", logo: "/logos/clients/onlywood.png", url: "https://www.onlywood.it", w: 600, h: 212 },
  { name: "Half Sumo", logo: "/logos/clients/halfsumo.svg", url: "https://halfsumo.com", w: 218, h: 225, showName: true },
  { name: "Galleria Italia", logo: "/logos/clients/galleria-italia.png", url: "https://galleriaitalia.it", w: 600, h: 73 },
  { name: "Bike & Ride", logo: "/logos/clients/bike-and-ride.png", url: "https://www.bikeandride.it", w: 300, h: 100 },
  { name: "Panacea Pole", logo: "/logos/clients/panacea-pole.svg", url: "https://panaceapole.com", w: 590, h: 768, showName: true },
  { name: "Lost&Found Experience", logo: "/logos/clients/lost-and-found.png", url: "https://www.lostandfoundexperience.com", w: 1890, h: 489 },
];

export default function Brands() {
  return (
    <section id="brand" className="bg-brand-gray py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-12">
            <p className="text-brand-orange font-semibold text-sm uppercase tracking-[0.18em] mb-3">
              Clienti
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue">
              Alcuni tra i brand con cui abbiamo collaborato
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {brands.map((brand, i) => (
            <ScrollReveal key={brand.name} delay={(i % 5) * 0.06}>
              <a
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                title={brand.name}
                className="group bg-white rounded-xl border border-black/[0.06] aspect-[3/2] flex flex-col items-center justify-center gap-2 p-6 hover:border-brand-orange/30 hover:shadow-md transition-all duration-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logo}
                  alt={brand.name}
                  width={brand.w}
                  height={brand.h}
                  className={`${brand.showName ? "max-h-9 md:max-h-10" : "max-h-12 md:max-h-14"} w-auto max-w-full object-contain`}
                />
                {brand.showName && (
                  <span className="text-[11px] md:text-xs font-semibold tracking-wide text-brand-text text-center leading-none">
                    {brand.name}
                  </span>
                )}
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
