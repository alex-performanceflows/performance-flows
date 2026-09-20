"use client";

import { useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { Cta } from "@/components/ui/Cta";

/**
 * Il pulsante segue leggermente il puntatore quando gli si avvicina e torna al
 * suo posto quando esce. Lo spostamento è di pochi pixel: si sente più che
 * vedersi. Su touch e con il movimento ridotto attivo resta fermo.
 */
export default function MagneticCta({
  href,
  children,
  strength = 0.22,
}: {
  href: string;
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setOffset({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    });
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
      className="inline-block"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0
          ? "transform 0.6s var(--ease-out-expo)"
          : "transform 0.15s ease-out",
      }}
    >
      <Cta href={href}>{children}</Cta>
    </div>
  );
}
