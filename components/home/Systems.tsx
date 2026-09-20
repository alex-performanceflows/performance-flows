"use client";

import ScrollReveal, { RevealLine } from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const systems = [
  {
    title: "Monitoraggio quotidiano automatizzato",
    desc: "Ogni giorno i nostri sistemi leggono campagne, feed e margini. Non aspettiamo il report di fine mese per accorgerci che qualcosa è cambiato.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: "Alert sulle anomalie di spesa e margine",
    desc: "Se una campagna inizia a bruciare budget o un prodotto scende sotto la soglia di margine, lo sappiamo subito. Tu lo scopri da noi, non dall'estratto conto.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    title: "Report sul profitto reale, non sui vanity metrics",
    desc: "Dashboard costruite sul contributo per ordine, non su impression e ROAS di piattaforma. Apri e capisci in trenta secondi se il mese sta andando.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function Systems() {
  return (
    <section id="sistemi" className="paper-grain bg-brand-paper py-24 md:py-36">
      <div className="max-w-[88rem] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="I nostri sistemi"
          title="Il tuo store non resta mai senza qualcuno che guarda"
          lead="Abbiamo costruito sistemi AI che sorvegliano campagne, spesa e margine ogni giorno, e ci avvisano quando qualcosa si muove. Le decisioni restano nostre: la tecnologia serve a farci arrivare prima, non a sostituire il giudizio."
          align="center"
          className="mb-16 md:mb-24 max-w-3xl mx-auto"
        />

        <RevealLine />
        <div className="grid grid-cols-1 md:grid-cols-3">
          {systems.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.1}>
              <div className="group h-full px-0 md:px-10 first:md:pl-0 last:md:pr-0 py-9 md:py-12 border-b md:border-b-0 border-[color:var(--rule)] md:border-l first:md:border-l-0">
                <div className="flex items-center gap-4 mb-7">
                  <span className="index-num text-xs text-brand-text-light/50 group-hover:text-brand-orange transition-colors duration-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-[color:var(--rule)] group-hover:bg-brand-orange/40 transition-colors duration-500" aria-hidden="true" />
                  <span className="text-brand-ink/70 group-hover:text-brand-orange transition-colors duration-500">
                    {s.icon}
                  </span>
                </div>
                <h3 className="text-[17px] font-semibold text-brand-ink mb-3 leading-snug tracking-[-0.01em]">
                  {s.title}
                </h3>
                <p className="text-brand-text-light text-[14px] leading-relaxed">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
