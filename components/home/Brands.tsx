"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

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
    <section id="brand" className="paper-grain bg-white py-24 md:py-36">
      <div className="max-w-[88rem] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Clienti"
          title="Alcuni tra i brand con cui abbiamo collaborato"
          align="center"
          className="mb-16 md:mb-20 max-w-3xl mx-auto"
        />

        {/* Muro di loghi su griglia di filetti: nessun riquadro, solo allineamento */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-[color:var(--rule)]">
          {brands.map((brand, i) => (
            <ScrollReveal key={brand.name} delay={(i % 5) * 0.05}>
              <a
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                title={brand.name}
                className="group relative h-full border-r border-b border-[color:var(--rule)] aspect-[3/2] flex flex-col items-center justify-center gap-2.5 p-7 transition-colors duration-500 hover:bg-brand-paper"
              >
                <svg
                  aria-hidden="true"
                  className="absolute top-4 right-4 w-3.5 h-3.5 text-brand-text-light opacity-0 -translate-x-1 translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 17L17 7M9 7h8v8" />
                </svg>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logo}
                  alt={brand.name}
                  width={brand.w}
                  height={brand.h}
                  className={`desaturate-hover ${brand.showName ? "max-h-9 md:max-h-10" : "max-h-11 md:max-h-14"} w-auto max-w-full object-contain`}
                />
                {brand.showName && (
                  <span className="text-[11px] md:text-xs font-semibold tracking-[0.04em] text-brand-text-light text-center leading-none">
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
