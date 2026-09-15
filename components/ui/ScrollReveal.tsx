"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Rivela il contenuto quando entra nel viewport.
 *
 * Usiamo un IntersectionObserver nostro invece di `whileInView` di
 * framer-motion: su alcune combinazioni di browser e viewport il rilevamento
 * della libreria non scatta e il contenuto resterebbe invisibile per sempre.
 * Qui, in più, controlliamo la posizione già al mount e teniamo un timer di
 * sicurezza: nel dubbio si mostra, non si nasconde.
 */
export default function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
