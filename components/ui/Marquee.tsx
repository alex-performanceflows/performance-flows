"use client";

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Nastro continuo di loghi. Il contenuto è duplicato e scorre di metà
 * larghezza, così il ciclo si chiude senza salti. Si ferma al passaggio del
 * mouse; con il movimento ridotto attivo resta una riga statica che va a capo.
 */
export default function Marquee({
  children,
  durationSeconds = 46,
  className = "",
}: {
  children: ReactNode;
  durationSeconds?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-12 gap-y-8 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="flex w-max items-center group-hover:[animation-play-state:paused]"
        style={{ animation: `marquee-scroll ${durationSeconds}s linear infinite` }}
      >
        <div className="flex items-center gap-x-16 pr-16" aria-hidden="false">
          {children}
        </div>
        <div className="flex items-center gap-x-16 pr-16" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
