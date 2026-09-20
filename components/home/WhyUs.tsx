"use client";

import ScrollReveal, { RevealLine } from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const levers = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    num: "01",
    title: "Diagnosi & Unit Economics",
    desc: "MER, AOV, COGS, resi: i numeri veri per capire dove sta il profitto e dove si perde margine.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    num: "02",
    title: "Tracking & Feed",
    desc: "Tracking a prova di errore e feed prodotto ottimizzati per massimizzare la qualità dei dati.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    num: "03",
    title: "Traffic Engine",
    desc: "Search, Shopping e PMax strutturata, orientati al profitto e non ai vanity metrics.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    num: "04",
    title: "Conversion Engine",
    desc: "CRO, offerte e bundle: ogni touchpoint del sito ottimizzato per trasformare il traffico in ordini.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    num: "05",
    title: "Retention Engine",
    desc: "Klaviyo, flussi post-acquisto e segmentazione, perché il secondo ordine costa molto meno del primo.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    num: "06",
    title: "Scaling controllato",
    desc: "Soglie di profitto e forecast per crescere senza bruciare margine.",
  },
];

export default function WhyUs() {
  return (
    <section className="grain relative bg-[#0b1152] py-24 md:py-36">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(100% 70% at 85% 0%, rgba(196,123,34,0.12) 0%, transparent 55%), linear-gradient(180deg, #0b1152 0%, #0a0f42 100%)",
        }}
      />

      <div className="relative z-10 max-w-[88rem] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Il nostro approccio"
          title="Perché lavorare con noi?"
          tone="dark"
          align="center"
          lead={
            <>
              Siamo un team specializzato in performance marketing per e-commerce
              Shopify con un approccio{" "}
              <strong className="text-white font-medium">Profit-first</strong>: prima il margine,
              poi la spesa. Il metodo{" "}
              <strong className="text-white font-medium">ProfitFlow™</strong> allinea 6 leve, dal
              primo clic al secondo ordine:
            </>
          }
          className="mb-16 md:mb-24"
        />

        <RevealLine tone="dark" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {levers.map((lever, i) => (
            <ScrollReveal key={lever.title} delay={(i % 3) * 0.08}>
              <div className="group relative h-full px-0 md:px-8 lg:px-10 first:lg:pl-0 py-9 md:py-11 border-b border-[color:var(--rule-invert)] md:[&:nth-child(even)]:border-l lg:[&:nth-child(even)]:border-l-0 lg:[&:not(:nth-child(3n+1))]:border-l lg:border-[color:var(--rule-invert)]">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[-1px] h-px w-full bg-brand-orange origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <div className="flex items-center gap-4 mb-7">
                  <span className="index-num text-xs text-white/30 group-hover:text-brand-orange transition-colors duration-500">
                    {lever.num}
                  </span>
                  <span className="h-px flex-1 bg-white/10 group-hover:bg-brand-orange/40 transition-colors duration-500" aria-hidden="true" />
                  <span className="text-white/60 group-hover:text-brand-orange transition-colors duration-500">
                    {lever.icon}
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-3 tracking-[-0.01em]">
                  {lever.title}
                </h3>
                <p className="text-white/55 text-[14px] leading-relaxed max-w-sm">
                  {lever.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <p className="font-display mt-16 md:mt-20 display-3 font-normal text-white/75 max-w-4xl mx-auto text-center leading-snug tracking-[-0.01em]">
            <strong className="text-white font-semibold">Risultato:</strong> meno sprechi, CPA sostenibile, più
            margine per ordine e{" "}
            <span className="text-brand-orange">crescita profittevole</span>.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
