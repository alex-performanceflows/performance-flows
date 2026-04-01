"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const questions = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    text: (
      <>
        Le mie ads stanno generando{" "}
        <span className="text-brand-orange">profitto</span>, o solo fatturato?
      </>
    ),
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    text: (
      <>
        So davvero quanto mi costa acquisire un cliente{" "}
        <span className="text-brand-orange">profittevole</span>?
      </>
    ),
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    text: (
      <>
        Il mio <span className="text-brand-orange">tracking</span> è affidabile o sto ottimizzando dati sbagliati?
      </>
    ),
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    text: (
      <>
        Posso <span className="text-brand-orange">scalare</span> lo store senza che i margini collassino?
      </>
    ),
  },
];

const steps = [
  {
    n: "1",
    title: "Prenota la call",
    desc: "Compila il form con i dati del tuo store. Zero impegno.",
  },
  {
    n: "2",
    title: "Call 1:1 di 30 min",
    desc: "Analizziamo live ads, margini, tracking e funnel del tuo Shopify.",
  },
  {
    n: "3",
    title: "Piano d'azione",
    desc: "Esci dalla call con priorità chiare e azioni concrete da applicare subito.",
  },
];

const forWho = {
  yes: [
    "Hai uno store Shopify attivo con almeno €5.000/mese di fatturato",
    "Stai già investendo in advertising o vuoi farlo con metodo",
    "Vuoi scalare il profitto, non solo il fatturato",
  ],
  no: [
    "Stai ancora validando il prodotto o il mercato",
    "Non hai budget da investire in ads o in ottimizzazione",
    "Cerchi una soluzione magica senza una strategia solida",
  ],
};

const outputs = [
  "Analisi live dei tuoi margini e delle tue campagne",
  "Identificazione dei principali freni al profitto",
  "Piano d'azione prioritizzato e personalizzato",
  "Nessun impegno — zero pitch commerciale",
];

export default function Assessment() {
  return (
    <section className="bg-brand-gray py-20 md:py-28" id="come-funziona">
      <div className="max-w-5xl mx-auto px-4 space-y-20">

        {/* Header + domande */}
        <div>
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-brand-orange font-semibold text-sm uppercase tracking-widest mb-4">
                Diagnosi gratuita
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-blue leading-tight">
                Troviamo insieme la risposta <br className="hidden md:block" />a queste domande
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:border-brand-blue/20 hover:shadow-md transition-all h-full">
                  <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-blue/5 border border-brand-blue/10 text-brand-blue flex items-center justify-center">
                    {q.icon}
                  </span>
                  <p className="text-brand-blue font-semibold text-base leading-snug pt-1.5">
                    {q.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Come funziona */}
        <div>
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue text-center mb-12">
              Ok, come funziona?
            </h2>
          </ScrollReveal>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-brand-blue/10" />

            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 w-16 h-16 rounded-full bg-brand-blue text-white font-black text-xl flex items-center justify-center mb-5 shadow-lg shadow-brand-blue/20">
                    {step.n}
                  </div>
                  <p className="font-bold text-brand-blue text-lg mb-1">{step.title}</p>
                  <p className="text-brand-text-light text-sm leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Cosa ottieni */}
        <ScrollReveal>
          <div className="bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
            <h3 className="text-2xl font-bold text-brand-blue mb-6 text-center">
              Cosa ottieni dalla call
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outputs.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <p className="text-brand-blue font-medium text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Per chi è adatto */}
        <div>
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-blue text-center mb-4">
              Per chi è adatta questa call?
            </h2>
            <p className="text-brand-text-light text-center max-w-xl mx-auto mb-10 text-sm leading-relaxed">
              Vogliamo che ogni call sia utile davvero. Per questo siamo selettivi.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SÌ */}
            <ScrollReveal delay={0.05}>
              <div className="bg-white border-2 border-green-400/30 rounded-2xl p-7 shadow-sm h-full">
                <p className="font-bold text-brand-blue text-base mb-5 text-center">
                  Prenota la call se:
                </p>
                <ul className="space-y-4">
                  {forWho.yes.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <p className="text-brand-blue text-sm font-medium leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* NO */}
            <ScrollReveal delay={0.1}>
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 shadow-sm h-full">
                <p className="font-bold text-gray-400 text-base mb-5 text-center">
                  NON prenotare se:
                </p>
                <ul className="space-y-4">
                  {forWho.no.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mt-0.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                      <p className="text-gray-400 text-sm font-medium leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* CTA box */}
        <ScrollReveal>
          <div className="bg-brand-blue rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative">
              <p className="text-white text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-8">
                La <strong className="text-brand-orange">consulenza ProfitFlow™</strong> è un'analisi 1:1 del tuo Shopify — uscirai con un piano d'azione chiaro per{" "}
                <strong>aumentare il profitto del tuo store.</strong>
              </p>
              <a
                href="#contatto"
                className="inline-flex items-center gap-2 bg-brand-orange text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-brand-orange-light transition shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:-translate-y-0.5 transform"
              >
                Richiedi la tua analisi gratuita
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
