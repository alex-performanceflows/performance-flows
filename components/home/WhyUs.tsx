"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const levers = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    num: "01",
    title: "Diagnosi & Unit Economics",
    desc: "MER, AOV, COGS, resi — i numeri veri per capire dove sta il profitto e dove si perde margine.",
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
    desc: "Search, Shopping e PMax strutturata — orientati al profitto, non ai vanity metrics.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    num: "04",
    title: "Conversion Engine",
    desc: "Landing, offerte, bundle, email post-acquisto — ogni touchpoint ottimizzato per convertire.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    num: "05",
    title: "Scaling controllato",
    desc: "Soglie di profitto e forecast per crescere senza bruciare margine.",
  },
];

export default function WhyUs() {
  return (
    <section className="bg-brand-blue py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-brand-orange font-medium text-xs uppercase tracking-[0.18em] mb-4">Il nostro approccio</p>
            <h2 className="text-4xl md:text-5xl text-white mb-5">
              Perché lavorare con noi?
            </h2>
            <p className="text-blue-200/70 text-lg max-w-2xl mx-auto">
              Siamo un team specializzato in Google Ads per e-commerce Shopify
              con un approccio <strong className="text-white/90">Profit-first</strong>: prima il margine,
              poi la spesa. Il metodo <strong className="text-white/90">ProfitFlow™</strong> allinea 5
              leve:
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {levers.map((lever, i) => (
            <ScrollReveal key={lever.title} delay={i * 0.08}>
              <div className={`group bg-white/[0.05] border border-white/10 rounded-2xl p-6 h-full hover:bg-white/[0.09] hover:border-brand-orange/30 transition-all duration-300 ${i === 4 ? "md:col-start-2" : ""}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300">
                    {lever.icon}
                  </div>
                  <span className="text-3xl text-white/10 group-hover:text-brand-orange/40 transition-colors leading-none mt-1">
                    {lever.num}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {lever.title}
                </h3>
                <p className="text-blue-200/60 text-sm leading-relaxed">
                  {lever.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.5}>
          <div className="mt-10 border-t border-white/10 pt-10 text-center">
            <p className="text-lg md:text-xl text-white/70 font-light">
              <strong className="text-white font-semibold">Risultato:</strong> meno sprechi, CPA sostenibile, più
              margine per ordine e{" "}
              <span className="text-brand-orange font-semibold">
                crescita profittevole
              </span>
              .
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
