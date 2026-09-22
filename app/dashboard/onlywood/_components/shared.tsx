"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { StoreData } from "@/lib/onlywood-store";
import { fmtDate as fmtDay, useTheme as useThemeInternal } from "../../vitaedna/_components/shared";
import { isPurchaseAction } from "../config";

export type Row = (string | number)[];

// ─── Tipi del motore (payload Apps Script) ────────────────────────

export type CreativeSet = { label: string; days: number; rows: Row[] };

export type MetaBenchmark = {
  affidabile: boolean; n: number;
  ctr_link: number | null; costo_atc: number | null;
  cpm: number | null; roas: number | null; hook: number | null;
};

export type Ga4Totals = {
  sessioni: number; utenti: number; nuovi_utenti: number; sessioni_engaged: number;
  item_visti: number; add_to_cart: number; checkout: number;
  transazioni: number; revenue: number; aov: number; conversion_rate_pct: number;
};

export type Blended = {
  spesa_meta: number; spesa_gads: number; spesa_totale: number;
  acquisti_meta: number; acquisti_gads: number; acquisti_attribuiti: number;
  valore_attribuito: number; acquisti_ga4: number; revenue_ga4: number;
  roas_attribuito: number; mer: number; cpa_blended: number;
  attribuito_su_ga4_pct: number;
};

export type SourceStatus = { fonte: string; ok: boolean; messaggio: string; ms: number };

export type Health = {
  sources?: SourceStatus[];
  aggiornato?: string;
  spesa_non_classificata_pct?: number;
  copertura_attribuzione_pct?: number;
  gsc_ultimo_giorno?: string | null;
  ga4_prima_data?: string | null;
  atc_per_1000_sessioni?: number;
  gads_righe?: number;
};

export type OnlywoodData = {
  updated_at?: string;
  history_days?: number;
  perimetro?: string;
  meta?: {
    // [campagna, obiettivo, spesa, impression, click, ctr%, frequenza, atc, acquisti, valore, roas]
    campaigns?: { w7?: Row[]; w30?: Row[]; p30?: Row[] };
    // [data, campagna, obiettivo, spesa, impression, click, atc, acquisti, valore]
    campaigns_daily?: Row[];
    // [pubblico, campagna, spesa, impression, frequenza, clickLink, ctrLink%, cpm, atc, costoAtc, acquisti, roas, cpa]
    adsets_w30?: Row[];
    adset_head?: string[];
    creatives?: { w7?: CreativeSet; w30?: CreativeSet; w90?: CreativeSet };
    creative_head?: string[];
    // [data, creativita, formato, soggetto, spesa, impression, clickLink, atc, acquisti, valore]
    creatives_daily?: Row[];
    creative_daily_head?: string[];
    // [nome, formato, soggetto, verdetto, motivo, spesa, roas, acquisti, atc, freq, ctrLink, giorni]
    verdetti?: Row[];
    benchmark?: MetaBenchmark;
    // [valore, spesa, impression, clickLink, ctrLink%, atc, costoAtc, acquisti, valoreAcq, roas, hook%]
    per_formato?: Row[];
    per_soggetto?: Row[];
    agg_head?: string[];
    // [campagna, obiettivo, metodo, spesa]
    classificazione?: Row[];
    // [valore, spesa, impression, click, ctr%, cpm, atc, acquisti, valoreAcq, roas]
    paesi_w30?: Row[];
    placement_w30?: Row[];
    break_head?: string[];
  };
  // [data, campagna, tipo, costo, impression, click, conv, valore_conv]
  gads_daily?: Row[];
  // [data, campagna, azione, categoria, conv, valore]
  gads_conv_daily?: Row[];
  // [data, termine, campagna, corrispondenza, click, costo, conv]
  gads_search_terms_w30?: Row[];
  // [data, prodotto, id_articolo, campagna, costo, click, conv]
  gads_products_w30?: Row[];
  ga4?: {
    first_date?: string | null;
    daily?: Row[];              // [data, sessioni, utenti, nuovi_utenti, sessioni_engaged]
    funnel_daily?: Row[];       // [data, sessioni, item_visti, atc, checkout, acquisti, revenue]
    funnel_head?: string[];
    events_daily?: Row[];       // [data, evento, count]
    channels_daily?: Row[];     // [data, canale, sessioni, utenti, acquisti, revenue]
    sources_w30?: Row[];        // [sorgente, mezzo, sessioni, utenti, nuovi, acquisti, revenue]
    campaigns_w30?: Row[];      // [campagna, sessioni, utenti, acquisti, revenue]
    landing_w30?: Row[];        // [landing, sessioni, bounce_rate, acquisti, revenue]
    prodotti_w30?: Row[];       // [prodotto, viste, atc, acquisti, revenue]
    prodotti_w90?: Row[];
    categorie_w30?: Row[];      // [categoria, viste, atc, acquisti, revenue]
    devices?: Row[];            // [device, sessioni, utenti, acquisti]
    demo?: { eta?: Row[]; genere?: Row[] };
    geo?: { paesi?: Row[]; regioni?: Row[] };
    totals?: { w7?: Ga4Totals; w30?: Ga4Totals; w90?: Ga4Totals; p30?: Ga4Totals };
  };
  gsc?: {
    daily?: Row[];              // [data, click, impression, ctr%, posizione]
    ultimo_giorno?: string | null;
    queries_w30?: Row[];
    queries_w90?: Row[];
    pages_w30?: Row[];
    paesi_w30?: Row[];
    devices_w30?: Row[];
  };
  blended?: { w30?: Blended; p30?: Blended };
  health?: Health;
};

// ─── Re-export UI + theme + formatter dalla base condivisa ────────

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

export type { StoreData };

// ─── Periodo ──────────────────────────────────────────────────────

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
  return Math.round((fromISO(endISO).getTime() - fromISO(startISO).getTime()) / 86400000) + 1;
}
export function addDaysISO(iso: string, days: number): string {
  const d = fromISO(iso); d.setDate(d.getDate() + days); return toISO(d);
}
export function subYearISO(iso: string): string {
  const d = fromISO(iso); d.setFullYear(d.getFullYear() - 1); return toISO(d);
}

export function coverageFromData(data: OnlywoodData | null): { min: string; max: string } | null {
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

export function isRangeBeforeFirstData(range: DateRange, firstDate: string | null | undefined): boolean {
  if (!firstDate) return false;
  return range.start < firstDate;
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
}: { children: React.ReactNode; data: OnlywoodData | null }) {
  const coverage = useMemo(() => coverageFromData(data), [data]);
  const today = useMemo(() => coverage?.max ?? toISO(new Date()), [coverage]);

  const [preset, setPresetInner] = useState<RangePreset>("w30");
  const [compare, setCompareInner] = useState<ComparisonMode>("prev");
  const [customRange, setCustomRangeInner] = useState<DateRange | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("pf.onlywood.preset");
      if (p) setPresetInner(p as RangePreset);
      const c = localStorage.getItem("pf.onlywood.compare");
      if (c) setCompareInner(c as ComparisonMode);
      const cs = localStorage.getItem("pf.onlywood.customStart");
      const ce = localStorage.getItem("pf.onlywood.customEnd");
      if (cs && ce) setCustomRangeInner({ start: cs, end: ce, days: daysBetween(cs, ce) });
    } catch {}
  }, []);

  const setPreset = useCallback((p: RangePreset) => {
    setPresetInner(p);
    try { localStorage.setItem("pf.onlywood.preset", p); } catch {}
  }, []);
  const setCompare = useCallback((c: ComparisonMode) => {
    setCompareInner(c);
    try { localStorage.setItem("pf.onlywood.compare", c); } catch {}
  }, []);
  const setCustomRange = useCallback((r: DateRange | null) => {
    setCustomRangeInner(r);
    // Il periodo personalizzato vale solo se il preset passa a "custom"
    if (r) setPresetInner("custom");
    try {
      if (r) {
        localStorage.setItem("pf.onlywood.customStart", r.start);
        localStorage.setItem("pf.onlywood.customEnd", r.end);
        localStorage.setItem("pf.onlywood.preset", "custom");
      } else {
        localStorage.removeItem("pf.onlywood.customStart");
        localStorage.removeItem("pf.onlywood.customEnd");
      }
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

// ─── Dati WooCommerce agganciati al periodo ───────────────────────

export type StoreState = {
  store: StoreData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const StoreContext = createContext<StoreState>({ store: null, loading: false, error: null, reload: () => {} });
export function useStore() { return useContext(StoreContext); }

/**
 * Il negozio si interroga a ogni cambio di periodo: WooCommerce è la fonte
 * di verità su ordini e prodotti, ma risponde lento, quindi ogni risposta
 * resta in cache nel browser per tutta la sessione.
 */
export function StoreProvider({ children, enabled = true }: { children: React.ReactNode; enabled?: boolean }) {
  const { range, compareRange } = useDateRange();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const cache = useRef(new Map<string, StoreData>());

  // Finché il motore non ha risposto il periodo non è definitivo: partire prima
  // significherebbe leggere il negozio due volte, e ogni lettura costa decine di secondi.
  const key = enabled && range.start && range.end
    ? `${range.start}|${range.end}|${compareRange?.start ?? ""}|${compareRange?.end ?? ""}`
    : "";

  useEffect(() => {
    if (!key) return;
    const cached = cache.current.get(key);
    if (cached) { setStore(cached); setError(null); setLoading(false); return; }

    const controller = new AbortController();
    setLoading(true); setError(null);
    const params = new URLSearchParams({ from: range.start, to: range.end });
    if (compareRange) { params.set("prevFrom", compareRange.start); params.set("prevTo", compareRange.end); }

    fetch(`/api/onlywood/store?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        return json as StoreData;
      })
      .then((json) => { cache.current.set(key, json); setStore(json); })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Errore sconosciuto");
        setStore(null);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [key, range.start, range.end, compareRange, nonce]);

  const reload = useCallback(() => { cache.current.clear(); setNonce((n) => n + 1); }, []);

  return (
    <StoreContext.Provider value={{ store, loading, error, reload }}>
      {children}
    </StoreContext.Provider>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────

export type TabKey =
  | "panoramica" | "prodotti" | "categorie" | "funnel" | "spedizioni"
  | "clienti" | "advertising" | "creativita" | "seo"
  | "roadmap" | "meetings" | "salute";

export const NavContext = createContext<{ setTab: (t: TabKey) => void }>({ setTab: () => {} });
export function useNav() { return useContext(NavContext); }

// ─── Aggregazioni su serie giornaliere ────────────────────────────

export function inRange(row: Row, startISO: string, endISO: string, dateIdx = 0): boolean {
  const d = String(row[dateIdx] ?? "");
  return d >= startISO && d <= endISO;
}

export function sumInRange(daily: Row[] | undefined, range: DateRange, valueIdx: number, dateIdx = 0): number {
  if (!daily) return 0;
  let s = 0;
  for (const r of daily) if (inRange(r, range.start, range.end, dateIdx)) s += Number(r[valueIdx]) || 0;
  return s;
}

export function dailyInRange(daily: Row[] | undefined, range: DateRange, dateIdx = 0): Row[] {
  if (!daily) return [];
  return daily
    .filter((r) => inRange(r, range.start, range.end, dateIdx))
    .sort((a, b) => String(a[dateIdx]).localeCompare(String(b[dateIdx])));
}

/** Righe del periodo raggruppate per una colonna, sommando le colonne indicate. */
export function groupInRange(
  daily: Row[] | undefined, range: DateRange, keyIdx: number, sumIdx: number[], dateIdx = 0,
): { key: string; values: number[] }[] {
  const m = new Map<string, number[]>();
  for (const r of daily ?? []) {
    if (!inRange(r, range.start, range.end, dateIdx)) continue;
    const k = String(r[keyIdx] ?? "—");
    const cur = m.get(k) ?? sumIdx.map(() => 0);
    sumIdx.forEach((idx, i) => { cur[i] += Number(r[idx]) || 0; });
    m.set(k, cur);
  }
  return [...m.entries()].map(([key, values]) => ({ key, values }));
}

/** Acquisti Google Ads sul periodo: solo le azioni di acquisto. */
export function gadsPurchasesInRange(data: OnlywoodData, range: DateRange): { conv: number; valore: number } {
  let conv = 0, valore = 0;
  for (const r of data.gads_conv_daily ?? []) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    if (!isPurchaseAction(String(r[2]), String(r[3]))) continue;
    conv += Number(r[4]) || 0;
    valore += Number(r[5]) || 0;
  }
  return { conv, valore };
}

// ─── Serie giornaliere per le sparkline ───────────────────────────

export type DayMap = Map<string, number>;
export type Spark = { values: number[]; labels: string[] };

function addTo(map: DayMap, day: string, v: number) {
  map.set(day, (map.get(day) ?? 0) + v);
}

export type DailyMaps = {
  metaSpend: DayMap; metaAtc: DayMap; metaPurch: DayMap; metaValue: DayMap; metaImpr: DayMap;
  gadsSpend: DayMap; gadsPurch: DayMap; gadsValue: DayMap; gadsClicks: DayMap;
  sessions: DayMap; users: DayMap; newUsers: DayMap; engaged: DayMap;
  itemViews: DayMap; atc: DayMap; checkout: DayMap; ga4Purch: DayMap; ga4Revenue: DayMap;
  gscClicks: DayMap; gscImpr: DayMap; gscPosWeighted: DayMap;
  gscLast: string | null; ga4First: string | null;
};

export function useDailyMaps(data: OnlywoodData): DailyMaps {
  return useMemo(() => {
    const m: DailyMaps = {
      metaSpend: new Map(), metaAtc: new Map(), metaPurch: new Map(), metaValue: new Map(), metaImpr: new Map(),
      gadsSpend: new Map(), gadsPurch: new Map(), gadsValue: new Map(), gadsClicks: new Map(),
      sessions: new Map(), users: new Map(), newUsers: new Map(), engaged: new Map(),
      itemViews: new Map(), atc: new Map(), checkout: new Map(), ga4Purch: new Map(), ga4Revenue: new Map(),
      gscClicks: new Map(), gscImpr: new Map(), gscPosWeighted: new Map(),
      gscLast: data.gsc?.ultimo_giorno ?? null,
      ga4First: data.health?.ga4_prima_data ?? data.ga4?.first_date ?? null,
    };
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]);
      addTo(m.metaSpend, d, Number(r[3]) || 0);
      addTo(m.metaImpr, d, Number(r[4]) || 0);
      addTo(m.metaAtc, d, Number(r[6]) || 0);
      addTo(m.metaPurch, d, Number(r[7]) || 0);
      addTo(m.metaValue, d, Number(r[8]) || 0);
    }
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]);
      addTo(m.gadsSpend, d, Number(r[3]) || 0);
      addTo(m.gadsClicks, d, Number(r[5]) || 0);
    }
    for (const r of data.gads_conv_daily ?? []) {
      if (!isPurchaseAction(String(r[2]), String(r[3]))) continue;
      addTo(m.gadsPurch, String(r[0]), Number(r[4]) || 0);
      addTo(m.gadsValue, String(r[0]), Number(r[5]) || 0);
    }
    for (const r of data.ga4?.daily ?? []) {
      const d = String(r[0]);
      addTo(m.sessions, d, Number(r[1]) || 0);
      addTo(m.users, d, Number(r[2]) || 0);
      addTo(m.newUsers, d, Number(r[3]) || 0);
      addTo(m.engaged, d, Number(r[4]) || 0);
    }
    for (const r of data.ga4?.funnel_daily ?? []) {
      const d = String(r[0]);
      addTo(m.itemViews, d, Number(r[2]) || 0);
      addTo(m.atc, d, Number(r[3]) || 0);
      addTo(m.checkout, d, Number(r[4]) || 0);
      addTo(m.ga4Purch, d, Number(r[5]) || 0);
      addTo(m.ga4Revenue, d, Number(r[6]) || 0);
    }
    for (const r of data.gsc?.daily ?? []) {
      const d = String(r[0]);
      const imp = Number(r[2]) || 0;
      addTo(m.gscClicks, d, Number(r[1]) || 0);
      addTo(m.gscImpr, d, imp);
      addTo(m.gscPosWeighted, d, (Number(r[4]) || 0) * imp);
    }
    return m;
  }, [data]);
}

/** Serie giornaliera dal negozio, pronta per le sparkline. */
export function storeDayMap(store: StoreData | null, field: "ordini" | "fatturato" | "netto" | "articoli"): DayMap {
  const m: DayMap = new Map();
  for (const g of store?.giorni ?? []) m.set(g.data, Number(g[field]) || 0);
  return m;
}

/**
 * Sparkline sul periodo scelto.
 * - `num` da sole: somma per gruppo. Con `den`: rapporto dei totali (mai media
 *   dei rapporti giornalieri), moltiplicato per `scale`.
 * - `from`/`to` escludono i giorni senza dati alla fonte: lì uno zero
 *   disegnerebbe un calo che non esiste.
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
    labels.push(b.length === 1 ? fmtDay(b[0]) : `${fmtDay(b[0])}–${fmtDay(b[b.length - 1])}`);
  }
  return values.length >= 2 ? { values, labels } : { values: [], labels: [] };
}

/** Props sparkline per KpiTile: linea recessiva, ultimo gruppo in accento. */
export function useSparkProps(accent: string) {
  const { palette } = useThemeInternal();
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
