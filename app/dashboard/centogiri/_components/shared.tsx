"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

// ─── Data types (schema Centogiri) ────────────────────────────────

export type LeadsTotals = { w7?: number; w30?: number; p30?: number };
export type WooTotals = { revenue: number; orders: number; aov: number };
export type Ga4Totals = { sessions: number; users: number; transactions: number; revenue: number };
export type BlendedWindow = {
  spend_meta: number; spend_gads: number; spend_total: number;
  leads: number; cpl: number;
  revenue_woo: number; orders_woo: number; revenue_ga4: number;
};
export type CreativeSet = { label: string; days: number; rows: (string | number)[][] };

export type CentogiriData = {
  updated_at?: string;
  history_days?: number;

  leads?: {
    daily?: (string | number)[][];          // [data, form, conteggio]
    by_form_w30?: (string | number)[][];    // [form, conteggio]
    totals?: LeadsTotals;                    // numeri diretti
    first_date?: string | null;              // yyyy-MM-dd
    sources?: { storico?: number; webhook?: number };
  };

  woo?: {
    totals?: { w7?: WooTotals; w30?: WooTotals; w90?: WooTotals; p30?: WooTotals };
    daily?: (string | number)[][];           // [data, revenue, ordini]
    by_product?: (string | number)[][];      // w30
    coupons?: (string | number)[][];         // w30
  };

  ga4?: {
    channels?: { w7?: (string | number)[][]; w30?: (string | number)[][] };
    channels_daily?: (string | number)[][];  // [data, canale, sessioni, utenti, transazioni, revenue]
    daily?: (string | number)[][];           // [data, sessioni, utenti]
    demo?: { age?: (string | number)[][]; gender?: (string | number)[][] };  // w30
    geo?: { country?: (string | number)[][]; region?: (string | number)[][] };
    devices?: (string | number)[][];
    totals?: { w30?: Ga4Totals; p30?: Ga4Totals };
  };

  gsc?: {
    daily?: (string | number)[][];       // [data, click, impression, ctr_pct, posizione]
    queries_w30?: (string | number)[][]; // top 20
    pages_w30?: (string | number)[][];   // top 10
  };

  meta?: {
    campaigns?: {
      w7?: (string | number)[][];
      w30?: (string | number)[][];
      p30?: (string | number)[][];
    };  // [campagna, obiettivo, spesa, impression, click, ctr, lead, contatti, interazioni, acquisti, valore]
    campaigns_daily?: (string | number)[][];
    // [data, campagna, obiettivo, spesa, impression, click, lead, contatti, interazioni, acquisti, valore]
    creatives?: { w7?: CreativeSet; w30?: CreativeSet; w90?: CreativeSet };
    // creative row: [nome, stato, obiettivo, spesa, impression, reach, frequenza, click, ctr, cpm, cpc, lead, contatti, interazioni, lpv, acquisti, valore, cpl]
  };

  gads?: (string | number)[][];
  // [campagna, costo7, conv7, val7, costo30, conv30, val30, cpa30, roas30, costoP30, convP30, valP30]

  gads_daily?: (string | number)[][];
  // [data, campagna, tipo, costo, impression, click, conv, valore, conv_totali, chiamate]

  gads_conv_daily?: (string | number)[][];
  // [data, campagna, azione, categoria, conv, conv_totali]

  blended?: { w30?: BlendedWindow; p30?: BlendedWindow };
};

// ─── Meta objectives config ───────────────────────────────────────

export const LEAD_OBJECTIVES = new Set([
  "OUTCOME_LEADS", "LEAD_GENERATION", "CONVERSIONS",
]);

export function isLeadObjective(obj: string): boolean {
  return LEAD_OBJECTIVES.has((obj || "").toUpperCase());
}

// ─── Advertising thresholds ───────────────────────────────────────

export const AD_CFG = {
  CPL_GOOD: 15,          // €
  FREQ_HIGH: 2.6,
  MIN_SPEND: 80,         // € — spesa minima w30 per verdetto affidabile
  CTR_DROP: 0.20,        // −20% CTR w7 vs w30 = fatigue
} as const;

// ─── Google Ads conversion categories ─────────────────────────────

export const PHONE_CATEGORY = new Set([
  "PHONE_CALL_LEAD", "PHONE_CALLS",
]);

// ─── Colors (palette Centogiri, dai cerchi concentrici del logo) ──

export const ACCENT = "#ea580c";       // arancione principale (esterno cerchio + testo)
export const ACCENT_SOFT = "#f4b826";  // giallo/oro (secondo anello)
export const ACCENT_MUTED = "#c04b2d"; // rosso mattone (cerchio esterno logo)
export const BRAND_CYAN = "#2aa9af";   // turchese (anello interno)

export const CHART_PALETTE = [
  "#ea580c", "#2aa9af", "#f4b826", "#c04b2d",  // brand
  "#0ea5e9", "#22c55e", "#a78bfa", "#f472b6",  // supplementari per dataset numerosi
];
export const POSITIVE = "#22c55e";
export const NEGATIVE = "#ef4444";
export const NEUTRAL = "rgba(148,163,184,0.9)";

// ─── Reuse theme, formatters, UI from VitaeDNA shared ─────────────

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
  w7: "Ultimi 7 giorni",
  w30: "Ultimi 30 giorni",
  w90: "Ultimi 90 giorni",
  mtd: "Mese corrente",
  last_month: "Mese scorso",
  ytd: "Anno in corso",
  custom: "Personalizzato",
};

export const PRESET_LABEL_SHORT: Record<RangePreset, string> = {
  w7: "7g", w30: "30g", w90: "90g",
  mtd: "MTD", last_month: "M-1", ytd: "YTD",
  custom: "Custom",
};

export const COMPARE_LABEL: Record<ComparisonMode, string> = {
  prev: "vs periodo precedente",
  yoy: "vs anno precedente",
  none: "nessuna comparazione",
};

// ─── Date helpers ─────────────────────────────────────────────────

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
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function subYearISO(iso: string): string {
  const d = fromISO(iso);
  d.setFullYear(d.getFullYear() - 1);
  return toISO(d);
}

// Trova il range effettivo dei dati disponibili per il selector
export function coverageFromData(data: CentogiriData | null): { min: string; max: string } | null {
  if (!data) return null;
  const dailySeries: (string | number)[][][] = [
    data.woo?.daily ?? [],
    data.ga4?.daily ?? [],
    data.gsc?.daily ?? [],
    data.leads?.daily ?? [],
  ];
  let min: string | null = null;
  let max: string | null = null;
  for (const arr of dailySeries) {
    for (const r of arr) {
      const d = String(r[0] ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    }
  }
  if (!min || !max) return null;
  return { min, max };
}

// Preset → date range (rispetto ad un "today" di riferimento)
export function computePresetRange(preset: RangePreset, today: string, customRange?: DateRange | null): DateRange {
  const endDefault = today;
  const t = fromISO(today);
  switch (preset) {
    case "w7": {
      const start = addDaysISO(endDefault, -6);
      return { start, end: endDefault, days: 7 };
    }
    case "w30": {
      const start = addDaysISO(endDefault, -29);
      return { start, end: endDefault, days: 30 };
    }
    case "w90": {
      const start = addDaysISO(endDefault, -89);
      return { start, end: endDefault, days: 90 };
    }
    case "mtd": {
      const start = toISO(new Date(t.getFullYear(), t.getMonth(), 1));
      return { start, end: endDefault, days: daysBetween(start, endDefault) };
    }
    case "last_month": {
      const first = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const last = new Date(t.getFullYear(), t.getMonth(), 0);
      const start = toISO(first);
      const end = toISO(last);
      return { start, end, days: daysBetween(start, end) };
    }
    case "ytd": {
      const start = toISO(new Date(t.getFullYear(), 0, 1));
      return { start, end: endDefault, days: daysBetween(start, endDefault) };
    }
    case "custom": {
      if (customRange) return { ...customRange, days: daysBetween(customRange.start, customRange.end) };
      const start = addDaysISO(endDefault, -29);
      return { start, end: endDefault, days: 30 };
    }
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

// ─── Range context ────────────────────────────────────────────────

export type DateRangeState = {
  preset: RangePreset;
  compare: ComparisonMode;
  range: DateRange;
  compareRange: DateRange | null;
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
  compareRange: null,
  coverage: null,
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
      const p = localStorage.getItem("pf.centogiri.preset");
      const c = localStorage.getItem("pf.centogiri.compare");
      const cs = localStorage.getItem("pf.centogiri.customStart");
      const ce = localStorage.getItem("pf.centogiri.customEnd");
      if (p && ["w7", "w30", "w90", "mtd", "last_month", "ytd", "custom"].includes(p)) setPresetState(p as RangePreset);
      if (c === "prev" || c === "yoy" || c === "none") setCompareState(c);
      if (cs && ce) setCustom({ start: cs, end: ce, days: daysBetween(cs, ce) });
    } catch {}
  }, []);

  const setPreset = useCallback((p: RangePreset) => {
    setPresetState(p);
    try { localStorage.setItem("pf.centogiri.preset", p); } catch {}
  }, []);
  const setCompare = useCallback((c: ComparisonMode) => {
    setCompareState(c);
    try { localStorage.setItem("pf.centogiri.compare", c); } catch {}
  }, []);
  const setCustomRange = useCallback((r: DateRange) => {
    setCustom(r);
    setPresetState("custom");
    try {
      localStorage.setItem("pf.centogiri.customStart", r.start);
      localStorage.setItem("pf.centogiri.customEnd", r.end);
      localStorage.setItem("pf.centogiri.preset", "custom");
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

// ─── Nav (tab switch) ─────────────────────────────────────────────

export type TabKey = "panoramica" | "traffico" | "seo" | "lead" | "advertising";

export const NavContext = createContext<{ setTab: (t: TabKey) => void }>({
  setTab: () => {},
});

export function useNav() { return useContext(NavContext); }

// ─── Aggregation helpers ──────────────────────────────────────────

// Filtra righe daily nel range (inclusi start/end)
export function inRange(row: (string | number)[], startISO: string, endISO: string, dateIdx = 0): boolean {
  const d = String(row[dateIdx] ?? "");
  return d >= startISO && d <= endISO;
}

// Somma un campo numerico su tutte le righe daily del range
export function sumInRange(
  daily: (string | number)[][] | undefined,
  range: DateRange,
  valueIdx: number,
  dateIdx = 0,
): number {
  if (!daily) return 0;
  let s = 0;
  for (const r of daily) {
    if (!inRange(r, range.start, range.end, dateIdx)) continue;
    s += Number(r[valueIdx]) || 0;
  }
  return s;
}

// Raggruppa righe daily per una key (colonna testuale) e somma un value
export function groupSumInRange(
  daily: (string | number)[][] | undefined,
  range: DateRange,
  keyIdx: number,
  valueIdx: number,
  dateIdx = 0,
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

// Raggruppa righe daily per una key con più value indices (ritorna array di record)
export function groupInRange(
  daily: (string | number)[][] | undefined,
  range: DateRange,
  keyIdx: number,
  valueIndices: number[],
  dateIdx = 0,
): Map<string, number[]> {
  const out = new Map<string, number[]>();
  if (!daily) return out;
  for (const r of daily) {
    if (!inRange(r, range.start, range.end, dateIdx)) continue;
    const k = String(r[keyIdx] ?? "");
    const arr = out.get(k) ?? valueIndices.map(() => 0);
    for (let i = 0; i < valueIndices.length; i++) {
      arr[i] += Number(r[valueIndices[i]]) || 0;
    }
    out.set(k, arr);
  }
  return out;
}

// Serie giornaliera nel range (ordinata asc)
export function dailyInRange(
  daily: (string | number)[][] | undefined,
  range: DateRange,
  dateIdx = 0,
): (string | number)[][] {
  if (!daily) return [];
  return daily
    .filter((r) => inRange(r, range.start, range.end, dateIdx))
    .sort((a, b) => String(a[dateIdx]).localeCompare(String(b[dateIdx])));
}
