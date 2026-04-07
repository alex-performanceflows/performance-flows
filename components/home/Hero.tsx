"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const badges = [
  { title: "Niente gergo tecnico", desc: "In italiano semplice e diretto" },
  { title: "Prima il margine", desc: "Ci concentriamo su ciò che conta" },
  { title: "NDA su richiesta", desc: "I tuoi dati restano tuoi" },
];

export default function Hero() {
  return (
    <section className="relative bg-[#111a60] overflow-hidden h-screen max-h-screen flex flex-col">
      {/* Glow top-right */}
      <div className="absolute -top-60 -right-60 w-[700px] h-[700px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />
      {/* Glow bottom-left */}
      <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-[#1a2580]/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-10 md:pt-28 md:pb-14 text-center w-full flex-1 flex flex-col items-center justify-center">

        <ScrollReveal>
          <div className="inline-flex items-center gap-2 border border-white/15 text-white/60 text-xs font-medium tracking-[0.18em] uppercase px-5 py-2 rounded-full mb-10">
            <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-brand-orange" />
            Per store Shopify con cataloghi grandi
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-7">
            Più <em className="not-italic text-brand-orange">profitto</em>
            <br className="hidden md:block" /> dal tuo store Shopify
            <br className="hidden md:block" /> con il metodo{" "}
            <span className="text-brand-orange">ProfitFlow™</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-base md:text-lg text-blue-200/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="text-white/90 font-medium">ProfitFlow™</strong> è il
            motore completo per far crescere store Shopify con tanti prodotti. Parte da{" "}
            <strong className="text-white/90 font-medium">Google Ads</strong> per
            intercettare chi sta già cercando quello che vendi – e moltiplica ogni euro
            investito con feed ottimizzati, CRO, SEO e automazioni orientate al profitto.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="#contatto"
            className="inline-flex items-center gap-2.5 bg-brand-orange text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-brand-orange-light transition-colors"
          >
            Prenota una consulenza gratuita
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <div className="mt-16 w-full border-t border-white/[0.08] pt-8 flex flex-col md:flex-row items-start md:items-center md:divide-x md:divide-white/[0.08] gap-6 md:gap-0">
            {badges.map((badge) => (
              <div key={badge.title} className="md:flex-1 md:px-8 first:md:pl-0 last:md:pr-0 text-left md:text-center">
                <p className="text-white text-sm font-semibold">{badge.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{badge.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
