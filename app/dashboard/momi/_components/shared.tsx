"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";
import { isSignupAction } from "../config";

// ─── Types (schema MOMI) ──────────────────────────────────────────

export type Objective = "App Install" | "Fan Acquisition";
export type Platform = "iOS" | "Android" | "Tutte";

export type MomiTotals = {
  sessions: number; users: number; new_users: number; engaged: number;
};

export type Blended = {
  spend_meta: number; spend_gads: number; spend_total: number;
  reg_meta: number; reg_gads: number; reg_attributed: number; reg_ga4: number;
  cpr_blended: number; install_total: number; cpi_blended: number;
};

export type Health = {
  attribution_coverage_pct: number;
  account_frequency_w30: number;
  spesa_non_classificata_pct: number;
  creativita_non_classificate_pct: number;
  gsc_lag_days: number;
  ga4_first_date: string;
};

export type CreativeSet = { label: string; days: number; rows: (string | number)[][] };

export type MomiData = {
  updated_at?: string;
  history_days?: number;
  meta?: {
    // [campagna, obiettivo, piattaforma, spesa, impression, reach, frequenza, click, ctr, cpm, install, registrazioni, visite_profilo, follow]
    campaigns?: { w7?: (string | number)[][]; w30?: (string | number)[][]; p30?: (string | number)[][] };
    // [data, campagna, obiettivo, piattaforma, spesa, impression, click, install, registrazioni, visite_profilo]
    campaigns_daily?: (string | number)[][];
    // [adset, campagna, obiettivo, piattaforma, stato, spesa, impression, reach, frequenza, ctr, install, registrazioni, cpr, visite_profilo]
    adsets_w30?: (string | number)[][];
    creatives?: {
      w7?: CreativeSet; w30?: CreativeSet; w90?: CreativeSet;
      by_platform_w30?: (string | number)[][];
    };
    // [nome, formato, angolo, obiettivo, piattaforme, verdetto, motivo, spesa_w30, cpr_w30, cpr_w7, ctr_w30, ctr_w7, freq_w7, reg_w30, giorni_attiva, stato]
    verdetti?: (string | number)[][];
    matrix?: {
      by_format?: (string | number)[][];        // [formato, n, spesa, install, reg, cpr]
      by_angle?: (string | number)[][];         // [angolo, n, spesa, install, reg, cpr]
      by_format_angle?: (string | number)[][];  // [formato, angolo, n, spesa, reg, cpr]
      by_platform_angle?: (string | number)[][];// [piattaforma, angolo, n, spesa, reg, cpr]
    };
    classificazione?: (string | number)[][];    // [campagna, obiettivo, piattaforma, metodo, spesa]
    creative_audit?: (string | number)[][];     // [nome, formato, angolo, spesa_w30]
  };
  // [campagna, tipo, costo7, conv7, costo30, conv30, cpa30, costoP30, convP30]
  gads?: (string | number)[][];
  // [data, campagna, tipo, costo, impression, click, conv, conv_totali]
  gads_daily?: (string | number)[][];
  // [data, campagna, azione, categoria, conv, conv_totali]
  gads_conv_daily?: (string | number)[][];
  ga4?: {
    first_date?: string;
    daily?: (string | number)[][];              // [data, sessioni, utenti, nuovi_utenti, sessioni_coinvolte]
    events_daily?: (string | number)[][];       // [data, evento, piattaforma, count]
    channels_daily?: (string | number)[][];     // [data, canale, sessioni, utenti]
    channels?: { w7?: (string | number)[][]; w30?: (string | number)[][] };
    devices?: (string | number)[][];            // [device, sessioni, utenti]
    demo?: { age?: (string | number)[][]; gender?: (string | number)[][] };
    geo?: { country?: (string | number)[][]; region?: (string | number)[][] };
    totals?: { w7?: MomiTotals; w30?: MomiTotals; w90?: MomiTotals; p30?: MomiTotals };
  };
  gsc?: {
    daily?: (string | number)[][];              // [data, click, imp, ctr, pos]
    queries_w30?: (string | number)[][];
    pages_w30?: (string | number)[][];
  };
  blended?: { w30?: Blended; p30?: Blended };
  health?: Health;
};

// ─── Re-export UI + theme + formatters da VitaeDNA shared ─────────

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

export function coverageFromData(data: MomiData | null): { min: string; max: string } | null {
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

export function isRangeBeforeFirstData(range: DateRange, firstDate: string | null | undefined): boolean {
  if (!firstDate) return false;
  return range.start < firstDate;
}

// ─── Date range context + provider ────────────────────────────────

export type DateRangeState = {
  preset: RangePreset; compare: ComparisonMode; customRange: DateRange | null;
  range: DateRange; compareRange: DateRange | null;
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
}: { children: React.ReactNode; data: MomiData | null }) {
  const coverage = useMemo(() => coverageFromData(data), [data]);
  const today = useMemo(() => coverage?.max ?? toISO(new Date()), [coverage]);

  const [preset, setPresetInner] = useState<RangePreset>("w30");
  const [compare, setCompareInner] = useState<ComparisonMode>("prev");
  const [customRange, setCustomRangeInner] = useState<DateRange | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("pf.momi.preset");
      if (p) setPresetInner(p as RangePreset);
      const c = localStorage.getItem("pf.momi.compare");
      if (c) setCompareInner(c as ComparisonMode);
      const cs = localStorage.getItem("pf.momi.customStart");
      const ce = localStorage.getItem("pf.momi.customEnd");
      if (cs && ce) setCustomRangeInner({ start: cs, end: ce, days: daysBetween(cs, ce) });
    } catch {}
  }, []);

  const setPreset = useCallback((p: RangePreset) => {
    setPresetInner(p);
    try { localStorage.setItem("pf.momi.preset", p); } catch {}
  }, []);
  const setCompare = useCallback((c: ComparisonMode) => {
    setCompareInner(c);
    try { localStorage.setItem("pf.momi.compare", c); } catch {}
  }, []);
  const setCustomRange = useCallback((r: DateRange | null) => {
    setCustomRangeInner(r);
    try {
      if (r) { localStorage.setItem("pf.momi.customStart", r.start); localStorage.setItem("pf.momi.customEnd", r.end); }
      else { localStorage.removeItem("pf.momi.customStart"); localStorage.removeItem("pf.momi.customEnd"); }
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

export type TabKey = "panoramica" | "advertising" | "creativita" | "traffico" | "seo" | "salute";

export const NavContext = createContext<{ setTab: (t: TabKey) => void }>({ setTab: () => {} });
export function useNav() { return useContext(NavContext); }

// ─── Aggregation helpers ──────────────────────────────────────────

export function inRange(row: (string | number)[], startISO: string, endISO: string, dateIdx = 0): boolean {
  const d = String(row[dateIdx] ?? "");
  return d >= startISO && d <= endISO;
}

export function sumInRange(daily: (string | number)[][] | undefined, range: DateRange, valueIdx: number, dateIdx = 0): number {
  if (!daily) return 0;
  let s = 0;
  for (const r of daily) if (inRange(r, range.start, range.end, dateIdx)) s += Number(r[valueIdx]) || 0;
  return s;
}

export function dailyInRange(daily: (string | number)[][] | undefined, range: DateRange, dateIdx = 0): (string | number)[][] {
  if (!daily) return [];
  return daily
    .filter((r) => inRange(r, range.start, range.end, dateIdx))
    .sort((a, b) => String(a[dateIdx]).localeCompare(String(b[dateIdx])));
}

// Registrazioni Google sul range: gads_conv_daily filtrato per azione contenente registr/sign_up
export function gadsSignupsInRange(data: MomiData, range: DateRange): number {
  let s = 0;
  for (const r of data.gads_conv_daily ?? []) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    const azione = String(r[2]);
    if (isSignupAction(azione)) s += Number(r[5]) || 0;
  }
  return s;
}

// Registrazioni GA4 sul range: events_daily con evento === 'sign_up'
export function ga4SignupsInRange(data: MomiData, range: DateRange): number {
  let s = 0;
  for (const r of data.ga4?.events_daily ?? []) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    if (String(r[1]) === "sign_up") s += Number(r[3]) || 0;
  }
  return s;
}
