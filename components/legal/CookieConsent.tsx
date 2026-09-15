"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent } from "./consent";
import type { ConsentChoice } from "./consent";

/**
 * Banner cookie + caricamento condizionato di Google Analytics.
 *
 * GA4 non viene montato finché l'utente non presta il consenso: nessun cookie
 * analitico viene scritto prima della scelta, come richiesto dalle Linee guida
 * cookie del Garante.
 */
export default function CookieConsent({ ga4Id }: { ga4Id: string }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readConsent());
    setReady(true);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as ConsentChoice | null;
      setChoice(detail ?? null);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  const decide = useCallback((value: ConsentChoice) => {
    writeConsent(value);
    setChoice(value);
  }, []);

  // Evita il flash del banner durante l'idratazione
  if (!ready) return null;

  return (
    <>
      {choice === "granted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga-config" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga4Id}', { anonymize_ip: true });
          `}</Script>
        </>
      )}

      {choice === null && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Preferenze cookie"
          className="fixed bottom-0 inset-x-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,23,42,0.18)] border border-black/[0.08] p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <p className="font-bold text-brand-text text-sm mb-1.5">
                Usiamo i cookie per capire come va il sito
              </p>
              <p className="text-brand-text-light text-sm leading-relaxed">
                Solo statistiche anonime di navigazione, nessuna pubblicità e nessun
                pixel di terze parti. Puoi rifiutare senza perdere nulla del sito.{" "}
                <Link
                  href="/cookie-policy"
                  className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
                >
                  Cookie Policy
                </Link>
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => decide("denied")}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-lg border border-gray-200 text-brand-text font-semibold text-sm hover:bg-brand-gray transition"
              >
                Rifiuta
              </button>
              <button
                onClick={() => decide("granted")}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-lg bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue-dark transition"
              >
                Accetta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
