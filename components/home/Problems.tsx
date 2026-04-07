"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const problems = [
  {
    title: "Fatturato ok, il profitto no.",
    desc: "Fatturato cresce ma il margine si assottiglia: commissioni, spedizioni, sconti e costi variabili non sono nel modello. Stai ottimizzando l'entrata, non il contributo per ordine.",
  },
  {
    title: "Il tuo partner è reattivo, non proattivo.",
    desc: "Poche o tante modifiche, ma nessun piano chiaro o aggiornamenti di strategia. Sei tu a dover spingere perché le cose si muovano.",
  },
  {
    title: "Budget investito sui prodotti sbagliati.",
    desc: "Spingi i bestseller senza sapere se sono quelli che generano più margine. Il budget ads non è allineato alla profittabilità reale del catalogo.",
  },
  {
    title: "Tracking inaffidabile, decisioni a caso.",
    desc: "I dati non tornano, le conversioni si perdono e le decisioni di budget si basano su numeri che non riflettono la realtà del tuo Shopify.",
  },
  {
    title: "Hai centinaia di prodotti ma non sai quali spingere.",
    desc: "Il budget va sui bestseller per abitudine, non per strategia. Senza una lettura del margine per categoria, stai investendo sugli articoli che vendono – non su quelli che guadagnano.",
  },
];

export default function Problems() {
  return (
    <section id="problemi" className="bg-white py-24 md:py-36">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="mb-16 md:mb-20">
            <p className="text-brand-orange font-medium text-xs uppercase tracking-[0.18em] mb-4">Perché stai leggendo questa pagina</p>
            <h2 className="text-4xl md:text-5xl text-brand-blue leading-tight">
              I problemi
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-0 border-t border-black/[0.06]">
          {problems.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.07}>
              <div className="group grid grid-cols-[3rem_1fr] md:grid-cols-[5rem_1fr_2fr] gap-6 md:gap-12 py-8 md:py-10 border-b border-black/[0.06] hover:bg-brand-gray/50 transition-colors duration-200 px-2 rounded-sm -mx-2">
                <span className="text-2xl md:text-3xl text-brand-orange/30 group-hover:text-brand-orange/60 transition-colors leading-none pt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:col-span-1">
                  <h3 className="text-base md:text-lg font-semibold text-brand-text leading-snug">
                    {p.title}
                  </h3>
                </div>
                <div className="col-start-2 md:col-start-auto">
                  <p className="text-brand-text-light text-sm leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
