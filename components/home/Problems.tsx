"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const problems = [
  {
    title: "Fatturato ok, il PROFITTO no.",
    desc: "Fatturato cresce ma il margine si assottiglia: commissioni, spedizioni, sconti e costi variabili non sono nel modello. Stai ottimizzando l'entrata, non il contributo per ordine.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
  {
    title: "Il tuo partner è reattivo, non proattivo.",
    desc: "Poche o tante modifiche, ma nessun piano chiaro o aggiornamenti di strategia. Sei tu a dover spingere perché le cose si muovano.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Budget investito sui prodotti sbagliati.",
    desc: "Spingi i bestseller senza sapere se sono quelli che generano più margine. Il budget ads non è allineato alla profittabilità reale del catalogo.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Tracking inaffidabile, decisioni a caso.",
    desc: "I dati non tornano, le conversioni si perdono e le decisioni di budget si basano su numeri che non riflettono la realtà del tuo Shopify.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function Problems() {
  return (
    <section id="problemi" className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-brand-orange font-semibold text-sm uppercase tracking-widest mb-3">Perché stai leggendo questa pagina</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue">
              I Problemi
            </h2>
            <p className="text-brand-text-light mt-3 text-lg max-w-xl mx-auto">
              Cosa ti sta stressando in questo momento
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.1}>
              <div className="group relative bg-white rounded-2xl p-7 h-full border border-gray-100 hover:border-brand-orange/30 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Left accent */}
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-brand-blue/10 group-hover:bg-brand-orange rounded-r-full transition-colors duration-300" />
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-blue/5 group-hover:bg-brand-orange/10 flex items-center justify-center text-brand-blue group-hover:text-brand-orange transition-colors duration-300">
                    {p.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-text mb-2">
                      {p.title}
                    </h3>
                    <p className="text-brand-text-light text-sm leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
