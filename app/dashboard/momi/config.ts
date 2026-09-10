// Configurazione soglie MOMI · allineare a CONFIG.V_APP del motore Apps Script

// Verdetti creatività — soglie a titolo di riferimento visivo. I verdetti
// li calcola il motore server-side, qui servono solo per la matrice e per
// gli highlight in tabella.
export const V_APP = {
  CPR_GOOD: 1.80,     // sotto = ottimo
  CPR_HIGH: 3.50,     // sopra = fatigue rossa
  FREQ_HIGH: 3.0,     // sopra = fatigue (allargare audience)
  FREQ_VERY_HIGH: 4.0,
  MIN_SPEND: 60,      // spesa minima w30 per emettere verdetto forte
  HOOK_LOW: 25,       // sotto = ambra
  HOLD_LOW: 40,       // sotto = ambra
  INST_REG_LOW: 40,   // sotto = ambra
} as const;

export const V_FAN = {
  CPV_GOOD: 0.05,
  CPV_HIGH: 0.15,
  FREQ_HIGH: 3.0,
  MIN_SPEND: 30,
} as const;

// Soglia % di spesa su creatività SPEGNI oltre cui l'header diventa rosso
export const SPESA_SPEGNI_ALERT_PCT = 15;

// Palette · brand ufficiale MOMI (getmomi.com)
export const BRAND_NAVY = "#1a203d";       // navy MOMI (dal logo)
export const ACCENT = "#7d87ff";           // indigo chiaro leggibile su dark
export const CREAM = "#f3eee8";            // testi in evidenza
export const CREAM_SOFT = "#e5ddd0";
export const CHART_PALETTE = [
  "#7d87ff", "#f3eee8", "#a685ff", "#4a5178",
  "#c0c6ff", "#8894c8", "#e0dfff", "#9aa4a4",
];
export const POSITIVE = "#22c55e";
export const NEGATIVE = "#ef4444";
export const NEUTRAL = "rgba(148,163,184,0.9)";

// Colori per verdetti (allineati allo spec)
export type Verdict = "SCALA" | "MANTIENI" | "FATIGUE IN ARRIVO" | "SPEGNI" | "OSSERVA" | "NUOVA";

export const VERDICT_UI: Record<Verdict, { color: string; bg: string; short: string }> = {
  "SCALA":              { color: "#22c55e", bg: "rgba(34,197,94,0.18)",   short: "Scala" },
  "MANTIENI":           { color: "#94a3b8", bg: "rgba(148,163,184,0.20)", short: "Mantieni" },
  "FATIGUE IN ARRIVO":  { color: "#f59e0b", bg: "rgba(245,158,11,0.20)",  short: "Fatigue" },
  "SPEGNI":             { color: "#ef4444", bg: "rgba(239,68,68,0.20)",   short: "Spegni" },
  "OSSERVA":            { color: "#64748b", bg: "rgba(100,116,139,0.20)", short: "Osserva" },
  "NUOVA":              { color: "#38bdf8", bg: "rgba(56,189,248,0.20)",  short: "Nuova" },
};

// Formati e angoli conosciuti
export const KNOWN_FORMATS = ["Reel", "Video", "Statico", "Carosello", "Post"] as const;
export const KNOWN_ANGLES = [
  "Cappello", "Recensione", "Feature Spazi", "Feature Ritrovi",
  "Feature Mercatino", "Feature Gravidanza", "Lancio", "Organico", "Altro",
] as const;

// Distinzione famiglia formato (per hook/hold rilevanti solo su video)
export function isVideoFormat(formato: string): boolean {
  const f = formato.toLowerCase();
  return f.includes("reel") || f.includes("video");
}

// Detection registrazioni da gads_conv_daily (nome azione)
export function isSignupAction(azione: string): boolean {
  return /(registr|sign_?up|signup)/i.test(azione);
}
