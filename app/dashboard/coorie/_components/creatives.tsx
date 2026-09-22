"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
import {
  CoorieData, useTheme,
  eur, eur0, integer, num, pctStr, Pill,
  ACCENT, SAND,
  type CreativeWindow, type MetaBenchmark,
} from "./shared";

/**
 * Colonne del motore 2.0. Le prime 18 sono quelle della 1.0 e restano
 * dove sono; dalla 18 in poi arrivano dal nuovo Codice 1.
 */
export type CreativeMetricsRaw = {
  nome: string; stato: string; obiettivo: string;
  spesa: number; impression: number; reach: number; frequenza: number;
  click: number; ctr: number; cpm: number; cpc: number;
  lpv: number; cplpv: number; atc: number; checkout: number;
  acquisti: number; valore: number; roas: number;
  formato: string; soggetto: string; giorni: number | null;
  clickLink: number; ctrLink: number; lpvRate: number;
  costoAtc: number; cpa: number;
  video3s: number; hookRate: number; thruplay: number; holdRate: number;
};

export function toRawMetrics(r: (string | number)[]): CreativeMetricsRaw {
  const n = (i: number) => Number(r[i]) || 0;
  return {
    nome: String(r[0] ?? ""), stato: String(r[1] ?? ""), obiettivo: String(r[2] ?? ""),
    spesa: n(3), impression: n(4), reach: n(5), frequenza: n(6),
    click: n(7), ctr: n(8), cpm: n(9), cpc: n(10),
    lpv: n(11), cplpv: n(12), atc: n(13), checkout: n(14),
    acquisti: n(15), valore: n(16), roas: n(17),
    formato: String(r[18] ?? "Altro"), soggetto: String(r[19] ?? "Altro"),
    giorni: r[20] == null || r[20] === "" ? null : n(20),
    clickLink: n(21), ctrLink: n(22), lpvRate: n(23),
    costoAtc: n(24), cpa: n(25),
    video3s: n(26), hookRate: n(27), thruplay: n(28), holdRate: n(29),
  };
}

export const creativeKey = (nome: string) => nome.toLowerCase().trim();

export function isVideoFormat(formato: string): boolean {
  return formato === "Video" || formato === "Reel";
}

/**
 * La stessa creatività vive come annuncio separato in ogni gruppo di
 * inserzioni: su Coorie 154 righe sono 27 creatività. Qui si sommano i
 * volumi e si ricalcolano i rapporti, con le stesse regole del motore.
 */
export function aggregateRawByName(rows: (string | number)[][]): CreativeMetricsRaw[] {
  const byKey = new Map<string, CreativeMetricsRaw[]>();
  for (const r of rows) {
    const m = toRawMetrics(r);
    const k = creativeKey(m.nome);
    const arr = byKey.get(k);
    if (arr) arr.push(m); else byKey.set(k, [m]);
  }

  const out: CreativeMetricsRaw[] = [];
  for (const parti of byKey.values()) {
    if (parti.length === 1) { out.push(parti[0]); continue; }

    let spesa = 0, impression = 0, reach = 0, click = 0, clickLink = 0, lpv = 0;
    let atc = 0, checkout = 0, acquisti = 0, valore = 0, video3s = 0, thruplay = 0;
    let giorni = 0;
    let best = parti[0], bestSpesa = -1;
    let stato = parti[0].stato;

    for (const p of parti) {
      spesa += p.spesa; impression += p.impression; reach += p.reach;
      click += p.click; clickLink += p.clickLink; lpv += p.lpv;
      atc += p.atc; checkout += p.checkout; acquisti += p.acquisti; valore += p.valore;
      video3s += p.video3s; thruplay += p.thruplay;
      if (p.giorni != null && p.giorni > giorni) giorni = p.giorni;
      if (p.stato === "ACTIVE") stato = "ACTIVE";
      if (p.spesa > bestSpesa) { bestSpesa = p.spesa; best = p; }
    }

    out.push({
      nome: parti[0].nome, stato, obiettivo: best.obiettivo,
      formato: best.formato, soggetto: best.soggetto,
      giorni: giorni || null,
      spesa, impression, reach, click, clickLink, lpv, atc, checkout, acquisti, valore,
      video3s, thruplay,
      frequenza: reach > 0 ? impression / reach : 0,
      ctr: impression > 0 ? (click / impression) * 100 : 0,
      cpm: impression > 0 ? (spesa / impression) * 1000 : 0,
      cpc: click > 0 ? spesa / click : 0,
      cplpv: lpv > 0 ? spesa / lpv : 0,
      ctrLink: impression > 0 ? (clickLink / impression) * 100 : 0,
      // Come nel motore: le visite alla pagina si rapportano ai click sul link
      lpvRate: clickLink > 0 ? (lpv / clickLink) * 100 : 0,
      costoAtc: atc > 0 ? spesa / atc : 0,
      cpa: acquisti > 0 ? spesa / acquisti : 0,
      roas: spesa > 0 ? valore / spesa : 0,
      hookRate: impression > 0 ? (video3s / impression) * 100 : 0,
      holdRate: impression > 0 ? (thruplay / impression) * 100 : 0,
    });
  }
  return out.sort((a, b) => b.spesa - a.spesa);
}

// ─── Finestre del motore ─────────────────────────────────────────

export type CreativeWindows = Record<CreativeWindow, Map<string, CreativeMetricsRaw>>;

export const WINDOW_LABEL: Record<CreativeWindow, string> = {
  w7: "ultimi 7 giorni", w30: "ultimi 30 giorni", w90: "ultimi 90 giorni",
};
const WINDOW_SHORT: Record<CreativeWindow, string> = { w7: "7 giorni", w30: "30 giorni", w90: "90 giorni" };

export function useCreativeWindows(data: CoorieData): CreativeWindows {
  const creatives = data.meta?.creatives;
  return useMemo(() => {
    const build = (w: CreativeWindow) => new Map(
      aggregateRawByName(creatives?.[w]?.rows ?? []).map((c) => [creativeKey(c.nome), c] as const),
    );
    return { w7: build("w7"), w30: build("w30"), w90: build("w90") };
  }, [creatives]);
}

/** Il payload non dichiara su quale finestra sono i verdetti: si riconosce dalla spesa. */
export function verdettiWindow(data: CoorieData): CreativeWindow | null {
  const tot = (data.meta?.verdetti ?? []).reduce((s, v) => s + (Number(v[5]) || 0), 0);
  if (tot <= 0) return null;
  for (const w of ["w30", "w7", "w90"] as CreativeWindow[]) {
    const spesa = (data.meta?.creatives?.[w]?.rows ?? []).reduce((s, r) => s + (Number(r[3]) || 0), 0);
    if (Math.abs(spesa - tot) < 1) return w;
  }
  return null;
}

export function statoLabel(stato: string): string {
  if (stato === "ACTIVE") return "Attiva";
  if (stato === "ADSET_PAUSED") return "Gruppo in pausa";
  if (stato === "CAMPAIGN_PAUSED") return "Campagna in pausa";
  if (stato === "PAUSED") return "In pausa";
  if (stato === "DISAPPROVED") return "Non approvata";
  if (stato === "UNKNOWN") return "—";
  return stato || "—";
}

// ─── Dettaglio: una metrica sulle tre finestre ───────────────────

type MetricKey = "costoAtc" | "ctrLink" | "hook" | "roas";

const METRICS: {
  key: MetricKey; label: string;
  format: (v: number) => string;
  value: (r: CreativeMetricsRaw) => number | null;
  reference: (b?: MetaBenchmark) => { value: number; label: string } | null;
  empty: string;
}[] = [
  {
    key: "costoAtc", label: "Costo/carrello", format: eur,
    value: (r) => (r.atc > 0 ? r.spesa / r.atc : null),
    reference: (b) => (b?.affidabile && (b.costo_atc ?? 0) > 0 ? { value: b.costo_atc!, label: "mediana dell'account" } : null),
    empty: "Nessuna aggiunta al carrello nelle tre finestre.",
  },
  {
    key: "ctrLink", label: "CTR link", format: (v) => pctStr(v, 2),
    value: (r) => (r.impression > 0 ? r.ctrLink : null),
    reference: (b) => (b?.affidabile && (b.ctr_link ?? 0) > 0 ? { value: b.ctr_link!, label: "mediana dell'account" } : null),
    empty: "Nessuna impression nelle tre finestre.",
  },
  {
    key: "hook", label: "Hook rate", format: (v) => pctStr(v, 1),
    value: (r) => (r.impression > 0 ? r.hookRate : null),
    reference: (b) => (b?.affidabile && (b.hook ?? 0) > 0 ? { value: b.hook!, label: "mediana dell'account" } : null),
    empty: "Nessuna impression nelle tre finestre.",
  },
  {
    key: "roas", label: "ROAS", format: (v) => num(v, 2),
    value: (r) => (r.spesa > 0 && r.valore > 0 ? r.valore / r.spesa : null),
    reference: (b) => (b?.affidabile && (b.roas ?? 0) > 0 ? { value: b.roas!, label: "mediana dell'account" } : null),
    empty: "Nessun acquisto attribuito nelle tre finestre.",
  },
];

export function CreativeWindowDetail({ nome, windows, highlight, benchmark }: {
  nome: string;
  windows: CreativeWindows;
  /** Finestra dei valori mostrati in tabella, messa in evidenza. */
  highlight: CreativeWindow | null;
  benchmark?: MetaBenchmark;
}) {
  const { palette } = useTheme();
  const key = creativeKey(nome);
  const cols = (["w90", "w30", "w7"] as CreativeWindow[]).map((w) => ({ w, r: windows[w].get(key) }));
  const video = cols.some(({ r }) => r && isVideoFormat(r.formato));
  const hasPurchases = cols.some(({ r }) => r && r.valore > 0);

  const metrics = METRICS.filter((m) => (m.key !== "hook" || video) && (m.key !== "roas" || hasPurchases));
  const [metricKey, setMetricKey] = useState<MetricKey>("costoAtc");
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0];
  const ref = metric.reference(benchmark);

  const chartData = cols.map(({ w, r }) => ({
    w, short: WINDOW_SHORT[w], missing: !r,
    value: r ? metric.value(r) : null,
    spesa: r?.spesa ?? 0, atc: r?.atc ?? 0, acquisti: r?.acquisti ?? 0,
  }));
  const hasValues = chartData.some((d) => d.value != null);
  const maxValue = Math.max(ref?.value ?? 0, ...chartData.map((d) => d.value ?? 0));

  const r30 = windows.w30.get(key);
  const r90 = windows.w90.get(key);
  const same30and90 = !!r30 && !!r90 && Math.abs(r30.spesa - r90.spesa) < 0.01 && r30.impression === r90.impression;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 14 }}>
      <div style={{ background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: "0.8rem 0.9rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.text, marginRight: "auto" }}>{metric.label} per finestra</div>
          {metrics.length > 1 && metrics.map((m) => (
            <Pill key={m.key} active={m.key === metric.key} onClick={() => setMetricKey(m.key)}>{m.label}</Pill>
          ))}
        </div>
        <div style={{ fontSize: 10, color: palette.textDim, marginBottom: 6, lineHeight: 1.4 }}>
          Finestre cumulative fino all&apos;ultimo aggiornamento: i 7 giorni sono compresi nei 30, i 30 nei 90.
          {highlight && " In evidenza la finestra dei valori in tabella."}
          {ref && ` La linea tratteggiata è la ${ref.label} (${metric.format(ref.value)}).`}
          {same30and90 && " 30 e 90 giorni coincidono: nessuna spesa prima degli ultimi 30 giorni."}
        </div>
        {!hasValues ? (
          <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: palette.textDim }}>
            {metric.empty}
          </div>
        ) : (
          <div style={{ width: "100%", height: 170 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="short" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
                <YAxis domain={[0, maxValue * 1.25]} tickFormatter={(v) => metric.format(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={58} />
                {ref && <ReferenceLine y={ref.value} stroke={palette.textDim} strokeDasharray="4 4" />}
                <Tooltip
                  cursor={{ fill: palette.buttonHover }}
                  content={({ active, payload }) => {
                    const p = active && payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                    if (!p) return null;
                    return (
                      <div style={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, padding: "6px 9px", fontSize: 11, color: palette.text }}>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>Ultimi {p.short}</div>
                        {p.missing ? <div style={{ color: palette.textDim }}>Creatività non attiva in questa finestra</div> : (
                          <>
                            <div>{metric.label}: <strong>{p.value != null ? metric.format(p.value) : "—"}</strong></div>
                            <div style={{ color: palette.textDim }}>{eur0(p.spesa)} · {integer(p.atc)} carrelli · {integer(p.acquisti)} acquisti</div>
                          </>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                  {chartData.map((d) => (
                    <Cell key={d.w} fill={ACCENT} fillOpacity={!highlight || d.w === highlight ? 1 : 0.4} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v: unknown) => (v == null ? "" : metric.format(Number(v)))}
                    style={{ fill: palette.text, fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, alignContent: "start" }}>
        {cols.map(({ w, r }) => (
          <div key={w} style={{
            background: palette.cardBg, borderRadius: 10, padding: "0.75rem 0.8rem",
            border: `1px solid ${w === highlight ? SAND : palette.cardBorder}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: w === highlight ? palette.text : palette.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{WINDOW_LABEL[w]}</div>
            {!r ? <div style={{ marginTop: 6, fontSize: 11, color: palette.textDim }}>Non attiva in questa finestra</div> : (
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 6px", fontSize: 11, fontVariantNumeric: "tabular-nums", color: palette.textMuted }}>
                <span style={{ color: palette.textDim }}>Spesa</span><span style={{ fontWeight: 600, color: palette.text }}>{eur0(r.spesa)}</span>
                <span style={{ color: palette.textDim }}>Impr.</span><span>{integer(r.impression)}</span>
                <span style={{ color: palette.textDim }}>Frequenza</span><span>{num(r.frequenza, 2)}</span>
                <span style={{ color: palette.textDim }}>CTR link</span><span>{pctStr(r.ctrLink, 2)}</span>
                <span style={{ color: palette.textDim }}>Carrelli</span><span>{integer(r.atc)}</span>
                <span style={{ color: palette.textDim }}>Costo/carr.</span><span style={{ fontWeight: 700, color: palette.text }}>{r.atc > 0 ? eur(r.costoAtc) : "—"}</span>
                <span style={{ color: palette.textDim }}>Acquisti</span><span>{integer(r.acquisti)}</span>
                {isVideoFormat(r.formato) && <>
                  <span style={{ color: palette.textDim }}>Hook</span><span>{pctStr(r.hookRate, 1)}</span>
                  <span style={{ color: palette.textDim }}>Hold</span><span>{pctStr(r.holdRate, 1)}</span>
                </>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
