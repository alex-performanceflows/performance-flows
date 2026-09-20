"use client";

import type { ReactNode } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";

/**
 * Testata di sezione: occhiello con filetto, titolo grande, testo di apertura.
 * Tiene lo stesso ritmo in tutte le sezioni, chiare e scure.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  const dark = tone === "dark";
  const centered = align === "center";

  return (
    <div className={`${centered ? "text-center" : ""} ${className}`}>
      {eyebrow && (
        <ScrollReveal>
          <div className={`flex items-center gap-4 mb-6 ${centered ? "justify-center" : ""}`}>
            <span className="h-px w-8 bg-brand-orange/70" aria-hidden="true" />
            <p className="eyebrow text-brand-orange">{eyebrow}</p>
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal variant="mask" delay={eyebrow ? 0.06 : 0}>
        <h2 className={`display-2 ${dark ? "text-white" : "text-brand-ink"}`}>{title}</h2>
      </ScrollReveal>

      {lead && (
        <ScrollReveal delay={0.16}>
          <p
            className={`lead mt-6 max-w-2xl ${centered ? "mx-auto" : ""} ${
              dark ? "text-white/65" : "text-brand-text-light"
            }`}
          >
            {lead}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
