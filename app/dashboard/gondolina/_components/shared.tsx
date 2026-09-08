"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

// ─── Types (schema Gondolina) ─────────────────────────────────────

export type Ga4Totals = {
  sessioni: number; utenti: number; nuovi_utenti: number;
  transazioni: number; revenue: number; sessioni_engaged?: number;
  bounce_rate?: number; durata_media?: number; aov?: number;
  conversion_rate_pct?: number;
};

export type SummaryWindow = {
  sessioni: number; utenti: number; nuovi_utenti: number;
  transazioni_ga4: number; revenue_ga4: number; aov_ga4: number;
  conversion_rate_pct: number;
  add_to_cart: number; checkout: number;
  tasso_carrello_pct: number; tasso_checkout_pct: number; tasso_acquisto_pct: number;
  spesa_online: number; spesa_totale: number;
  impression: number; click: number; ctr_pct: number; cpc: number;
  conversioni_adv: number; valore_adv: number;
  roas: number; cpa: number;
  indicazioni: number; chiamate: number;
  click_organici: number; impression_organiche: number; ctr_organico_pct: number;
  attribuito_su_ga4_pct: number;
};

export type GrowthTile = { fronte: string; valore: number; delta_pct: number; unita: string };

export type CreativeSet = { label: string; days: number; rows: (string | number)[][] };

export type GondolinaData = {
  updated_at?: string;
  history_days?: number;
  perimetro?: string;
  objectives?: string[];
  online_objectives?: string[];

  adv?: {
    daily?: (string | number)[][];              // [data, piattaforma, obiettivo, campagna, tipo, spesa, imp, click, conv, valore, indicazioni, chiamate]
    head?: string[];
    classificazione?: (string | number)[][];    // [campagna, piattaforma, obiettivo, metodo, spesa]
    classificazione_head?: string[];
    search_terms_w30?: (string | number)[][];   // [campagna, termine, corrispondenza, click, costo, conversioni, valore]
  };

  meta?: {
    creatives?: { w7?: CreativeSet; w30?: CreativeSet; w90?: CreativeSet };
  };

  ga4?: {
    daily?: (string | number)[][];              // [data, sessioni, utenti, nuovi, trans, revenue]
    funnel_daily?: (string | number)[][];       // [data, sessioni, item_visti, atc, checkout, acquisti]
    channels_daily?: (string | number)[][];     // [data, canale, sessioni, utenti, nuovi, trans, rev]
    sources_w30?: (string | number)[][];        // [sorgente, mezzo, sess, users, nuovi, trans, rev]
    campaigns_w30?: (string | number)[][];      // [camp, sess, users, nuovi, trans, rev]
    landing_w30?: (string | number)[][];        // [pagina, sess, bounce_rate, trans, rev]
    demo?: { eta?: (string | number)[][]; genere?: (string | number)[][] };
    geo?: { paesi?: (string | number)[][]; regioni?: (string | number)[][]; citta?: (string | number)[][] };
    devices?: (string | number)[][];
    nuovi_vs_ritorno?: (string | number)[][];
    prodotti_w30?: (string | number)[][];       // [prod, visti, atc, acquistati, revenue]
    prodotti_w90?: (string | number)[][];
    totals?: { w7?: Ga4Totals; w30?: Ga4Totals; p30?: Ga4Totals; w90?: Ga4Totals };
  };

  gsc?: {
    daily?: (string | number)[][];              // [data, click, imp, ctr_pct, pos]
    queries_w30?: (string | number)[][];
    queries_w90?: (string | number)[][];
    pages_w30?: (string | number)[][];
    paesi_w30?: (string | number)[][];
    devices_w30?: (string | number)[][];
    ultimo_giorno?: string;
  };

  summary?: { w30?: SummaryWindow; p30?: SummaryWindow };
  growth_w30?: GrowthTile[];
};

// ─── Verdetti creatività (Gondolina: obiettivo Online = vendite) ──

export const AD_CFG = {
  ROAS_GOOD: 2.0,
  FREQ_HIGH: 2.6,
  MIN_SPEND: 100,
  CTR_DROP: 0.20,
} as const;

export const SALES_OBJECTIVES = new Set(["OUTCOME_SALES", "CONVERSIONS", "OUTCOME_ONLINE"]);

// ─── Config obiettivi Drive-to-Store (ROAS non rappresentativo) ───

export const DTS_OBJECTIVE = "Drive to Store";

// ─── Palette Gondolina (bordeaux + oro) ───────────────────────────

export const ACCENT = "#7B2233";     // bordeaux
export const ACCENT_SOFT = "#a03248";
export const GOLD = "#C9A227";       // oro
export const GOLD_SOFT = "#dcbb45";
export const CHART_PALETTE = [
  "#7B2233", "#C9A227", "#4a7a8a", "#a03248",
  "#8a7a3a", "#5a4a6a", "#c88a4a", "#9aa4a4",
];
export const POSITIVE = "#22c55e";
export const NEGATIVE = "#ef4444";
export const NEUTRAL = "rgba(148,163,184,0.9)";

// ─── Re-export UI + theme from VitaeDNA shared ────────────────────

export {
  ThemeProvider, useTheme, DARK_PALETTE, LIGHT_PALETTE,
  type Theme, type Palette,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, Skeleton, tableStyles,
  InfoTooltip, Sparkline,
  eur, eur0, integer, num, pctStr, fmtDate, fmtDateTime,
  calcDelta, invertDeltaColor, type DeltaInfo,
} from "../../vitaedna/_components/shared";

// ─── Date range system ────────────────────────────────────────────

export type RangePreset = "w7" | "w30" | "w90" | "mtd" | "last_month" | "ytd" | "custom";
export type ComparisonMode = "prev" | "yoy" | "none";
export type DateRange = { start: string; end: string; days: number };

export const PRESET_LABEL: Record<RangePreset, string> = {
  w7: "Ultimi 7 giorni", w30: "Ultimi 30 giorni", w90: "Ultimi 90 giorni",
  mtd: "Mese corrente", last_month: "Mese scorso", ytd: "Anno in corso",
  custom: "Personalizzato",
};
export const COMPARE_LABEL: Record<ComparisonMode, string> = {
  prev: "vs periodo precedente", yoy: "vs anno precedente", none: "nessuna comparazione",
};

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function daysBetween(startISO: string, endISO: string): number {
  const s = fromISO(startISO).getTime();
  const e = fromISO(endISO).getTime();
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}
export function addDaysISO(iso: string, days: number): string {
  const d = fromISO(iso); d.setDate(d.getDate() + days); return toISO(d);
}
export function subYearISO(iso: string): string {
  const d = fromISO(iso); d.setFullYear(d.getFullYear() - 1); return toISO(d);
}

export function coverageFromData(data: GondolinaData | null): { min: string; max: string } | null {
  if (!data) return null;
  const series: (string | number)[][][] = [
    data.ga4?.daily ?? [], data.gsc?.daily ?? [], data.adv?.daily ?? [], data.ga4?.channels_daily ?? [],
  ];
  let min: string | null = null;
  let max: string | null = null;
  for (const arr of series) for (const r of arr) {
    const d = String(r[0] ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  if (!min || !max) return null;
  return { min, max };
}

export function computePresetRange(preset: RangePreset, today: string, custom?: DateRange | null): DateRange {
  const t = fromISO(today);
  switch (preset) {
    case "w7":  return { start: addDaysISO(today, -6), end: today, days: 7 };
    case "w30": return { start: addDaysISO(today, -29), end: today, days: 30 };
    case "w90": return { start: addDaysISO(today, -89), end: today, days: 90 };
    case "mtd": {
      const s = toISO(new Date(t.getFullYear(), t.getMonth(), 1));
      return { start: s, end: today, days: daysBetween(s, today) };
    }
    case "last_month": {
      const first = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const last = new Date(t.getFullYear(), t.getMonth(), 0);
      const s = toISO(first), e = toISO(last);
      return { start: s, end: e, days: daysBetween(s, e) };
    }
    case "ytd": {
      const s = toISO(new Date(t.getFullYear(), 0, 1));
      return { start: s, end: today, days: daysBetween(s, today) };
    }
    case "custom":
      if (custom) return { ...custom, days: daysBetween(custom.start, custom.end) };
      return { start: addDaysISO(today, -29), end: today, days: 30 };
  }
}
export function computeCompareRange(range: DateRange, mode: ComparisonMode): DateRange | null {
  if (mode === "none") return null;
  const days = range.days;
  if (mode === "prev") {
    const end = addDaysISO(range.start, -1);
    const start = addDaysISO(end, -(days - 1));
    return { start, end, days };
  }
  if (mode === "yoy") {
    const start = subYearISO(range.start);
    const end = subYearISO(range.end);
    return { start, end, days: daysBetween(start, end) };
  }
  return null;
}

// Clip a range to the coverage (used for SEO which stops at gsc.ultimo_giorno)
export function clipRange(range: DateRange, maxDate: string | null | undefined): DateRange {
  if (!maxDate || range.end <= maxDate) return range;
  return { start: range.start, end: maxDate, days: daysBetween(range.start, maxDate) };
}

// ─── Range Context ────────────────────────────────────────────────

export type DateRangeState = {
  preset: RangePreset; compare: ComparisonMode;
  range: DateRange; compareRange: DateRange | null;
  coverage: { min: string; max: string } | null;
  setPreset: (p: RangePreset) => void;
  setCompare: (c: ComparisonMode) => void;
  setCustomRange: (r: DateRange) => void;
  today: string;
};

const initialToday = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

export const DateRangeContext = createContext<DateRangeState>({
  preset: "w30", compare: "prev",
  range: { start: addDaysISO(initialToday, -29), end: initialToday, days: 30 },
  compareRange: null, coverage: null,
  setPreset: () => {}, setCompare: () => {}, setCustomRange: () => {},
  today: initialToday,
});

export function useDateRange() { return useContext(DateRangeContext); }

export function DateRangeProvider({
  today, coverage, children,
}: { today: string; coverage: { min: string; max: string } | null; children: React.ReactNode }) {
  const [preset, setPresetState] = useState<RangePreset>("w30");
  const [compare, setCompareState] = useState<ComparisonMode>("prev");
  const [custom, setCustom] = useState<DateRange | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("pf.gondolina.preset");
      const c = localStorage.getItem("pf.gondolina.compare");
      const cs = localStorage.getItem("pf.gondolina.customStart");
      const ce = localStorage.getItem("pf.gondolina.customEnd");
      if (p && ["w7", "w30", "w90", "mtd", "last_month", "ytd", "custom"].includes(p)) setPresetState(p as RangePreset);
      if (c === "prev" || c === "yoy" || c === "none") setCompareState(c);
      if (cs && ce) setCustom({ start: cs, end: ce, days: daysBetween(cs, ce) });
    } catch {}
  }, []);

  const setPreset = useCallback((p: RangePreset) => {
    setPresetState(p);
    try { localStorage.setItem("pf.gondolina.preset", p); } catch {}
  }, []);
  const setCompare = useCallback((c: ComparisonMode) => {
    setCompareState(c);
    try { localStorage.setItem("pf.gondolina.compare", c); } catch {}
  }, []);
  const setCustomRange = useCallback((r: DateRange) => {
    setCustom(r); setPresetState("custom");
    try {
      localStorage.setItem("pf.gondolina.customStart", r.start);
      localStorage.setItem("pf.gondolina.customEnd", r.end);
      localStorage.setItem("pf.gondolina.preset", "custom");
    } catch {}
  }, []);

  const range = useMemo(() => computePresetRange(preset, today, custom), [preset, today, custom]);
  const compareRange = useMemo(() => computeCompareRange(range, compare), [range, compare]);

  const value = useMemo<DateRangeState>(() => ({
    preset, compare, range, compareRange, coverage,
    setPreset, setCompare, setCustomRange, today,
  }), [preset, compare, range, compareRange, coverage, setPreset, setCompare, setCustomRange, today]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

// ─── Nav ──────────────────────────────────────────────────────────

export type TabKey = "panoramica" | "advertising" | "traffico" | "seo" | "salute";

export const NavContext = createContext<{ setTab: (t: TabKey) => void }>({ setTab: () => {} });
export function useNav() { return useContext(NavContext); }

// ─── Aggregation helpers ──────────────────────────────────────────

export function inRange(row: (string | number)[], startISO: string, endISO: string, dateIdx = 0): boolean {
  const d = String(row[dateIdx] ?? "");
  return d >= startISO && d <= endISO;
}

export function sumInRange(
  daily: (string | number)[][] | undefined, range: DateRange, valueIdx: number, dateIdx = 0,
): number {
  if (!daily) return 0;
  let s = 0;
  for (const r of daily) if (inRange(r, range.start, range.end, dateIdx)) s += Number(r[valueIdx]) || 0;
  return s;
}

export function groupSumInRange(
  daily: (string | number)[][] | undefined, range: DateRange, keyIdx: number, valueIdx: number, dateIdx = 0,
): Map<string, number> {
  const out = new Map<string, number>();
  if (!daily) return out;
  for (const r of daily) {
    if (!inRange(r, range.start, range.end, dateIdx)) continue;
    const k = String(r[keyIdx] ?? "");
    out.set(k, (out.get(k) ?? 0) + (Number(r[valueIdx]) || 0));
  }
  return out;
}

export function groupInRange(
  daily: (string | number)[][] | undefined, range: DateRange, keyIdx: number, valueIndices: number[], dateIdx = 0,
): Map<string, number[]> {
  const out = new Map<string, number[]>();
  if (!daily) return out;
  for (const r of daily) {
    if (!inRange(r, range.start, range.end, dateIdx)) continue;
    const k = String(r[keyIdx] ?? "");
    const arr = out.get(k) ?? valueIndices.map(() => 0);
    for (let i = 0; i < valueIndices.length; i++) arr[i] += Number(r[valueIndices[i]]) || 0;
    out.set(k, arr);
  }
  return out;
}

export function dailyInRange(
  daily: (string | number)[][] | undefined, range: DateRange, dateIdx = 0,
): (string | number)[][] {
  if (!daily) return [];
  return daily
    .filter((r) => inRange(r, range.start, range.end, dateIdx))
    .sort((a, b) => String(a[dateIdx]).localeCompare(String(b[dateIdx])));
}

// Detect brand queries (semplice contains "gondolina")
export function isBrandQuery(q: string): boolean {
  return /gondolina/i.test(q || "");
}

// Advertising: check if a data row has campaign activity in a given range
export function hasAdvActivity(daily: (string | number)[][] | undefined, range: DateRange): boolean {
  if (!daily) return false;
  for (const r of daily) {
    if (inRange(r, range.start, range.end, 0) && (Number(r[5]) || 0) > 0) return true;
  }
  return false;
}
