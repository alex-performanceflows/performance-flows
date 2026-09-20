"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

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
    title: "Il budget va sui prodotti sbagliati.",
    desc: "Spingi i bestseller per abitudine, non per strategia. Senza una lettura del margine reale per prodotto, stai investendo su ciò che vende, non su ciò che guadagna.",
  },
  {
    title: "Tracking inaffidabile, decisioni a caso.",
    desc: "I dati non tornano, le conversioni si perdono e le decisioni di budget si basano su numeri che non riflettono la realtà del tuo Shopify.",
  },
  {
    title: "Compri traffico, ma dietro non c'è niente.",
    desc: "Il sito non converte come dovrebbe e chi compra una volta non torna: ogni euro di ads lavora una volta sola, senza CRO né email che lo moltiplicano.",
  },
];

export default function Problems() {
  return (
    <section id="problemi" className="paper-grain bg-white py-24 md:py-36">
      <div className="max-w-[88rem] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Perché stai leggendo questa pagina"
          title="I problemi"
          className="mb-14 md:mb-20 max-w-3xl"
        />

        <div className="border-t border-[color:var(--rule)]">
          {problems.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.06}>
              <div className="group relative grid grid-cols-[2.5rem_1fr] md:grid-cols-[5rem_minmax(0,0.9fr)_minmax(0,1.1fr)] gap-x-6 gap-y-3 md:gap-x-14 py-8 md:py-11 border-b border-[color:var(--rule)] transition-colors duration-500">
                {/* Filetto che si estende sotto la riga al passaggio del mouse */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 bottom-[-1px] h-px w-full bg-brand-orange origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <span className="index-num text-xs md:text-sm text-brand-text-light/50 group-hover:text-brand-orange transition-colors duration-500 pt-1.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="display-3 text-brand-ink transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:group-hover:translate-x-1.5">
                  {p.title}
                </h3>
                <p className="col-start-2 md:col-start-auto text-brand-text-light text-[15px] leading-relaxed max-w-xl">
                  {p.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
