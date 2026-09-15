"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const badges = [
  { title: "Niente gergo tecnico", desc: "In italiano semplice e diretto" },
  { title: "Prima il margine", desc: "Ci concentriamo su ciò che conta" },
  { title: "NDA su richiesta", desc: "I tuoi dati restano tuoi" },
  { title: "Monitoraggio quotidiano", desc: "Anomalie intercettate prima che diventino costi" },
];

export default function Hero() {
  return (
    // Su mobile l'altezza segue il contenuto: con quattro badge un h-screen
    // rigido taglierebbe l'ultima riga. Da md in su torna a schermo pieno.
    <section className="relative bg-[#111a60] overflow-hidden flex flex-col min-h-[100svh] md:h-screen md:max-h-screen">
      {/* Onde larghe e morbide: tratto spesso ma opacità bassissima, così il
          fondo blu ha profondità senza che il pattern si legga davvero */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="hero-waves" width="620" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M-40 70 C 110 6, 200 6, 320 70 S 500 134, 660 70"
              fill="none"
              stroke="white"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M-40 170 C 110 106, 200 106, 320 170 S 500 234, 660 170"
              fill="none"
              stroke="white"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </pattern>
          <linearGradient id="hero-waves-fade" x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="50%" stopColor="white" stopOpacity="0.45" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
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
          className="opacity-[0.018] md:opacity-[0.028]"
        />
      </svg>

      {/* Glow top-right */}
      <div className="absolute -top-60 -right-60 w-[700px] h-[700px] bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />
      {/* Glow bottom-left */}
      <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-[#1a2580]/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-14 md:pt-28 md:pb-14 text-center w-full flex-1 flex flex-col items-center justify-center">

        <ScrollReveal>
          <div className="inline-flex items-center gap-2 border border-white/15 text-white/60 text-xs font-medium tracking-[0.18em] uppercase px-5 py-2 rounded-full mb-10">
            <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-brand-orange" />
            Performance marketing a 360° per store Shopify
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-7">
            Più <em className="not-italic text-brand-orange">profitto</em>
            <br className="hidden md:block" /> dal tuo store Shopify
            <br className="hidden md:block" /> con il metodo{" "}
            <span className="text-brand-orange">ProfitFlow™</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-base md:text-lg text-blue-200/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="text-white/90 font-medium">ProfitFlow™</strong> copre
            tutto il percorso:{" "}
            <strong className="text-white/90 font-medium">Google Ads</strong> per
            intercettare chi già cerca, poi feed, CRO, email e automazioni. I nostri
            sistemi AI monitorano le campagne ogni giorno. Tutto orientato al{" "}
            <strong className="text-white/90 font-medium">profitto</strong>, non al
            fatturato.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="#contatto"
            className="inline-flex items-center gap-2.5 bg-brand-orange text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-brand-orange-light transition-colors"
          >
            Raccontaci del tuo progetto
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <div className="mt-10 md:mt-16 w-full border-t border-white/[0.08] pt-7 md:pt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 md:gap-x-6 md:gap-y-6 lg:divide-x lg:divide-white/[0.08]">
            {badges.map((badge) => (
              <div key={badge.title} className="lg:px-6 first:lg:pl-0 last:lg:pr-0 text-left lg:text-center">
                <p className="text-white text-sm font-semibold">{badge.title}</p>
                <p className="text-white/40 text-xs mt-0.5 leading-snug">{badge.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
