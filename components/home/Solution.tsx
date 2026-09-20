"use client";

import ScrollReveal, { RevealLine } from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const steps = [
  {
    num: "01",
    title: "Ci conosciamo",
    desc: "Ci allineiamo sugli obiettivi, raccogliamo accessi solo lettura (GA4, Google Ads, Merchant Center) e i dati base di margine. Verifichiamo insieme se il tuo e-commerce può crescere con ProfitFlow™, e se siamo i partner giusti.",
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
    desc: "Attiviamo Google Ads con struttura orientata al margine, ottimizziamo il feed per categoria e installiamo il tracking sul profitto reale. Poi costruiamo attorno i moltiplicatori giusti (CRO, automazioni, SEO) in base a dove il tuo store ha più margine di miglioramento.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Ottimizzazione continua",
    desc: "I nostri sistemi AI controllano performance e anomalie ogni giorno; noi interveniamo sulle decisioni. Il tuo store è monitorato costantemente, non solo quando qualcuno apre l'account.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

const forWho = [
  "Store Shopify con prodotti a domanda esistente",
  "Ticket medio ≥ 40–50€",
  "Margine lordo ≥ 55%",
  "Budget Google Ads ≥ €3k/mese (o piano per arrivarci in 60 gg)",
  "Early stage? Ok, se disposti a sistemare tracking, feed e CRO",
];

const notForWho = [
  "Store non su Shopify",
  "Progetti di Lead Generation o solo Brand Awareness",
  "Store di dropshipping a basso margine",
  "Sito immodificabile (no interventi su UX, offerte, checkout)",
];

export default function Solution() {
  return (
    <section id="metodo" className="paper-grain bg-white py-24 md:py-36">
      <div className="max-w-[88rem] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Come funziona"
          title={<>Il Metodo ProfitFlow&trade;</>}
          lead="ProfitFlow™ è il motore completo per la crescita profittevole del tuo store: Google Ads come motore principale, poi feed, CRO, SEO e automazioni come moltiplicatori. Un percorso chiaro, senza sorprese."
          align="center"
          className="mb-16 md:mb-24"
        />

        {/* Passi: colonne separate da filetti, senza riquadri */}
        <RevealLine />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.09}>
              <div className="group h-full px-0 md:px-8 lg:px-10 first:lg:pl-0 last:lg:pr-0 py-9 md:py-11 border-b md:border-b-0 border-[color:var(--rule)] md:border-l first:md:border-l-0 lg:[&:nth-child(3)]:border-l">
                <div className="flex items-center gap-4 mb-7">
                  <span className="index-num text-xs text-brand-text-light/50 group-hover:text-brand-orange transition-colors duration-500">
                    {step.num}
                  </span>
                  <span className="h-px flex-1 bg-[color:var(--rule)] group-hover:bg-brand-orange/40 transition-colors duration-500" aria-hidden="true" />
                  <span className="text-brand-ink/70 group-hover:text-brand-orange transition-colors duration-500">
                    {step.icon}
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-brand-ink mb-3 leading-snug tracking-[-0.01em]">{step.title}</h3>
                <p className="text-brand-text-light text-[14px] leading-relaxed">{step.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Per chi è / per chi non lo è */}
        <div className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          <ScrollReveal>
            <div className="border-t border-brand-ink/25 pt-7">
              <h3 className="eyebrow text-brand-ink mb-7">Per chi è</h3>
              <ul>
                {forWho.map((item) => (
                  <li key={item} className="flex items-start gap-4 py-3.5 border-b border-[color:var(--rule)] text-[15px] text-brand-ink/85 leading-relaxed">
                    <svg className="w-4 h-4 mt-1 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="border-t border-[color:var(--rule-strong)] pt-7">
              <h3 className="eyebrow text-brand-text-light mb-7">Per chi non lo è</h3>
              <ul>
                {notForWho.map((item) => (
                  <li key={item} className="flex items-start gap-4 py-3.5 border-b border-[color:var(--rule)] text-[15px] text-brand-text-light leading-relaxed">
                    <svg className="w-4 h-4 mt-1 flex-shrink-0 text-brand-text-light/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6L6 18" />
                    </svg>
                    <span>{item}</span>
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
