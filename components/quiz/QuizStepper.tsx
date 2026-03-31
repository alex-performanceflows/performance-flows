"use client";

import { useState } from "react";
import { quizQuestions } from "@/lib/quiz-data";

export default function QuizStepper({
  onComplete,
}: {
  onComplete: (answers: number[]) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(quizQuestions.length).fill(null)
  );

  const currentQuestion = quizQuestions[currentStep];
  const selectedAnswer = answers[currentStep];

  const handleSelect = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers as number[]);
    }
  };

  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-brand-orange/20">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-brand-text-light mb-2">
            <span>
              Domanda {currentStep + 1} di {quizQuestions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-orange h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold text-brand-text mb-6">
          {currentQuestion.question}
        </h2>

        {/* Answers */}
        <div className="space-y-3 mb-8">
          {currentQuestion.answers.map((answer) => (
            <label
              key={answer.value}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                selectedAnswer === answer.value
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`question-${currentStep}`}
                checked={selectedAnswer === answer.value}
                onChange={() => handleSelect(answer.value)}
                className="sr-only"
              />
              <span
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selectedAnswer === answer.value
                    ? "border-brand-blue"
                    : "border-gray-300"
                }`}
              >
                {selectedAnswer === answer.value && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
                )}
              </span>
              <span className="text-sm text-brand-text">{answer.text}</span>
            </label>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="text-sm text-brand-text-light hover:text-brand-text disabled:opacity-30 transition"
          >
            ← Indietro
          </button>
          <button
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="bg-brand-orange text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-orange-light transition disabled:opacity-40"
          >
            {currentStep === quizQuestions.length - 1
              ? "Vedi risultato"
              : "Domanda successiva"}
          </button>
        </div>
      </div>
    </div>
  );
}
