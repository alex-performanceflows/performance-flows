"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
import {
  GondolinaData, useTheme,
  eur, eur0, integer, num, pctStr, Pill, tableStyles,
  ACCENT, AD_CFG,
  type CreativeWindow, type MetaBenchmark,
} from "./shared";

// ─── Metriche grezze dal creative_head ────────────────────────────

export type CreativeMetricsRaw = {
  nome: string; formato: string; soggetto: string;
  stato: string; obiettivo: string;
  spesa: number; impression: number; reach: number; frequenza: number;
  click: number; ctr: number; cpm: number; cpc: number;
  lpv: number; atc: number; checkout: number; acquisti: number;
  valore: number; roas: number;
  clickLink: number; ctrLink: number; cpcLink: number; lpvRate: number;
  costoLpv: number; costoAtc: number;
  hookRate: number; holdRate: number; ritenzione50: number; tempoMedio: number;
  rankQualita: string; rankEngagement: string; rankConversione: string;
};

export function toRawMetrics(r: (string | number)[]): CreativeMetricsRaw {
  return {
    nome: String(r[0] ?? ""), formato: String(r[1] ?? ""), soggetto: String(r[2] ?? ""),
    stato: String(r[3] ?? ""), obiettivo: String(r[4] ?? ""),
    spesa: Number(r[5]) || 0, impression: Number(r[6]) || 0, reach: Number(r[7]) || 0, frequenza: Number(r[8]) || 0,
    click: Number(r[9]) || 0, ctr: Number(r[10]) || 0, cpm: Number(r[11]) || 0, cpc: Number(r[12]) || 0,
    lpv: Number(r[13]) || 0, atc: Number(r[14]) || 0, checkout: Number(r[15]) || 0, acquisti: Number(r[16]) || 0,
    valore: Number(r[17]) || 0, roas: Number(r[18]) || 0,
    // r[19] = CPA
    // r[20-22] = ATC rate, checkout rate, purchase rate
    costoLpv: Number(r[23]) || 0, costoAtc: Number(r[24]) || 0,
    // r[25] = costo per IC
    clickLink: Number(r[26]) || 0, ctrLink: Number(r[27]) || 0, cpcLink: Number(r[28]) || 0, lpvRate: Number(r[29]) || 0,
    hookRate: Number(r[30]) || 0, holdRate: Number(r[31]) || 0,
    ritenzione50: Number(r[32]) || 0, tempoMedio: Number(r[33]) || 0,
    rankQualita: String(r[34] ?? "—"), rankEngagement: String(r[35] ?? "—"), rankConversione: String(r[36] ?? "—"),
  };
}

export const creativeKey = (nome: string, formato: string) => `${nome.toLowerCase().trim()}|${formato.toLowerCase().trim()}`;

export const isVideoFormat = (formato: string) => formato.toLowerCase().includes("video");

// Aggrega raw per nome + formato con la stessa logica del motore
export function aggregateRawByNameFormato(rows: (string | number)[][]): CreativeMetricsRaw[] {
  const byKey = new Map<string, CreativeMetricsRaw[]>();
  for (const r of rows) {
    const m = toRawMetrics(r);
    const key = creativeKey(m.nome, m.formato);
    const arr = byKey.get(key);
    if (arr) arr.push(m); else byKey.set(key, [m]);
  }
  const out: CreativeMetricsRaw[] = [];
  for (const parts of byKey.values()) {
    if (parts.length === 1) { out.push(parts[0]); continue; }
    let spesa = 0, impression = 0, reach = 0, click = 0, lpv = 0, atc = 0, checkout = 0, acquisti = 0, valore = 0, clickLink = 0;
    let hookNum = 0, holdNum = 0, ret50Num = 0, tempoNum = 0;
    let best = parts[0]; let bestSpesa = -1;
    let stato = parts[0].stato;
    for (const p of parts) {
      spesa += p.spesa; impression += p.impression; reach += p.reach; click += p.click;
      lpv += p.lpv; atc += p.atc; checkout += p.checkout; acquisti += p.acquisti;
      valore += p.valore; clickLink += p.clickLink;
      hookNum += (p.hookRate ?? 0) * p.impression;
      holdNum += (p.holdRate ?? 0) * p.impression;
      ret50Num += (p.ritenzione50 ?? 0) * p.impression;
      tempoNum += (p.tempoMedio ?? 0) * p.impression;
      if (p.stato === "ACTIVE") stato = "ACTIVE";
      else if (p.stato === "PAUSED" && stato !== "ACTIVE") stato = "PAUSED";
      if (p.spesa > bestSpesa) { bestSpesa = p.spesa; best = p; }
    }
    out.push({
      nome: parts[0].nome, formato: parts[0].formato, soggetto: parts[0].soggetto,
      stato, obiettivo: best.obiettivo,
      spesa, impression, reach, click, lpv, atc, checkout, acquisti, valore, clickLink,
      frequenza: reach > 0 ? impression / reach : 0,
      ctr: impression > 0 ? (click / impression) * 100 : 0,
      cpm: impression > 0 ? (spesa / impression) * 1000 : 0,
      cpc: click > 0 ? spesa / click : 0,
      cpcLink: clickLink > 0 ? spesa / clickLink : 0,
      ctrLink: impression > 0 ? (clickLink / impression) * 100 : 0,
      // Come nel motore: landing page view sui click sul link, non su tutti i click
      lpvRate: clickLink > 0 ? (lpv / clickLink) * 100 : 0,
      costoLpv: lpv > 0 ? spesa / lpv : 0,
      costoAtc: atc > 0 ? spesa / atc : 0,
      roas: spesa > 0 ? valore / spesa : 0,
      hookRate: impression > 0 ? hookNum / impression : 0,
      holdRate: impression > 0 ? holdNum / impression : 0,
      ritenzione50: impression > 0 ? ret50Num / impression : 0,
      tempoMedio: impression > 0 ? tempoNum / impression : 0,
      rankQualita: best.rankQualita, rankEngagement: best.rankEngagement, rankConversione: best.rankConversione,
    });
  }
  return out.sort((a, b) => b.spesa - a.spesa);
}

// ─── Finestre del motore ──────────────────────────────────────────

export type CreativeWindows = Record<CreativeWindow, Map<string, CreativeMetricsRaw>>;

export const WINDOW_LABEL: Record<CreativeWindow, string> = { w7: "ultimi 7 giorni", w30: "ultimi 30 giorni", w90: "ultimi 90 giorni" };
const WINDOW_SHORT: Record<CreativeWindow, string> = { w7: "7 giorni", w30: "30 giorni", w90: "90 giorni" };

/** Creatività aggregate per nome + formato in ciascuna finestra, in ordine di spesa. */
export function useCreativeWindows(data: GondolinaData): CreativeWindows {
  const creatives = data.meta?.creatives;
  return useMemo(() => {
    const build = (w: CreativeWindow) => new Map(
      aggregateRawByNameFormato(creatives?.[w]?.rows ?? []).map((c) => [creativeKey(c.nome, c.formato), c] as const),
    );
    return { w7: build("w7"), w30: build("w30"), w90: build("w90") };
  }, [creatives]);
}

/** La valutazione del motore non dichiara la finestra: la si riconosce dalla spesa totale. */
export function valutazioneWindow(data: GondolinaData): CreativeWindow | null {
  const tot = (data.meta?.valutazione ?? []).reduce((s, v) => s + (Number(v.spesa) || 0), 0);
  if (tot <= 0) return null;
  for (const w of ["w30", "w7", "w90"] as CreativeWindow[]) {
    const spesa = (data.meta?.creatives?.[w]?.rows ?? []).reduce((s, r) => s + (Number(r[5]) || 0), 0);
    if (Math.abs(spesa - tot) < 1) return w;
  }
  return null;
}

export function statoLabel(stato: string): string {
  if (stato === "ACTIVE") return "Attiva";
  if (stato.includes("PAUSED")) return "In pausa";
  return stato || "—";
}

export function AvgTd({ ts, strong, children }: { ts: ReturnType<typeof tableStyles>; strong?: boolean; children: React.ReactNode }) {
  return (
    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: strong ? 700 : 600, fontStyle: "italic" }}>{children}</td>
  );
}

// ─── Dettaglio creatività: una metrica sulle tre finestre ─────────

type MetricKey = "costoAtc" | "ctrLink" | "roas" | "hook";

const METRICS: {
  key: MetricKey; label: string;
  format: (v: number) => string;
  value: (r: CreativeMetricsRaw) => number | null;
  reference: (b?: MetaBenchmark) => { value: number; label: string } | null;
  empty: string;
}[] = [
  {
    key: "roas", label: "ROAS", format: (v) => num(v, 2),
    value: (r) => (r.spesa > 0 && r.valore > 0 ? r.valore / r.spesa : null),
    reference: () => ({ value: AD_CFG.ROAS_GOOD, label: "soglia di ROAS" }),
    empty: "Nessun acquisto attribuito nelle tre finestre.",
  },
  {
    key: "costoAtc", label: "Costo/ATC", format: eur,
    value: (r) => (r.atc > 0 ? r.spesa / r.atc : null),
    reference: (b) => (b?.affidabile && (b.costo_atc ?? 0) > 0 ? { value: b.costo_atc, label: "mediana dell'account" } : null),
    empty: "Nessuna aggiunta al carrello nelle tre finestre.",
  },
  {
    key: "ctrLink", label: "CTR link", format: (v) => pctStr(v, 2),
    value: (r) => (r.impression > 0 ? r.ctrLink : null),
    reference: (b) => (b?.affidabile && (b.ctr_link ?? 0) > 0 ? { value: b.ctr_link, label: "mediana dell'account" } : null),
    empty: "Nessuna impression nelle tre finestre.",
  },
  {
    key: "hook", label: "Hook rate", format: (v) => pctStr(v, 1),
    value: (r) => (r.impression > 0 ? r.hookRate : null),
    reference: (b) => (b?.affidabile && (b.hook ?? 0) > 0 ? { value: b.hook, label: "mediana dell'account" } : null),
    empty: "Nessuna impression nelle tre finestre.",
  },
];

export function CreativeWindowDetail({ nome, formato, windows, highlight, benchmark }: {
  nome: string; formato: string;
  windows: CreativeWindows;
  /** Finestra dei valori mostrati in tabella, messa in evidenza. */
  highlight: CreativeWindow | null;
  benchmark?: MetaBenchmark;
}) {
  const { palette } = useTheme();
  const key = creativeKey(nome, formato);
  const video = isVideoFormat(formato);
  // Dal periodo più lungo al più recente: si legge da sinistra a destra
  const cols = (["w90", "w30", "w7"] as CreativeWindow[]).map((w) => ({ w, r: windows[w].get(key) }));
  const hasPurchases = cols.some(({ r }) => r && r.valore > 0);
  const metrics = METRICS.filter((m) => (m.key !== "roas" || hasPurchases) && (m.key !== "hook" || video));
  const [metricKey, setMetricKey] = useState<MetricKey>(hasPurchases ? "roas" : "costoAtc");
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
                <YAxis domain={[0, maxValue * 1.25]} tickFormatter={(v) => metric.format(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
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
                            <div style={{ color: palette.textDim }}>{eur0(p.spesa)} · {integer(p.atc)} ATC · {integer(p.acquisti)} acquisti</div>
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
            border: `1px solid ${w === highlight ? ACCENT : palette.cardBorder}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: w === highlight ? palette.text : palette.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{WINDOW_LABEL[w]}</div>
            {!r ? <div style={{ marginTop: 6, fontSize: 11, color: palette.textDim }}>Non attiva in questa finestra</div> : (
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 6px", fontSize: 11, fontVariantNumeric: "tabular-nums", color: palette.textMuted }}>
                <span style={{ color: palette.textDim }}>Spesa</span><span style={{ fontWeight: 600, color: palette.text }}>{eur0(r.spesa)}</span>
                <span style={{ color: palette.textDim }}>Impr.</span><span>{integer(r.impression)}</span>
                <span style={{ color: palette.textDim }}>CTR link</span><span>{pctStr(r.ctrLink, 2)}</span>
                <span style={{ color: palette.textDim }}>ATC</span><span>{integer(r.atc)}</span>
                <span style={{ color: palette.textDim }}>Costo/ATC</span><span style={{ fontWeight: 700, color: palette.text }}>{r.atc > 0 ? eur(r.costoAtc) : "—"}</span>
                <span style={{ color: palette.textDim }}>Acquisti</span><span>{integer(r.acquisti)}</span>
                <span style={{ color: palette.textDim }}>ROAS</span><span style={{ fontWeight: 700, color: palette.text }}>{r.valore > 0 ? num(r.roas, 2) : "—"}</span>
                {video && <>
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
