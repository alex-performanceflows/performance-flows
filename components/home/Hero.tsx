"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import MagneticCta from "@/components/ui/MagneticCta";

const badges = [
  { title: "Niente gergo tecnico", desc: "In italiano semplice e diretto" },
  { title: "Prima il margine", desc: "Ci concentriamo su ciò che conta" },
  { title: "NDA su richiesta", desc: "I tuoi dati restano tuoi" },
  { title: "Monitoraggio quotidiano", desc: "Anomalie intercettate prima che diventino costi" },
];

/** Onda continua: parte e arriva alla stessa quota, così le ripetizioni si saldano. */
function wavePath(baseline: number) {
  const W = 620;
  const A = 30;
  return `M0 ${baseline} C ${W * 0.17} ${baseline - A * 1.8}, ${W * 0.33} ${baseline - A * 1.8}, ${W * 0.5} ${baseline} S ${W * 0.83} ${baseline + A * 1.8}, ${W} ${baseline}`;
}

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Il fondo scorre più lento del contenuto: la sezione acquista profondità
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    // Su mobile l'altezza segue il contenuto: con quattro badge un h-screen
    // rigido taglierebbe l'ultima riga. Da md in su torna a schermo pieno.
    <section ref={sectionRef} className="grain relative overflow-hidden flex flex-col min-h-[100svh] md:min-h-screen bg-[#0b1152]">
      {/* Profondità del fondo: due campiture larghissime, nessun bordo visibile */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 90% at 78% 6%, rgba(196,123,34,0.16) 0%, transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(26,37,128,0.7) 0%, transparent 60%), linear-gradient(180deg, #0b1152 0%, #0a0f42 100%)",
        }}
      />

      {/* Onde larghe e morbide: tratto spesso ma opacità bassissima, così il
          fondo blu ha profondità senza che il pattern si legga davvero.
          Il disegno scorre lentamente verso destra di esattamente una
          ripetizione: il ciclo si chiude e il movimento non ha stacchi. */}
      <motion.svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-[130%] pointer-events-none"
        preserveAspectRatio="none"
        style={reduceMotion ? undefined : { y: backgroundY }}
      >
        <defs>
          <pattern id="hero-waves" width="620" height="200" patternUnits="userSpaceOnUse">
            <path d={wavePath(60)} fill="none" stroke="white" strokeWidth="14" strokeLinecap="round" />
            <path d={wavePath(160)} fill="none" stroke="white" strokeWidth="14" strokeLinecap="round" />
            {!reduceMotion && (
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to="620 0"
                dur="34s"
                repeatCount="indefinite"
              />
            )}
          </pattern>
          <linearGradient id="hero-waves-fade" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="50%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0.12" />
          </linearGradient>
          <mask id="hero-waves-mask">
            <rect width="100%" height="100%" fill="url(#hero-waves-fade)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-waves)"
          mask="url(#hero-waves-mask)"
          className="opacity-[0.03] md:opacity-[0.045]"
        />
      </motion.svg>

      <motion.div
        style={reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative z-10 w-full flex-1 flex flex-col justify-center items-center text-center max-w-[76rem] mx-auto px-6 md:px-10 pt-32 pb-12 md:pt-36 md:pb-14"
      >
        <ScrollReveal>
          <div className="inline-flex items-center border border-white/15 rounded-full px-6 py-2 mb-8 md:mb-12">
            <p className="eyebrow text-white/55">Performance marketing a 360° per store Shopify</p>
          </div>
        </ScrollReveal>

        <h1 className="display-1 text-white">
          <ScrollReveal variant="mask">
            <span className="block">
              Più <em className="not-italic text-brand-orange">profitto</em>
            </span>
          </ScrollReveal>
          <ScrollReveal variant="mask" delay={0.09}>
            <span className="block">dal tuo store Shopify</span>
          </ScrollReveal>
          <ScrollReveal variant="mask" delay={0.18}>
            <span className="block">
              con il metodo <span className="text-brand-orange">ProfitFlow™</span>
            </span>
          </ScrollReveal>
        </h1>

        <div className="mt-10 md:mt-12 flex flex-col items-center gap-9">
          <ScrollReveal delay={0.3}>
            <p className="lead text-blue-100/60 max-w-2xl mx-auto">
              <strong className="text-white font-medium">ProfitFlow™</strong> copre
              tutto il percorso:{" "}
              <strong className="text-white font-medium">Google Ads</strong> per
              intercettare chi già cerca, poi feed, CRO, email e automazioni. I nostri
              sistemi AI monitorano le campagne ogni giorno. Tutto orientato al{" "}
              <strong className="text-white font-medium">profitto</strong>, non al
              fatturato.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.38}>
            <MagneticCta href="#contatto">Raccontaci del tuo progetto</MagneticCta>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.5} className="w-full">
          <div className="mt-12 md:mt-20 border-t border-[color:var(--rule-invert)] grid grid-cols-2 lg:grid-cols-4">
            {badges.map((badge, i) => (
              <div
                key={badge.title}
                className="group py-6 lg:py-7 lg:px-8 first:lg:pl-0 last:lg:pr-0 text-left lg:text-center border-b lg:border-b-0 border-[color:var(--rule-invert)] lg:border-l first:lg:border-l-0 [&:nth-child(odd)]:pr-5 lg:[&:nth-child(odd)]:pr-8"
              >
                <span className="index-num text-[11px] text-white/25 group-hover:text-brand-orange/80 transition-colors duration-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-white text-sm font-semibold mt-2 leading-snug">{badge.title}</p>
                <p className="text-white/40 text-xs mt-1.5 leading-relaxed">{badge.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </motion.div>

      {/* Indicatore di scorrimento: un filo di luce che scende, senza scritte */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 h-12 w-px overflow-hidden bg-white/12"
      >
        <span
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent via-brand-orange to-transparent"
          style={{ animation: "scroll-cue 2.6s var(--ease-out-expo) infinite" }}
        />
      </div>
    </section>
  );
}
