"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Vero una volta che l'elemento è entrato nel viewport, e resta vero.
 * Nel dubbio (viewport non misurabile, API assente) risponde subito vero:
 * meglio mostrare che nascondere.
 */
function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => setVisible(true);

    if (!window.innerHeight || typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/** Filetto che si disegna da sinistra quando la sezione entra in pagina. */
export function RevealLine({
  tone = "light",
  delay = 0,
  className = "",
}: {
  tone?: "light" | "dark";
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useInViewOnce<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`h-px w-full origin-left ${className}`}
      style={{
        background: tone === "dark" ? "var(--rule-invert)" : "var(--rule)",
        transform: reduceMotion || visible ? "scaleX(1)" : "scaleX(0)",
        transition: `transform 1.1s var(--ease-out-expo) ${delay}s`,
      }}
    />
  );
}

/**
 * Rivela il contenuto quando entra nel viewport.
 *
 * Usiamo un IntersectionObserver nostro invece di `whileInView` di
 * framer-motion: su alcune combinazioni di browser e viewport il rilevamento
 * della libreria non scatta e il contenuto resterebbe invisibile per sempre.
 * Qui, in più, controlliamo la posizione già al mount e teniamo un timer di
 * sicurezza: nel dubbio si mostra, non si nasconde.
 *
 * `variant="mask"` scopre il contenuto dall'alto come una tenda: è il gesto da
 * riservare ai titoli, dove si nota. Con il movimento ridotto attivo nel
 * sistema operativo il contenuto appare e basta.
 */
export default function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = "fade",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade" | "mask";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => setVisible(true);

    // Viewport degenere (finestra a dimensione zero, contesti headless): non
    // possiamo misurare nulla, quindi mostriamo invece di nascondere.
    if (!window.innerHeight || typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    // Già a schermo al primo render (es. contenuti dell'hero)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const hidden = variant === "mask"
    ? { opacity: 0, y: "18%", clipPath: "inset(0 0 100% 0)" }
    : { opacity: 0, y: 18 };
  const shown = variant === "mask"
    ? { opacity: 1, y: "0%", clipPath: "inset(0 0 -20% 0)" }
    : { opacity: 1, y: 0 };

  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={visible ? shown : hidden}
      transition={{
        duration: variant === "mask" ? 1 : 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
