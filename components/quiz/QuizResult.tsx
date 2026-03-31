"use client";

import { MAX_SCORE, getScoreLevel } from "@/lib/quiz-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function QuizResult({ score }: { score: number }) {
  const { level, color, message } = getScoreLevel(score);
  const percentage = Math.round((score / MAX_SCORE) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      <ScrollReveal>
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-2 border-brand-orange/20 text-center">
          <h2 className="text-2xl font-bold text-brand-text mb-6">
            Il tuo Indice di Scalabilità
          </h2>

          {/* Score circle */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={
                  percentage <= 33
                    ? "#ef4444"
                    : percentage <= 66
                      ? "#d17a1c"
                      : "#22c55e"
                }
                strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * 327} 327`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-brand-text">
                {score}
              </span>
              <span className="text-sm text-brand-text-light">
                su {MAX_SCORE}
              </span>
            </div>
          </div>

          <p className={`text-2xl font-bold mb-4 ${color}`}>
            Livello: {level}
          </p>

          <p className="text-brand-text-light leading-relaxed mb-8 max-w-lg mx-auto">
            {message}
          </p>

          <div className="space-y-3">
            <a
              href="https://performanceflows.com/#contatto"
              className="inline-block bg-brand-blue text-white font-semibold px-8 py-4 rounded-lg hover:bg-brand-blue-dark transition text-lg"
            >
              Prenota una consulenza gratuita
            </a>
            <p className="text-xs text-brand-text-light">
              Analizzeremo il tuo punteggio e ti daremo un piano d&apos;azione
              personalizzato.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
