type Color = "green" | "red" | "yellow" | "violet" | "blue" | "gray";

const COLORS: Record<Color, { bg: string; color: string }> = {
  green:  { bg: "rgba(34,197,94,0.12)",  color: "#4ade80" },
  red:    { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  yellow: { bg: "rgba(234,179,8,0.12)",   color: "#fbbf24" },
  violet: { bg: "rgba(139,92,246,0.12)",  color: "#a78bfa" },
  blue:   { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa" },
  gray:   { bg: "#1e1e1e",               color: "#666" },
};

export function Badge({ label, color = "gray" }: { label: string; color?: Color }) {
  const c = COLORS[color];
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px",
      borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: c.bg, color: c.color,
    }}>
      {label}
    </span>
  );
}

export function statoColor(stato: string): Color {
  const s = stato.toLowerCase();
  if (s === "attivo") return "green";
  if (s === "terminato" || s === "cancellato") return "red";
  if (s === "in pausa" || s === "sospeso") return "yellow";
  if (s === "proposta" || s === "trattativa") return "violet";
  return "gray";
}

export function prioritaColor(p: string): Color {
  if (p === "Alta" || p === "Urgente") return "red";
  if (p === "Media") return "yellow";
  if (p === "Bassa") return "blue";
  return "gray";
}

export function sentimentColor(s: string): Color {
  if (s === "Positivo" || s === "Molto positivo") return "green";
  if (s === "Negativo" || s === "Molto negativo") return "red";
  if (s === "Neutro") return "gray";
  return "gray";
}

export function mrrSemaforo(netto: number): Color {
  if (netto >= 1500) return "green";
  if (netto >= 800) return "yellow";
  return "red";
}
