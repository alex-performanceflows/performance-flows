"use client";

import { motion } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";

const reviews = [
  {
    name: "SEALOVER",
    role: "Scuola di Surf",
    rating: 5,
    text: "Alex ha riprogettato il nostro sito web, semplificato il flusso di prenotazione e ripulito il nostro profilo Google/SEO. Ci ha anche mostrato il potenziale di Google Ads per l'alta stagione: cosa scegliere come target e come monitorare le prenotazioni effettive.",
  },
  {
    name: "Adalberto Malvestio",
    role: "Imprenditore",
    rating: 5,
    text: "La rapida verifica di Alex ha chiarito le lacune. Nel giro di poche settimane abbiamo avuto meno lead inattivi, più visite qualificate e una pipeline più stabile. Il nostro team ora dedica tempo ai clienti giusti.",
  },
  {
    name: "Massimo Scarpis",
    role: "Professionista",
    rating: 5,
    text: "Alex ha controllato i nostri annunci Google, ha sistemato le cose di base e abbiamo iniziato a organizzare incontri con i fondatori giusti. Dopo l'ottimizzazione, abbiamo concluso ottimi affari.",
  },
  {
    name: "NOESI Milano",
    role: "Studio Professionale",
    rating: 5,
    text: "Abbiamo iniziato con un audit Google Ads accurato e poi Alex ha preso in carico le nostre campagne. In poche settimane abbiamo ridotto i clic inutili e registrato più chiamate e visite in negozio. Professionali, veloci e facili da gestire.",
  },
  {
    name: "Swot Studios",
    role: "Studio Creativo",
    rating: 5,
    text: "Audit rapido e preciso. Abbiamo sistemato gli aspetti essenziali e, nel giro di pochi giorni, abbiamo ridotto i lead indesiderati e aumentato gli appuntamenti reali. Ora ci confrontiamo con Alex ogni trimestre.",
  },
  {
    name: "Sandro Borella",
    role: "Consulente",
    rating: 5,
    text: "Gestire Google Ads internamente era difficile. Dopo la rapida verifica di Alex, abbiamo notato meno perdite di tempo e concluso più contratti. Ora lui e il suo team gestiscono l'intero account.",
  },
  {
    name: "Luca Marchioro",
    role: "Imprenditore",
    rating: 5,
    text: "L'audit di Alex ha evidenziato ciò che mi mancava (come le conversioni offline, una vera svolta). Abbiamo apportato alcune correzioni insieme, abbiamo subito visto lead qualificati e gli ho ceduto l'account.",
  },
  {
    name: "dharma srl",
    role: "Azienda",
    rating: 5,
    text: "Gestivamo Google Ads da soli, con scarsi risultati. Alex ha controllato l'account, ha riorganizzato le campagne in base all'intento locale e ai nostri servizi chiave e ha impostato il monitoraggio per misurare le prenotazioni.",
  },
];

function StarRating({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`} aria-label={`${rating} stelle su 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "text-brand-orange" : "text-brand-text-light/25"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const doubled = [...reviews, ...reviews];

export default function ReviewsCarousel() {
  return (
    <section className="paper-grain bg-white py-24 md:py-36 overflow-hidden">
      <div className="max-w-[88rem] mx-auto px-6 md:px-10 mb-14 md:mb-20">
        <SectionHeading
          eyebrow="Cosa dicono i clienti"
          title="Recensioni Google"
          align="center"
        />
        <ScrollReveal delay={0.2}>
          <div className="flex items-center justify-center gap-3 mt-7">
            <StarRating rating={5} />
            <span className="text-xs text-brand-text-light tracking-[0.06em] uppercase">
              5.0 · 10 recensioni su Google
            </span>
          </div>
        </ScrollReveal>
      </div>

      {/* Nastro di citazioni: schede senza riquadro, separate da filetti */}
      <div className="relative">
        <motion.div
          className="flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 68, ease: "linear", repeat: Infinity }}
          style={{ width: "max-content" }}
        >
          {doubled.map((review, i) => (
            <figure
              key={i}
              className="group w-[21rem] md:w-[26rem] flex-shrink-0 px-8 md:px-10 border-l border-[color:var(--rule)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <StarRating rating={review.rating} />
                <svg className="w-4 h-4 text-brand-text-light/30 flex-shrink-0 group-hover:text-brand-text-light/60 transition-colors duration-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
                </svg>
              </div>
              <blockquote className="text-[15px] md:text-base text-brand-ink/80 leading-relaxed flex-1">
                &ldquo;{review.text}&rdquo;
              </blockquote>
              <figcaption className="mt-7 pt-5 border-t border-[color:var(--rule)]">
                <p className="text-sm font-semibold text-brand-ink">{review.name}</p>
                <p className="text-[11px] text-brand-text-light mt-1 tracking-[0.06em] uppercase">{review.role}</p>
              </figcaption>
            </figure>
          ))}
        </motion.div>

        {/* Sfumature ai lati: il nastro entra ed esce senza tagli netti */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
