"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

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
    <section id="sistemi" className="bg-brand-gray py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
            <p className="text-brand-orange font-semibold text-sm uppercase tracking-[0.18em] mb-3">
              I nostri sistemi
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
              Il tuo store non resta mai senza qualcuno che guarda
            </h2>
            <p className="text-brand-text-light text-lg leading-relaxed">
              Abbiamo costruito sistemi AI che sorvegliano campagne, spesa e margine ogni
              giorno, e ci avvisano quando qualcosa si muove. Le decisioni restano
              nostre: la tecnologia serve a farci arrivare prima, non a sostituire il
              giudizio.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systems.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.12}>
              <div className="group bg-white rounded-2xl p-7 h-full border border-black/[0.06] hover:border-brand-orange/30 hover:shadow-md transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-brand-blue text-white flex items-center justify-center mb-5 group-hover:bg-brand-orange transition-colors duration-300">
                  {s.icon}
                </div>
                <h3 className="text-base font-bold text-brand-text mb-2 leading-snug">
                  {s.title}
                </h3>
                <p className="text-brand-text-light text-sm leading-relaxed">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
