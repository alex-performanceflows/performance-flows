"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

export default function QuizHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <ScrollReveal>
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-2 border-brand-orange/20">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
            Indice di Scalabilità Shopify
          </h1>

          <p className="text-brand-text-light mb-2 text-sm font-medium">
            ⏱ 3 minuti, 15 domande, risultato immediato.
          </p>

          <p className="text-brand-text-light mb-8 text-lg">
            Scopri cosa fare per aumentare il fatturato del tuo{" "}
            <strong>negozio online</strong>.
          </p>

          <button
            onClick={onStart}
            className="bg-brand-orange text-white font-semibold text-lg px-8 py-4 rounded-lg hover:bg-brand-orange-light transition shadow-lg"
          >
            Inizia il check-up
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
}
