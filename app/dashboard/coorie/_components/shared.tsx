"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

// ─── Types (schema Coorie Beauty) ─────────────────────────────────

export type CoorieTotals = {
  sessions: number; users: number;
  transactions: number; revenue: number; aov: number;
};

export type BlendedWindow = {
  spend_meta: number; spend_gads: number; spend_total: number;
  revenue_ga4: number; transactions_ga4: number;
  roas_blended: number; cost_per_order: number; aov: number;
};

export type CreativeSet = { label: string; days: number; rows: (string | number)[][] };

export type SourceStatus = { fonte: string; ok: boolean; messaggio: string; ms: number };

export type Health = {
  pixel_coverage_pct: number;
  gads_coverage_pct: number;
  spesa_non_classificata_pct: number;
  gsc_lag_days: number;
  ga4_first_date: string;
  klaviyo_active: boolean;
  // dal motore 2.0
  creativita_non_classificate_pct?: number;
  sources?: SourceStatus[];
  aggiornato?: string;
};

export type MetaBenchmark = {
  affidabile: boolean; n: number;
  ctr_link: number | null; costo_atc: number | null;
  cpm: number | null; roas: number | null; hook: number | null;
};

export type CoorieData = {
  updated_at?: string;
  history_days?: number;

  meta?: {
    creatives?: { w7?: CreativeSet; w30?: CreativeSet; w90?: CreativeSet };
    // [name, obiettivo, spesa, imp, click, ctr, lpv, atc, checkout, acquisti, valore]
    campaigns?: { w7?: (string | number)[][]; w30?: (string | number)[][]; p30?: (string | number)[][] };
    // [data, name, obiettivo, spesa, imp, click, ctr, lpv, atc, checkout, acquisti, valore]
    campaigns_daily?: (string | number)[][];
    // [campagna, obiettivo, metodo, spesa]
    classificazione?: (string | number)[][];

    // ─── dal motore 2.0 ───
    creative_head?: string[];
    // [data, creativita, formato, soggetto, spesa, impression, clickLink, atc, acquisti, valore]
    creatives_daily?: (string | number)[][];
    creative_daily_head?: string[];
    // [nome, formato, soggetto, verdetto, motivo, spesa, costoAtc, atc, acquisti, roas, freq, ctrLink, giorni]
    verdetti?: (string | number)[][];
    verdetti_head?: string[];
    benchmark?: MetaBenchmark;
    // [valore, spesa, impression, clickLink, ctrLink%, atc, costoAtc, acquisti, valoreAcq, roas, hook%]
    per_formato?: (string | number)[][];
    per_soggetto?: (string | number)[][];
    agg_head?: string[];
    // [pubblico, campagna, spesa, impression, freq, clickLink, ctrLink%, cpm, atc, costoAtc, acquisti, roas, cpa]
    adsets_w30?: (string | number)[][];
    adset_head?: string[];
    // [valore, spesa, impression, click, ctr%, cpm, atc, acquisti, valoreAcq, roas]
    paesi_w30?: (string | number)[][];
    placement_w30?: (string | number)[][];
    break_head?: string[];
  };

  // [tipo, imp, click, ctr, costo, conv, cpa, ?, ?, valore, roas, ?]
  gads?: (string | number)[][];
  // [data, campaign, tipo, costo, imp, click, ctr, conv, valore]
  gads_daily?: (string | number)[][];
  // [data, campaign, azione, categoria, conv, valore]
  gads_conv_daily?: (string | number)[][];

  ga4?: {
    first_date?: string;
    // [data, sessions, users, transactions, revenue]
    daily?: (string | number)[][];
    // [data, canale, sess, users, trans, rev]
    channels_daily?: (string | number)[][];
    // [data, tipo("new"|"returning"), users, transactions, revenue]
    newret_daily?: (string | number)[][];
    channels?: { w7?: (string | number)[][]; w30?: (string | number)[][] };
    devices?: (string | number)[][];
    demo?: { age?: (string | number)[][]; gender?: (string | number)[][] };
    geo?: { country?: (string | number)[][]; region?: (string | number)[][] };
    funnel?: {
      w30?: { views: number; atc: number; checkout: number; purchases: number };
      p30?: { views: number; atc: number; checkout: number; purchases: number };
    };
    items?: { w30?: (string | number)[][]; w90?: (string | number)[][] };
    totals?: { w7?: CoorieTotals; w30?: CoorieTotals; w90?: CoorieTotals; p30?: CoorieTotals };
    // ─── dal motore 2.0 ───
    // [data, sessioni, item_visti, atc, checkout, acquisti, revenue]
    funnel_daily?: (string | number)[][];
    funnel_head?: string[];
    // [landing, sessioni, bounce_rate, transazioni, revenue]
    landing_w30?: (string | number)[][];
  };

  gsc?: {
    // [data, click, imp, ctr_pct, pos]
    daily?: (string | number)[][];
    queries_w30?: (string | number)[][];
    pages_w30?: (string | number)[][];
    // dal motore 2.0
    ultimo_giorno?: string | null;
    queries_w90?: (string | number)[][];
    devices_w30?: (string | number)[][];
  };

  klaviyo?: {
    active?: boolean;
    flows?: (string | number)[][];      // [name, status, trigger_type, updated_at]
    campaigns?: (string | number)[][];  // [subject, status, sent_at]
  };

  blended?: { w30?: BlendedWindow; p30?: BlendedWindow };
  health?: Health;
};

// ─── Soglie creatività Meta (Coorie) ──────────────────────────────

export const AD_CFG = {
  CPLPV_GOOD: 2.0,        // costo per LPV soglia buona (€)
  FREQ_HIGH: 2.5,         // frequenza a cui si segnala fatigue
  MIN_SPEND: 50,          // spesa minima per emettere verdetto
  CTR_DROP: 0.20,         // % di calo CTR w7 vs w30 che innesca fatigue
} as const;

// Meta obiettivi Coorie
export const META_OBJECTIVES = [
  "Discovery Set", "Prodotti Singoli", "Bundle", "Retargeting",
  "Brand", "Generico Sales", "Traffico", "Altro",
] as const;

// ─── Palette Coorie (verde salvia + sabbia caldo) ─────────────────

export const ACCENT = "#7A9A7E";      // sage
export const ACCENT_SOFT = "#94b399";
export const SAND = "#C9B896";        // warm sand
export const SAND_SOFT = "#dbc9ab";
export const CHART_PALETTE = [
  "#7A9A7E", "#C9B896", "#6b8290", "#a3735a",
  "#5f7d63", "#8fb2b0", "#b39456", "#9aa4a4",
];
export const POSITIVE = "#22c55e";
export const NEGATIVE = "#ef4444";
export const NEUTRAL = "rgba(148,163,184,0.9)";

// ─── Re-export UI + theme da VitaeDNA shared ──────────────────────

import { useTheme, fmtDate } from "../../vitaedna/_components/shared";

export {
  ThemeProvider, useTheme, DARK_PALETTE, LIGHT_PALETTE,
  type Theme, type Palette,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, Skeleton, tableStyles,
  InfoTooltip, Sparkline,
  eur, eur0, integer, num, pctStr, fmtDate, fmtDateTime,
  calcDelta, invertDeltaColor, type DeltaInfo,
} from "../../vitaedna/_components/shared";

export {
  type CreativeWindow, WINDOW_DAYS, creativeWindowFor,
  type SortDir, type SortState, type SortValue, useTableSort, SortTh,
  ratio, mean, AVG_TITLE, avgRowStyle, useElementWidth,
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
  const a = fromISO(startISO).getTime();
  const b = fromISO(endISO).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISO(iso); d.setDate(d.getDate() + days); return toISO(d);
}

export function subYearISO(iso: string): string {
  const d = fromISO(iso); d.setFullYear(d.getFullYear() - 1); return toISO(d);
}

export function coverageFromData(data: CoorieData | null): { min: string; max: string } | null {
  if (!data) return null;
  const daily = data.ga4?.daily ?? [];
  if (daily.length === 0) return null;
  let min = String(daily[0][0]), max = String(daily[0][0]);
  for (const r of daily) {
    const d = String(r[0]);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

export function computePresetRange(preset: RangePreset, today: string, custom?: DateRange | null): DateRange {
  if (preset === "custom" && custom) return custom;
  const now = fromISO(today);
  let start: Date, end: Date = now;
  if (preset === "w7") { start = new Date(now); start.setDate(now.getDate() - 6); }
  else if (preset === "w30") { start = new Date(now); start.setDate(now.getDate() - 29); }
  else if (preset === "w90") { start = new Date(now); start.setDate(now.getDate() - 89); }
  else if (preset === "mtd") { start = new Date(now.getFullYear(), now.getMonth(), 1); }
  else if (preset === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  }
  else if (preset === "ytd") { start = new Date(now.getFullYear(), 0, 1); }
  else { start = new Date(now); start.setDate(now.getDate() - 29); }
  const s = toISO(start), e = toISO(end);
  return { start: s, end: e, days: daysBetween(s, e) };
}

export function computeCompareRange(range: DateRange, mode: ComparisonMode): DateRange | null {
  if (mode === "none") return null;
  if (mode === "yoy") {
    const s = subYearISO(range.start), e = subYearISO(range.end);
    return { start: s, end: e, days: daysBetween(s, e) };
  }
  const e = addDaysISO(range.start, -1);
  const s = addDaysISO(e, -(range.days - 1));
  return { start: s, end: e, days: range.days };
}

export function clipRange(range: DateRange, maxDate: string | null | undefined): DateRange {
  if (!maxDate || range.end <= maxDate) return range;
  const end = maxDate;
  if (range.start > end) return range;
  return { start: range.start, end, days: daysBetween(range.start, end) };
}

// Se il range parte prima della data GA4 first_date, restituisce la data di partenza minima
export function isRangeBeforeFirstData(range: DateRange, firstDate: string | null | undefined): boolean {
  if (!firstDate) return false;
  return range.start < firstDate;
}

// ─── Date range context + provider ────────────────────────────────

export type DateRangeState = {
  preset: RangePreset;
  compare: ComparisonMode;
  customRange: DateRange | null;
  range: DateRange;
  compareRange: DateRange | null;
  coverage: { min: string; max: string } | null;
  setPreset: (p: RangePreset) => void;
  setCompare: (c: ComparisonMode) => void;
  setCustomRange: (r: DateRange | null) => void;
};

export const DateRangeContext = createContext<DateRangeState>({
  preset: "w30", compare: "prev", customRange: null,
  range: { start: "", end: "", days: 30 }, compareRange: null, coverage: null,
  setPreset: () => {}, setCompare: () => {}, setCustomRange: () => {},
});

export function useDateRange() { return useContext(DateRangeContext); }

export function DateRangeProvider({
  children, data,
}: { children: React.ReactNode; data: CoorieData | null }) {
  const coverage = useMemo(() => coverageFromData(data), [data]);
  const today = useMemo(() => coverage?.max ?? toISO(new Date()), [coverage]);

  const [preset, setPresetInner] = useState<RangePreset>("w30");
  const [compare, setCompareInner] = useState<ComparisonMode>("prev");
  const [customRange, setCustomRangeInner] = useState<DateRange | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const p = localStorage.getItem("pf.coorie.preset");
      if (p) setPresetInner(p as RangePreset);
      const c = localStorage.getItem("pf.coorie.compare");
      if (c) setCompareInner(c as ComparisonMode);
      const cs = localStorage.getItem("pf.coorie.customStart");
      const ce = localStorage.getItem("pf.coorie.customEnd");
      if (cs && ce) setCustomRangeInner({ start: cs, end: ce, days: daysBetween(cs, ce) });
    } catch {}
  }, []);

  const setPreset = useCallback((p: RangePreset) => {
    setPresetInner(p);
    try { localStorage.setItem("pf.coorie.preset", p); } catch {}
  }, []);
  const setCompare = useCallback((c: ComparisonMode) => {
    setCompareInner(c);
    try { localStorage.setItem("pf.coorie.compare", c); } catch {}
  }, []);
  const setCustomRange = useCallback((r: DateRange | null) => {
    setCustomRangeInner(r);
    // Un periodo personalizzato vale solo se il preset passa a "custom":
    // senza questo "Applica" salvava le date ma il range restava quello di prima.
    if (r) setPresetInner("custom");
    try {
      if (r) { localStorage.setItem("pf.coorie.customStart", r.start); localStorage.setItem("pf.coorie.customEnd", r.end); localStorage.setItem("pf.coorie.preset", "custom"); }
      else { localStorage.removeItem("pf.coorie.customStart"); localStorage.removeItem("pf.coorie.customEnd"); }
    } catch {}
  }, []);

  const range = useMemo(() => computePresetRange(preset, today, customRange), [preset, today, customRange]);
  const compareRange = useMemo(() => computeCompareRange(range, compare), [range, compare]);

  return (
    <DateRangeContext.Provider value={{
      preset, compare, customRange, range, compareRange, coverage,
      setPreset, setCompare, setCustomRange,
    }}>
      {children}
    </DateRangeContext.Provider>
  );
}

// ─── Nav context ──────────────────────────────────────────────────

export type TabKey = "panoramica" | "advertising" | "creativita" | "ecommerce" | "traffico" | "seo" | "email" | "roadmap" | "meetings";

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

// Prodotti fascia detection
export function fasciaProdotto(fascia: string): "Bundle" | "Full Size" | "Altro" {
  const f = fascia.toLowerCase();
  if (f.includes("bundle")) return "Bundle";
  if (f.includes("full")) return "Full Size";
  return "Altro";
}

// ─── Serie giornaliere per le sparkline dei KPI ───────────────────

export type DayMap = Map<string, number>;
export type Spark = { values: number[]; labels: string[] };

function addTo(map: DayMap, day: string, v: number) {
  map.set(day, (map.get(day) ?? 0) + v);
}

export type DailyMaps = {
  metaSpend: DayMap; metaAtc: DayMap; metaAcquisti: DayMap; metaValore: DayMap;
  gadsSpend: DayMap; gadsConv: DayMap; gadsValore: DayMap;
  sessions: DayMap; users: DayMap; transactions: DayMap; revenue: DayMap;
  gscClicks: DayMap; gscImpr: DayMap; gscPosWeighted: DayMap;
  gscLast: string | null; ga4First: string | null;
};

/** Totali per giorno delle metriche che compaiono nei KPI, calcolati una volta per payload. */
export function useDailyMaps(data: CoorieData): DailyMaps {
  return useMemo(() => {
    const m: DailyMaps = {
      metaSpend: new Map(), metaAtc: new Map(), metaAcquisti: new Map(), metaValore: new Map(),
      gadsSpend: new Map(), gadsConv: new Map(), gadsValore: new Map(),
      sessions: new Map(), users: new Map(), transactions: new Map(), revenue: new Map(),
      gscClicks: new Map(), gscImpr: new Map(), gscPosWeighted: new Map(),
      gscLast: data.gsc?.ultimo_giorno ?? null,
      ga4First: data.health?.ga4_first_date ?? data.ga4?.first_date ?? null,
    };
    // [data, campagna, obiettivo, spesa, imp, click, ctr, lpv, atc, checkout, acquisti, valore]
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]);
      addTo(m.metaSpend, d, Number(r[3]) || 0);
      addTo(m.metaAtc, d, Number(r[8]) || 0);
      addTo(m.metaAcquisti, d, Number(r[10]) || 0);
      addTo(m.metaValore, d, Number(r[11]) || 0);
    }
    // [data, campagna, tipo, costo, imp, click, ctr, conv, valore]
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]);
      addTo(m.gadsSpend, d, Number(r[3]) || 0);
      addTo(m.gadsConv, d, Number(r[7]) || 0);
      addTo(m.gadsValore, d, Number(r[8]) || 0);
    }
    // [data, sessions, users, transactions, revenue]
    for (const r of data.ga4?.daily ?? []) {
      const d = String(r[0]);
      addTo(m.sessions, d, Number(r[1]) || 0);
      addTo(m.users, d, Number(r[2]) || 0);
      addTo(m.transactions, d, Number(r[3]) || 0);
      addTo(m.revenue, d, Number(r[4]) || 0);
    }
    // [data, click, impression, ctr, posizione]
    for (const r of data.gsc?.daily ?? []) {
      const d = String(r[0]);
      const imp = Number(r[2]) || 0;
      addTo(m.gscClicks, d, Number(r[1]) || 0);
      addTo(m.gscImpr, d, imp);
      addTo(m.gscPosWeighted, d, (Number(r[4]) || 0) * imp);
      if (!m.gscLast || d > m.gscLast) m.gscLast = d;
    }
    return m;
  }, [data]);
}

/**
 * Costruisce una sparkline sul periodo selezionato.
 *
 * - `num` da sole: somma per gruppo. Con `den`: rapporto dei totali per gruppo
 *   (mai media dei rapporti giornalieri), moltiplicato per `scale`.
 * - `from`/`to` escludono i giorni senza dati alla fonte (GA4 prima del primo
 *   giorno, Search Console negli ultimi giorni non ancora rilasciati): lì uno
 *   zero disegnerebbe un calo che non esiste.
 * - Oltre ~30 punti i giorni vengono raggruppati, partendo dal più recente.
 */
export function buildSpark(
  range: DateRange,
  opts: { num: DayMap[]; den?: DayMap[]; scale?: number; from?: string | null; to?: string | null; maxPoints?: number },
): Spark {
  const dates: string[] = [];
  const start = opts.from && opts.from > range.start ? opts.from : range.start;
  const end = opts.to && opts.to < range.end ? opts.to : range.end;
  if (!start || !end || start > end) return { values: [], labels: [] };
  for (let d = start; d <= end; d = addDaysISO(d, 1)) dates.push(d);
  if (dates.length < 2) return { values: [], labels: [] };

  const size = Math.max(1, Math.ceil(dates.length / (opts.maxPoints ?? 30)));
  const buckets: string[][] = [];
  for (let i = dates.length; i > 0; i -= size) buckets.unshift(dates.slice(Math.max(0, i - size), i));
  // Un primo gruppo incompleto farebbe sembrare un calo iniziale sulle somme
  if (!opts.den && buckets.length > 2 && buckets[0].length < size) buckets.shift();

  const sum = (maps: DayMap[], days: string[]) =>
    days.reduce((acc, day) => acc + maps.reduce((a, mp) => a + (mp.get(day) ?? 0), 0), 0);

  const values: number[] = [];
  const labels: string[] = [];
  for (const b of buckets) {
    const n = sum(opts.num, b);
    let v = n;
    if (opts.den) {
      const d = sum(opts.den, b);
      if (d <= 0) continue;
      v = (n / d) * (opts.scale ?? 1);
    }
    values.push(v);
    labels.push(b.length === 1 ? fmtDate(b[0]) : `${fmtDate(b[0])}–${fmtDate(b[b.length - 1])}`);
  }

  // Due punti disegnano una retta che sembra una tendenza anche quando non lo
  // e'. Sui rapporti serve ancora piu' prudenza: i gruppi senza denominatore
  // vengono saltati, quindi con pochi ordini restano pochissimi punti veri.
  const minimo = opts.den ? 4 : 3;
  return values.length >= minimo ? { values, labels } : { values: [], labels: [] };
}

/** Props sparkline pronte per KpiTile: linea recessiva, ultimo gruppo in accento. */
export function useSparkProps(accent: string) {
  const { palette } = useTheme();
  return (spark: Spark, format: (v: number) => string) =>
    spark.values.length >= 2
      ? {
          sparkline: spark.values,
          sparklineLabels: spark.labels,
          sparklineFormat: format,
          sparklineColor: palette.textDim,
          sparklineEndColor: accent,
        }
      : {};
}
