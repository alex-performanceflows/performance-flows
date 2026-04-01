"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const badges = [
  { title: "Niente gergo tecnico", desc: "In Italiano semplice e diretto" },
  { title: "Prima il margine", desc: "Ci concentriamo su ciò che conta" },
  { title: "NDA su richiesta", desc: "I tuoi dati restano tuoi" },
];

export default function Hero() {
  return (
    <section className="relative bg-brand-blue overflow-hidden min-h-screen flex flex-col">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow top-right */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-orange/20 rounded-full blur-3xl pointer-events-none" />
      {/* Glow bottom-left */}
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 pt-32 pb-20 md:pt-36 md:pb-28 text-center w-full flex-1 flex flex-col items-center justify-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-8 backdrop-blur-sm max-w-[280px] md:max-w-none text-center">
            <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-brand-orange animate-pulse" />
            <span>
              Per ecommerce Shopify che guardano{" "}
              <span className="text-brand-orange">prima al profitto</span>
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5">
            Scala il{" "}
            <span className="relative inline-block">
              <span className="text-brand-orange">profitto</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-orange/40 rounded" />
            </span>{" "}
            del tuo e-commerce Shopify con il metodo{" "}
            <span className="text-brand-orange">ProfitFlow™</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-base md:text-lg text-blue-200 max-w-xl mx-auto mb-8 leading-relaxed">
            In una sessione 1:1 analizziamo la possibilità di applicare{" "}
            <strong className="text-white">ProfitFlow™</strong> — il metodo
            proprietario che unisce advertising, CRO, tracking e marketing
            automation per{" "}
            <strong className="text-white">aumentare il profitto</strong> del
            tuo store.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="#contatto"
            className="inline-flex items-center gap-2 bg-brand-orange text-white font-semibold text-base px-7 py-3.5 rounded-xl hover:bg-brand-orange-light transition shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:-translate-y-0.5 transform"
          >
            Prenota una consulenza gratuita
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <div className="mt-12 flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 pb-1 md:pb-0 w-[calc(100%+2rem)] md:w-full">
            {badges.map((badge) => (
              <div
                key={badge.title}
                className="snap-center flex-shrink-0 w-[75vw] md:w-auto flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4 backdrop-blur-sm text-left"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-white text-sm">{badge.title}</p>
                  <p className="text-xs text-blue-300">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
