"use client";

import { useState } from "react";
import Image from "next/image";
import QuizHero from "@/components/quiz/QuizHero";
import QuizStepper from "@/components/quiz/QuizStepper";
import LeadCaptureForm from "@/components/quiz/LeadCaptureForm";
import QuizResult from "@/components/quiz/QuizResult";

type QuizPhase = "intro" | "quiz" | "lead" | "result";

export default function QuizPage() {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const handleQuizComplete = (answers: number[]) => {
    setQuizAnswers(answers);
    setPhase("lead");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLeadSubmit = async (leadData: {
    name: string;
    phone: string;
    email: string;
    url: string;
  }) => {
    const totalScore = quizAnswers.reduce((sum, val) => sum + val, 0);
    setScore(totalScore);

    try {
      await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadData,
          answers: quizAnswers,
          score: totalScore,
        }),
      });

      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
          event: "quiz_complete",
          quiz_score: totalScore,
        });
      }
    } catch {
      // Continue to show result even if API fails
    }

    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Hero section */}
      <section className="bg-brand-blue py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Image
            src="/images/logoPerfromanceFlowScrittaWhite.png"
            alt="Performance Flows"
            width={180}
            height={60}
            className="h-12 w-auto mx-auto mb-2"
          />
          <div className="inline-block bg-white/10 text-white font-semibold text-sm tracking-wide px-6 py-2 rounded-full mb-4">
            Per gli store Shopify che vogliono scalare
          </div>
          <p className="text-blue-200 text-sm max-w-xl mx-auto">
            Compila e parti: alla fine del quiz potrai ricevere{" "}
            <strong className="text-white">il report personalizzato</strong> per
            massimizzare la crescita del tuo negozio online.
          </p>
        </div>
      </section>

      {/* Quiz content */}
      <section className="bg-brand-blue pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4">
          {phase === "intro" && (
            <QuizHero onStart={() => setPhase("quiz")} />
          )}
          {phase === "quiz" && (
            <QuizStepper onComplete={handleQuizComplete} />
          )}
          {phase === "lead" && (
            <LeadCaptureForm onSubmit={handleLeadSubmit} />
          )}
          {phase === "result" && <QuizResult score={score} />}
        </div>
      </section>

      {/* Team section */}
      <section className="bg-brand-blue py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/google-partner.svg"
              alt="Google Partner"
              width={140}
              height={52}
              className="h-14 w-auto"
            />
          </div>
          <p className="text-white text-sm max-w-2xl mx-auto mb-2">
            Siamo un team italiano specializzato{" "}
            <strong>in Google Ads per ecommerce</strong>. Ogni giorno lavoriamo
            su account attivi in diversi settori.
          </p>
          <p className="text-blue-200 text-xs max-w-2xl mx-auto">
            Non ci basiamo su &quot;best practice&quot; generiche. Partiamo dai
            tuoi dati e dal tuo contesto (offerta, margini, geografie,
            stagionalità, concorrenza) e costruiamo un piano su misura.
          </p>
        </div>
      </section>
    </>
  );
}
