"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { ArrowLink } from "@/components/ui/Cta";

const faqs = [
  {
    q: "Come capite se ProfitFlow™ è adatto al mio store?",
    a: "In 30 minuti analizziamo il tuo catalogo, i margini per categoria e le campagne Google attive. Se non c'è fit, te lo diciamo subito, senza perderti tempo. Se c'è, ti spieghiamo esattamente cosa faremmo e perché.",
  },
  {
    q: "Lavorate solo con Shopify?",
    a: "Sì. Ci siamo specializzati su un'unica piattaforma per conoscerne ogni dettaglio: feed, checkout, app, tracking. È il motivo per cui andiamo più a fondo di un'agenzia generalista.",
  },
  {
    q: "Fate solo Google Ads?",
    a: "No. Google Ads è il motore, intercetta chi sta già cercando quello che vendi, ed è lì che parte il ritorno. Ma da solo lavora una volta sola: CRO, email e feed sono i moltiplicatori che fanno rendere di più ogni euro investito. Lavoriamo su tutto l'ecosistema, integrato nel metodo ProfitFlow™, mai come servizi separati.",
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
    a: "Per la prima call non servono accessi: parliamo in base a quello che ci condividi tu. NDA disponibile su richiesta prima di qualsiasi condivisione di dati.",
  },
  {
    q: "Gestiamo già lo store con un'agenzia, ha senso comunque?",
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
    <div className="border-b border-[color:var(--rule)]">
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="group w-full flex items-start gap-6 md:gap-10 py-6 md:py-7 text-left"
      >
        <span className="index-num text-xs text-brand-text-light/50 group-hover:text-brand-orange transition-colors duration-500 pt-1.5">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={`flex-1 text-[17px] md:text-xl font-semibold tracking-[-0.015em] leading-snug transition-colors duration-300 ${isOpen ? "text-brand-orange" : "text-brand-ink group-hover:text-brand-ink/70"}`}>
          {faq.q}
        </span>
        {/* Più che diventa meno: la barra verticale ruota e sparisce */}
        <span className="relative flex-shrink-0 w-4 h-4 mt-1.5" aria-hidden="true">
          <span className={`absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 transition-colors duration-300 ${isOpen ? "bg-brand-orange" : "bg-brand-ink"}`} />
          <span className={`absolute left-1/2 top-0 w-px h-4 -translate-x-1/2 origin-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "scale-y-0 bg-brand-orange" : "scale-y-100 bg-brand-ink"}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-7 md:pb-8 pl-[3.25rem] md:pl-[4.5rem] pr-8 text-brand-text-light text-[15px] leading-relaxed max-w-3xl">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="paper-grain bg-brand-paper py-24 md:py-36">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Hai domande?"
          title="Domande Frequenti"
          className="mb-14 md:mb-20"
        />

        <div className="border-t border-[color:var(--rule)]">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={Math.min(i, 4) * 0.04}>
              <AccordionItem
                faq={faq}
                isOpen={openIndex === i}
                toggle={() => setOpenIndex(openIndex === i ? null : i)}
                index={i}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <p className="text-brand-text-light text-sm">Non hai trovato risposta alla tua domanda?</p>
            <ArrowLink href="#contatto" className="text-brand-ink">Scrivici direttamente</ArrowLink>
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
