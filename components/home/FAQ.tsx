"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const faqs = [
  {
    q: "Come capite se ProfitFlow™ è adatto al mio store?",
    a: "In 30 minuti analizziamo il tuo catalogo, i margini per categoria e le campagne Google attive. Se non c'è fit, te lo diciamo subito – senza perderti tempo. Se c'è, ti spieghiamo esattamente cosa faremmo e perché.",
  },
  {
    q: "Devo già avere campagne pubblicitarie attive?",
    a: "Non è obbligatorio, ma è preferibile. La call è pensata per chi ha già un Shopify attivo con fatturato in corso. Se non hai ancora ads attive ma vuoi partire con il metodo giusto, possiamo comunque valutare insieme la situazione.",
  },
  {
    q: "Cosa analizzate esattamente nella chiamata?",
    a: "Margini, struttura del catalogo, tracking, campagne advertising attive e funnel. L'obiettivo è identificare i principali freni al profitto e uscire con priorità chiare da applicare subito.",
  },
  {
    q: "Di quali accessi avete bisogno?",
    a: "Per la call gratuita non servono accessi – parliamo in base a quello che ci condividi tu. NDA disponibile su richiesta prima di qualsiasi condivisione di dati.",
  },
  {
    q: "Gestiamo già lo store con un'agenzia – ha senso comunque?",
    a: "Sì. La nostra analisi è indipendente: identifichiamo cosa manca e dove si perde profitto. Puoi usare il piano d'azione con la tua agenzia attuale, oppure valutare insieme a noi i prossimi passi.",
  },
  {
    q: "A chi è rivolto? E se siamo ancora in fase iniziale?",
    a: "Store Shopify con ticket medio ≥ 40–50€, margine lordo ≥ 55% e volontà di scalare a profitto. Budget ads ≥ €3k/mese o piano per arrivarci in 60 giorni. Early stage? Va bene, se siete disposti a sistemare tracking, feed e CRO prima di scalare.",
  },
  {
    q: "In quanto tempo vediamo risultati?",
    a: "Dipende dalla situazione di partenza. In generale, i primi miglioramenti sono visibili entro 30–60 giorni dall'implementazione delle prime ottimizzazioni.",
  },
];

function AccordionItem({
  faq,
  isOpen,
  toggle,
  index,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  toggle: () => void;
  index: number;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${isOpen ? "border-brand-orange/20 shadow-md" : "border-black/[0.06] shadow-sm"}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-brand-gray/40 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="flex-shrink-0 text-xs font-bold text-brand-orange/60 font-mono">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-semibold text-brand-text text-sm md:text-base">{faq.q}</span>
        </div>
        <span className={`flex-shrink-0 ml-4 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${isOpen ? "bg-brand-orange border-brand-orange text-white rotate-180" : "border-gray-200 text-gray-400"}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 bg-white">
          <div className="pl-8 border-l-2 border-brand-orange/20">
            <p className="text-brand-text-light text-sm leading-relaxed">{faq.a}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-brand-gray py-24 md:py-36">
      <div className="max-w-3xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-brand-orange font-semibold text-sm uppercase tracking-[0.18em] mb-3">Hai domande?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue">
              Domande Frequenti
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <AccordionItem
                faq={faq}
                isOpen={openIndex === i}
                toggle={() => setOpenIndex(openIndex === i ? null : i)}
                index={i}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="mt-10 text-center">
            <p className="text-brand-text-light text-sm mb-4">Non hai trovato risposta alla tua domanda?</p>
            <a
              href="#contatto"
              className="inline-flex items-center gap-2 text-brand-blue font-semibold text-sm hover:text-brand-orange transition"
            >
              Scrivici direttamente
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </ScrollReveal>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
    </section>
  );
}
