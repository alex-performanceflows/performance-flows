// Configurazione Onlywood · allineare a CONFIG.V del motore Apps Script

// Soglie verdetto creatività: i verdetti li calcola il motore, qui servono
// solo per colorare tabelle e matrici e per le linee di riferimento.
export const AD_CFG = {
  ROAS_SCALA: 2.5,
  ROAS_MANTIENI: 1.5,
  ROAS_SPEGNI: 0.8,
  FREQ_MAX: 3.0,
  SPESA_MIN: 100,
  SPESA_NUOVA: 40,
  GIORNI_NUOVA: 5,
  CTR_LINK_OK: 1.0,
  CPA_MAX: 80,
} as const;

// Palette presa da onlywood.it: il verde è quello del tema del sito
// (--wd-primary-color: rgb(68,152,54)), i verdi scuri e i legni sono
// campionati dal logo ufficiale (logo20anni-web.png).
export const BRAND_GREEN = "#449836";   // verde del marchio, usato anche per i prezzi sul sito
export const GREEN_DEEP = "#0d7a34";    // verde pieno del cartello nel logo
export const GREEN_FOREST = "#0e4824";  // verde scuro del bordo
export const BRAND_DARK = "#0f1d14";    // fondo del tema scuro
export const ACCENT = BRAND_GREEN;
export const ACCENT_SOFT = "#6bb85c";   // stesso verde schiarito, per hover e linee sottili
export const WOOD = "#c89a66";          // legno delle lettere del logo
export const WOOD_SOFT = "#d3a868";
export const CREAM = "#f4f1ea";

// Prime due tinte: verde e legno del marchio. Le altre restano nella stessa
// famiglia ma abbastanza distanti da distinguersi in una lista di otto voci.
// Il verde scuro del bordo del logo (#0e4824) qui non entra: su fondo scuro
// sparisce, quindi resta solo per bordi e riempimenti.
export const CHART_PALETTE = [
  "#449836", "#c89a66", "#4a7c7e", "#a4643c",
  "#0d7a34", "#d3a868", "#7fa650", "#8f7048",
];

export const POSITIVE = "#22c55e";
export const NEGATIVE = "#ef4444";
export const NEUTRAL = "rgba(148,163,184,0.9)";

// Verdetti emessi dal motore (computeVerdetti_)
export type Verdict =
  | "SCALA" | "MANTIENI" | "RINNOVA" | "DA RIVEDERE"
  | "SPEGNI" | "OSSERVA" | "IN RACCOLTA";

export const VERDICT_UI: Record<Verdict, { color: string; bg: string; short: string }> = {
  "SCALA":       { color: "#22c55e", bg: "rgba(34,197,94,0.18)",   short: "Scala" },
  "MANTIENI":    { color: "#94a3b8", bg: "rgba(148,163,184,0.20)", short: "Mantieni" },
  "RINNOVA":     { color: "#f59e0b", bg: "rgba(245,158,11,0.20)",  short: "Rinnova" },
  "DA RIVEDERE": { color: "#eab308", bg: "rgba(234,179,8,0.18)",   short: "Da rivedere" },
  "SPEGNI":      { color: "#ef4444", bg: "rgba(239,68,68,0.20)",   short: "Spegni" },
  "OSSERVA":     { color: "#64748b", bg: "rgba(100,116,139,0.20)", short: "Osserva" },
  "IN RACCOLTA": { color: "#38bdf8", bg: "rgba(56,189,248,0.20)",  short: "In raccolta" },
};

export function verdictUi(v: string) {
  return VERDICT_UI[v as Verdict] ?? { color: NEUTRAL, bg: "rgba(148,163,184,0.15)", short: v || "—" };
}

// Obiettivi campagna riconosciuti dal motore
export const OBJECTIVES = ["Vendite", "Retargeting", "Lead Generation", "Awareness", "Altro"] as const;
export const LEAD_OBJECTIVES: string[] = ["Lead Generation"];

// Hook e hold hanno senso solo sui formati video
export function isVideoFormat(formato: string): boolean {
  const f = formato.toLowerCase();
  return f.includes("reel") || f.includes("video");
}

// Conversione di acquisto su Google Ads (gads_conv_daily)
export function isPurchaseAction(azione: string, categoria: string): boolean {
  return categoria === "PURCHASE" || /purchase|acquist|ordin/i.test(azione);
}
