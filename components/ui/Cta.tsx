"use client";

import type { ReactNode } from "react";

const ARROW = (
  <svg className="arrow w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

type Variant = "accent" | "ink" | "outline-light" | "outline-dark";

const VARIANTS: Record<Variant, string> = {
  accent: "bg-brand-orange text-white",
  ink: "bg-brand-ink text-white",
  "outline-light": "border border-white/25 text-white",
  "outline-dark": "border border-[color:var(--rule-strong)] text-brand-ink",
};

/** Pulsante principale: superficie che sale al passaggio del mouse, freccia che avanza. */
export function Cta({
  href,
  children,
  variant = "accent",
  className = "",
  type,
  disabled,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const classes = [
    "btn-sweep arrow-slide group inline-flex items-center justify-center gap-3",
    "px-8 py-4 rounded-full text-sm font-semibold tracking-[0.01em]",
    "transition-colors duration-300",
    VARIANTS[variant],
    disabled ? "opacity-60 cursor-not-allowed" : "",
    className,
  ].join(" ");

  const content = (
    <>
      <span>{children}</span>
      {ARROW}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button type={type ?? "button"} disabled={disabled} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

/** Link di testo con sottolineatura che entra da sinistra. */
export function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`arrow-slide inline-flex items-center gap-2.5 text-sm font-semibold ${className}`}
    >
      <span className="link-sweep">{children}</span>
      {ARROW}
    </a>
  );
}
