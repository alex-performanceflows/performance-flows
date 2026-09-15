"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, clearConsent, readConsent } from "./consent";
import type { ConsentChoice } from "./consent";

const LABEL: Record<ConsentChoice, string> = {
  granted: "Consenso ai cookie analitici: attivo",
  denied: "Consenso ai cookie analitici: rifiutato",
};

export default function CookieSettingsButton() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readConsent());
    setReady(true);
    const onChange = (e: Event) =>
      setChoice(((e as CustomEvent).detail as ConsentChoice | null) ?? null);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!ready) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        onClick={clearConsent}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-dark transition w-fit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Modifica le preferenze cookie
      </button>
      {choice && (
        <span className="text-sm text-brand-text-light">{LABEL[choice]}</span>
      )}
    </div>
  );
}
