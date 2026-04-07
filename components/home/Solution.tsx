"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const steps = [
  {
    num: "01",
    title: "Call conoscitiva gratuita",
    desc: "Ci allineiamo sugli obiettivi, raccogliamo accessi solo lettura (GA4, Google Ads, Merchant Center) e i dati base di margine. Verifichiamo che il tuo e-commerce possa crescere grazie a ProfitFlow™.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Audit approfondito (opzionale)",
    desc: "Mappiamo tutto l'ecosistema: advertising, marketing automation, tracking, feed, CRO, checkout, marginalità e retention. Il modo più completo per partire con il piede giusto.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Attivazione ProfitFlow™",
    desc: "Attiviamo Google Ads con struttura orientata al margine, ottimizziamo il feed per categoria e installiamo il tracking sul profitto reale. Poi costruiamo attorno i moltiplicatori giusti — CRO, automazioni, SEO — in base a dove il tuo store ha più margine di miglioramento.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Ottimizzazione continua",
    desc: "Ogni mese analizziamo performance per categoria di catalogo, aggiustiamo campagne e feed, e identifichiamo nuove opportunità di margine. Il tuo store migliora mese dopo mese — senza che tu debba spingere.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const forWho = [
  "Store Shopify con catalogo di 200+ SKU o più categorie di prodotto",
  "Store Shopify con ticket medio ≥ 40–50€",
  "Margine lordo ≥ 55%",
  "Budget Google Ads ≥ €3k/mese (o piano per arrivarci in 60 gg)",
  "Early stage? Ok, se disposti a sistemare tracking, feed e CRO",
];

const notForWho = [
  "Brand monoprodotto o con meno di 50 SKU",
  "Progetti di Lead Generation o solo Brand Awareness",
  "Store di dropshipping a basso margine",
  "Sito immodificabile (no interventi su UX, offerte, checkout)",
];

export default function Solution() {
  return (
    <section id="metodo" className="bg-white py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-brand-orange font-semibold text-sm uppercase tracking-[0.18em] mb-3">Come funziona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Il Metodo ProfitFlow™
            </h2>
            <p className="text-brand-text-light text-lg max-w-xl mx-auto">
              ProfitFlow™ è il motore completo per la crescita profittevole del tuo store – Google Ads come motore principale, feed, CRO, SEO e automazioni come moltiplicatori. Un percorso chiaro, senza sorprese.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.12}>
              <div className="relative group h-full">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-brand-orange/40 to-transparent z-10 -translate-x-6" />
                )}
                <div className="bg-white rounded-2xl p-6 h-full border border-black/[0.06] group-hover:border-brand-orange/30 group-hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center group-hover:bg-brand-orange transition-colors duration-300">
                      {step.icon}
                    </div>
                    <span className="text-3xl font-black text-gray-200 group-hover:text-brand-orange/30 transition-colors leading-none">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-brand-text mb-2">{step.title}</h3>
                  <p className="text-brand-text-light text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* For who / not for who */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal>
            <div className="bg-green-50 rounded-2xl p-7 border border-green-100 h-full">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="text-lg font-bold text-green-800">Per chi è</h3>
              </div>
              <ul className="space-y-3">
                {forWho.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-green-900">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.12}>
            <div className="bg-red-50 rounded-2xl p-7 border border-red-100 h-full">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="text-lg font-bold text-red-800">Per chi non lo è</h3>
              </div>
              <ul className="space-y-3">
                {notForWho.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                    <span className="text-red-900">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
