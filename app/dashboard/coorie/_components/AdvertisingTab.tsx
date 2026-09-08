"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, ReferenceLine, ReferenceArea, ZAxis,
} from "recharts";
import {
  CoorieData, useDateRange, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill,
  tableStyles,
  ACCENT, SAND, CHART_PALETTE, COMPARE_LABEL, POSITIVE, NEGATIVE,
  AD_CFG, META_OBJECTIVES,
  sumInRange, groupSumInRange, groupInRange,
} from "./shared";

type SubTab = "meta" | "google";
type CreativesWindow = "w7" | "w30" | "w90";

const GA4_TOOLTIP = "Ricavi da GA4 ecommerce: sottostimati rispetto agli ordini reali finché il tracking non è completo.";

export function AdvertisingTab({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const [sub, setSub] = useState<SubTab>("meta");
  const { range, compareRange, compare } = useDateRange();

  // Blended sul range
  const spesaMeta = sumInRange(data.meta?.campaigns_daily, range, 3);
  const spesaGads = sumInRange(data.gads_daily, range, 3);
  const spesaTot = spesaMeta + spesaGads;
  const revenue = sumInRange(data.ga4?.daily, range, 4);
  const trans = sumInRange(data.ga4?.daily, range, 3);
  const roas = spesaTot > 0 ? revenue / spesaTot : 0;
  const cpo = trans > 0 ? spesaTot / trans : 0;

  const spesaMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 3) : null;
  const spesaGadsPrev = compareRange ? sumInRange(data.gads_daily, compareRange, 3) : null;
  const spesaTotPrev = spesaMetaPrev != null || spesaGadsPrev != null ? (spesaMetaPrev ?? 0) + (spesaGadsPrev ?? 0) : null;
  const revenuePrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 4) : null;
  const transPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 3) : null;
  const roasPrev = spesaTotPrev && spesaTotPrev > 0 ? (revenuePrev ?? 0) / spesaTotPrev : null;
  const cpoPrev = transPrev && transPrev > 0 && spesaTotPrev != null ? spesaTotPrev / transPrev : null;
  const metaShare = spesaTot > 0 ? (spesaMeta / spesaTot) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Advertising
      </SectionTitle>

      {/* Blended */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Spesa totale" value={eur0(spesaTot)} delta={spesaTotPrev != null ? calcDelta(spesaTot, spesaTotPrev) : null}
          info="Somma spesa Meta + Google" accent={ACCENT} />
        <KpiTile label="Ripartizione Meta" value={pctStr(metaShare, 1)}
          info={`Meta ${eur0(spesaMeta)} · Google ${eur0(spesaGads)}`} />
        <KpiTile label="ROAS blended (GA4)" value={num(roas, 2)} delta={roasPrev != null ? calcDelta(roas, roasPrev) : null}
          info={`Revenue GA4 ÷ spesa totale. ${GA4_TOOLTIP}`} accent={ACCENT} />
        <KpiTile label="Costo per ordine" value={trans > 0 ? eur(cpo) : "—"} delta={cpoPrev != null ? calcDelta(cpo, cpoPrev) : null}
          info="Spesa totale ÷ transazioni GA4" />
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Pill active={sub === "meta"} onClick={() => setSub("meta")}>Meta</Pill>
        <Pill active={sub === "google"} onClick={() => setSub("google")}>Google Ads</Pill>
      </div>

      {sub === "meta" && <MetaView data={data} />}
      {sub === "google" && <GoogleView data={data} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// META VIEW
// ══════════════════════════════════════════════════════════════════

function MetaView({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  // Aggregazione campagne dal daily
  // campaigns_daily row: [data, name, obiettivo, spesa, imp, click, ctr, lpv, atc, checkout, acquisti, valore]
  const campaigns = useMemo(() => {
    const byName = new Map<string, { name: string; obiettivo: string; spesa: number; imp: number; click: number; lpv: number; atc: number; checkout: number; acquisti: number; valore: number }>();
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const name = String(r[1]); const obj = String(r[2]);
      const cur = byName.get(name);
      const spesa = Number(r[3]) || 0, imp = Number(r[4]) || 0, click = Number(r[5]) || 0;
      const lpv = Number(r[7]) || 0, atc = Number(r[8]) || 0, checkout = Number(r[9]) || 0;
      const acquisti = Number(r[10]) || 0, valore = Number(r[11]) || 0;
      if (cur) {
        cur.spesa += spesa; cur.imp += imp; cur.click += click;
        cur.lpv += lpv; cur.atc += atc; cur.checkout += checkout;
        cur.acquisti += acquisti; cur.valore += valore;
      } else {
        byName.set(name, { name, obiettivo: obj, spesa, imp, click, lpv, atc, checkout, acquisti, valore });
      }
    }
    return [...byName.values()].sort((a, b) => b.spesa - a.spesa);
  }, [data.meta?.campaigns_daily, range]);

  // Scomposizione per obiettivo
  const byObj = useMemo(() => {
    const m = new Map<string, { spesa: number; valore: number }>();
    for (const c of campaigns) {
      const key = (META_OBJECTIVES as readonly string[]).includes(c.obiettivo) ? c.obiettivo : "Altro";
      const cur = m.get(key);
      if (cur) { cur.spesa += c.spesa; cur.valore += c.valore; }
      else m.set(key, { spesa: c.spesa, valore: c.valore });
    }
    const totSpesa = [...m.values()].reduce((s, v) => s + v.spesa, 0);
    return [...m.entries()].map(([k, v]) => ({
      obiettivo: k, spesa: v.spesa, valore: v.valore,
      quota: totSpesa > 0 ? (v.spesa / totSpesa) * 100 : 0,
      roas: v.spesa > 0 ? v.valore / v.spesa : 0,
    })).sort((a, b) => b.spesa - a.spesa);
  }, [campaigns]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title={`Campagne Meta · ${range.days}g`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Campagna</th>
                <th style={ts.th}>Obiettivo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>LPV</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CPLPV</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ATC</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Checkout</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Acquisti</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              </tr></thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  const cplpv = c.lpv > 0 ? c.spesa / c.lpv : 0;
                  const roas = c.spesa > 0 ? c.valore / c.spesa : 0;
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={c.name}>{c.name}</td>
                      <td style={ts.tdBase}>{c.obiettivo}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.spesa)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.lpv)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: cplpv > 0 && cplpv <= AD_CFG.CPLPV_GOOD ? POSITIVE : cplpv > AD_CFG.CPLPV_GOOD ? SAND : ts.tdBase.color }}>{c.lpv > 0 ? eur(cplpv) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.atc)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.checkout)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.acquisti > 0 ? 600 : 400 }}>{integer(c.acquisti)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.valore)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: roas >= 2 ? POSITIVE : roas > 0 && roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 600 }}>{num(roas, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Scomposizione per obiettivo */}
      <Card>
        <CardHeader title="Scomposizione per obiettivo · quota spesa e ROAS" />
        {byObj.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Obiettivo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Quota</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore GA4</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              </tr></thead>
              <tbody>
                {byObj.map((o) => (
                  <tr key={o.obiettivo}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{o.obiettivo}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(o.spesa)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: palette.divider, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, o.quota)}%`, height: "100%", background: ACCENT }} />
                        </div>
                        <span style={{ minWidth: 45, textAlign: "right" }}>{pctStr(o.quota, 1)}</span>
                      </div>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(o.valore)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: o.roas >= 2 ? POSITIVE : o.roas > 0 && o.roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 600 }}>{num(o.roas, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreativitaMetaView data={data} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// CREATIVITÀ META (matrice + verdetti)
// ══════════════════════════════════════════════════════════════════

type Verdict = "scala" | "fatigue" | "spegni" | "osserva" | "mantieni";

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; desc: string; regola: string }> = {
  scala: { label: "Scala", color: POSITIVE, bg: "rgba(34,197,94,0.15)", desc: "CPLPV basso e pubblico non saturo: alza il budget", regola: `CPLPV w30 ≤ €${AD_CFG.CPLPV_GOOD} · freq w7 < ${AD_CFG.FREQ_HIGH} · CTR w7 ≥ CTR w30` },
  fatigue: { label: "Fatigue in arrivo", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", desc: "Funziona ma inizia a saturare: prepara ricambio", regola: `CPLPV ok · freq w7 ≥ ${AD_CFG.FREQ_HIGH} oppure CTR w7 < CTR w30 di oltre ${AD_CFG.CTR_DROP * 100}%` },
  spegni: { label: "Spegni", color: NEGATIVE, bg: "rgba(239,68,68,0.15)", desc: "Spende e non porta al carrello", regola: `spesa w30 ≥ €${AD_CFG.MIN_SPEND} con 0 ATC` },
  osserva: { label: "Osserva", color: "#94a3b8", bg: "rgba(148,163,184,0.18)", desc: "Dati insufficienti", regola: `spesa w30 < €${AD_CFG.MIN_SPEND}` },
  mantieni: { label: "Mantieni", color: "#0ea5e9", bg: "rgba(14,165,233,0.15)", desc: "Nella norma", regola: "nessuna soglia critica raggiunta" },
};

type CreativeMetrics = {
  name: string; stato: string; obiettivo: string;
  spesa: number; imp: number; reach: number; freq: number;
  click: number; ctr: number; cpm: number; cpc: number;
  lpv: number; cplpv: number; atc: number; checkout: number;
  acquisti: number; valore: number; roas: number;
};

function toMetrics(r: (string | number)[]): CreativeMetrics {
  return {
    name: String(r[0] ?? ""), stato: String(r[1] ?? ""), obiettivo: String(r[2] ?? ""),
    spesa: Number(r[3]) || 0, imp: Number(r[4]) || 0, reach: Number(r[5]) || 0, freq: Number(r[6]) || 0,
    click: Number(r[7]) || 0, ctr: Number(r[8]) || 0, cpm: Number(r[9]) || 0, cpc: Number(r[10]) || 0,
    lpv: Number(r[11]) || 0, cplpv: Number(r[12]) || 0, atc: Number(r[13]) || 0,
    checkout: Number(r[14]) || 0, acquisti: Number(r[15]) || 0, valore: Number(r[16]) || 0,
    roas: Number(r[17]) || 0,
  };
}

// Meta espone la stessa creatività una volta per adset: aggreghiamo per nome
function aggregateCreatives(rows: (string | number)[][]): CreativeMetrics[] {
  const byName = new Map<string, CreativeMetrics[]>();
  for (const r of rows) {
    const m = toMetrics(r);
    const key = m.name.toLowerCase().trim();
    if (!key) continue;
    const arr = byName.get(key);
    if (arr) arr.push(m); else byName.set(key, [m]);
  }
  const out: CreativeMetrics[] = [];
  for (const parts of byName.values()) {
    if (parts.length === 1) { out.push(parts[0]); continue; }
    let spesa = 0, imp = 0, reach = 0, click = 0, lpv = 0, atc = 0, checkout = 0, acquisti = 0, valore = 0;
    let stato = parts[0].stato;
    let bestObj = parts[0].obiettivo, bestObjSpend = -1;
    for (const p of parts) {
      spesa += p.spesa; imp += p.imp; reach += p.reach; click += p.click;
      lpv += p.lpv; atc += p.atc; checkout += p.checkout; acquisti += p.acquisti; valore += p.valore;
      if (p.stato === "ACTIVE") stato = "ACTIVE";
      else if (p.stato === "PAUSED" && stato !== "ACTIVE") stato = "PAUSED";
      if (p.spesa > bestObjSpend) { bestObjSpend = p.spesa; bestObj = p.obiettivo; }
    }
    out.push({
      name: parts[0].name, stato, obiettivo: bestObj,
      spesa, imp, reach, click, lpv, atc, checkout, acquisti, valore,
      freq: reach > 0 ? imp / reach : 0,
      ctr: imp > 0 ? (click / imp) * 100 : 0,
      cpm: imp > 0 ? (spesa / imp) * 1000 : 0,
      cpc: click > 0 ? spesa / click : 0,
      cplpv: lpv > 0 ? spesa / lpv : 0,
      roas: spesa > 0 ? valore / spesa : 0,
    });
  }
  return out;
}

function computeVerdict(w30: CreativeMetrics, w7: CreativeMetrics | undefined): Verdict {
  const spesa = w30.spesa;
  const cplpv = w30.cplpv;
  const atc = w30.atc;
  const freqW7 = w7?.freq ?? 0;
  const ctrW7 = w7?.ctr ?? 0;
  const ctrW30 = w30.ctr;
  const ctrDropRatio = ctrW30 > 0 ? ctrW7 / ctrW30 : 1;

  // SPEGNI: spesa w30 ≥ 50 con 0 ATC
  if (spesa >= AD_CFG.MIN_SPEND && atc === 0) return "spegni";
  // OSSERVA: spesa w30 < 50
  if (spesa < AD_CFG.MIN_SPEND) return "osserva";
  // SCALA: CPLPV ok + freq w7 < 2.5 + CTR w7 ≥ CTR w30
  const cplpvOk = cplpv > 0 && cplpv <= AD_CFG.CPLPV_GOOD;
  if (cplpvOk && freqW7 < AD_CFG.FREQ_HIGH && ctrW7 >= ctrW30) return "scala";
  // FATIGUE: CPLPV ok ma freq ≥ 2.5 oppure CTR w7 < CTR w30 di oltre 20%
  if (cplpvOk && (freqW7 >= AD_CFG.FREQ_HIGH || (w7 && ctrW30 > 0 && ctrDropRatio < 1 - AD_CFG.CTR_DROP))) return "fatigue";
  // MANTIENI: il resto
  return "mantieni";
}

function CreativitaMetaView({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const [scatterWindow, setScatterWindow] = useState<CreativesWindow>("w30");
  const [filter, setFilter] = useState<"all" | Verdict>("all");
  const [includePaused, setIncludePaused] = useState(false);

  const w30rows = data.meta?.creatives?.w30?.rows ?? [];
  const w7rows = data.meta?.creatives?.w7?.rows ?? [];

  const enriched = useMemo(() => {
    const w7map = new Map<string, CreativeMetrics>();
    for (const m of aggregateCreatives(w7rows)) w7map.set(m.name.toLowerCase().trim(), m);
    return aggregateCreatives(w30rows).map((w30m) => {
      const w7m = w7map.get(w30m.name.toLowerCase().trim());
      return { w30: w30m, w7: w7m, verdict: computeVerdict(w30m, w7m) };
    }).sort((a, b) => b.w30.spesa - a.w30.spesa);
  }, [w30rows, w7rows]);

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = { scala: 0, fatigue: 0, spegni: 0, osserva: 0, mantieni: 0 };
    for (const r of enriched) {
      if (!includePaused && r.w30.stato !== "ACTIVE") continue;
      c[r.verdict]++;
    }
    return c;
  }, [enriched, includePaused]);

  const visible = useMemo(() => enriched.filter((r) => {
    if (!includePaused && r.w30.stato !== "ACTIVE") return false;
    if (filter !== "all" && r.verdict !== filter) return false;
    return true;
  }), [enriched, filter, includePaused]);

  const scatterSrc = data.meta?.creatives?.[scatterWindow];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title="Matrice creatività · CPLPV × Frequenza"
          right={<div style={{ display: "flex", gap: 6 }}>
            <Pill active={scatterWindow === "w7"} onClick={() => setScatterWindow("w7")}>7g</Pill>
            <Pill active={scatterWindow === "w30"} onClick={() => setScatterWindow("w30")}>30g</Pill>
            <Pill active={scatterWindow === "w90"} onClick={() => setScatterWindow("w90")}>90g</Pill>
          </div>}
        />
        {!scatterSrc || scatterSrc.rows.length === 0 ? <EmptyState /> : <CplpvScatter rows={aggregateCreatives(scatterSrc.rows)} />}
      </Card>

      <Card>
        <CardHeader title="Verdetti operativi"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>
            soglie CPLPV ≤ €{num(AD_CFG.CPLPV_GOOD, 2)} · freq ≥ {num(AD_CFG.FREQ_HIGH, 1)} · spesa min €{AD_CFG.MIN_SPEND}
          </span>}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
          <VerdictCard verdict="scala" label="Da scalare" count={counts.scala} active={filter === "scala"} onClick={() => setFilter(filter === "scala" ? "all" : "scala")} />
          <VerdictCard verdict="fatigue" label="Fatigue in arrivo" count={counts.fatigue} active={filter === "fatigue"} onClick={() => setFilter(filter === "fatigue" ? "all" : "fatigue")} />
          <VerdictCard verdict="spegni" label="Da spegnere" count={counts.spegni} active={filter === "spegni"} onClick={() => setFilter(filter === "spegni" ? "all" : "spegni")} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: palette.textDim, fontWeight: 600 }}>Filtra:</span>
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>Tutti</Pill>
          <Pill active={filter === "scala"} onClick={() => setFilter("scala")}>Scala</Pill>
          <Pill active={filter === "fatigue"} onClick={() => setFilter("fatigue")}>Fatigue</Pill>
          <Pill active={filter === "spegni"} onClick={() => setFilter("spegni")}>Spegni</Pill>
          <Pill active={filter === "mantieni"} onClick={() => setFilter("mantieni")}>Mantieni</Pill>
          <Pill active={filter === "osserva"} onClick={() => setFilter("osserva")}>Osserva</Pill>
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={includePaused} onChange={(e) => setIncludePaused(e.target.checked)} style={{ accentColor: ACCENT }} />
            <span style={{ color: palette.textMuted }}>Includi PAUSED</span>
          </label>
        </div>
        {visible.length === 0 ? <EmptyState label="Nessuna creatività coi filtri" /> : <VerdictTable rows={visible} />}
      </Card>
    </div>
  );
}

function VerdictCard({ verdict, label, count, active, onClick }: {
  verdict: Verdict; label: string; count: number; active: boolean; onClick: () => void;
}) {
  const { palette } = useTheme();
  const m = VERDICT_META[verdict];
  return (
    <button onClick={onClick} style={{
      textAlign: "left", cursor: "pointer",
      padding: "0.9rem 1rem", borderRadius: 12,
      border: `1px solid ${active ? m.color : palette.cardBorder}`,
      background: active ? m.bg : palette.divider,
      color: palette.text, fontFamily: "inherit",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: m.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{integer(count)}</p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.textDim }}>{m.desc}</p>
    </button>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span title={`Regola: ${m.regola}`} style={{
      padding: "2px 8px", borderRadius: 20, background: m.bg, color: m.color,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap",
      cursor: "help",
    }}>● {m.label}</span>
  );
}

function VerdictTable({ rows }: { rows: { w30: CreativeMetrics; w7: CreativeMetrics | undefined; verdict: Verdict }[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead><tr>
          <th style={ts.th}>Creatività</th>
          <th style={ts.th}>Obiettivo</th>
          <th style={ts.th}>Stato</th>
          <th style={ts.th}>Verdetto</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Spesa 30g</th>
          <th style={{ ...ts.th, ...ts.thRight }}>CPLPV 30g</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Freq 7g</th>
          <th style={{ ...ts.th, ...ts.thRight }}>CTR 30g</th>
          <th style={{ ...ts.th, ...ts.thRight }}>ATC</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Acquisti</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={r.w30.name}>{r.w30.name}</td>
              <td style={ts.tdBase}>{r.w30.obiettivo}</td>
              <td style={{ ...ts.tdBase, color: r.w30.stato === "ACTIVE" ? POSITIVE : palette.textDim, fontWeight: 600, fontSize: 10 }}>{r.w30.stato}</td>
              <td style={ts.tdBase}><VerdictBadge verdict={r.verdict} /></td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(r.w30.spesa)}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.w30.cplpv > 0 && r.w30.cplpv <= AD_CFG.CPLPV_GOOD ? POSITIVE : r.w30.cplpv > AD_CFG.CPLPV_GOOD ? SAND : ts.tdBase.color }}>{r.w30.lpv > 0 ? eur(r.w30.cplpv) : "—"}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.w7 && r.w7.freq >= AD_CFG.FREQ_HIGH ? NEGATIVE : ts.tdBase.color }}>{r.w7 ? num(r.w7.freq, 2) : "—"}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.w30.ctr, 2)}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.w30.atc)}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.w30.acquisti > 0 ? 600 : 400 }}>{integer(r.w30.acquisti)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CplpvScatter({ rows }: { rows: CreativeMetrics[] }) {
  const { palette } = useTheme();
  const points = rows.filter((r) => r.spesa > 0 && r.lpv > 0);
  const maxSpesa = Math.max(...points.map((p) => p.spesa), 1);
  const maxCplpv = Math.max(...points.map((p) => p.cplpv), AD_CFG.CPLPV_GOOD * 3);
  const maxFreq = Math.max(...points.map((p) => p.freq), AD_CFG.FREQ_HIGH * 1.5);

  if (points.length === 0) return <EmptyState label="Nessuna creatività con spesa e LPV" />;

  return (
    <>
      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
            <CartesianGrid stroke={palette.grid} />
            {/* Quadranti */}
            <ReferenceArea x1={0} x2={AD_CFG.FREQ_HIGH} y1={0} y2={AD_CFG.CPLPV_GOOD} fill={POSITIVE} fillOpacity={0.08} />
            <ReferenceArea x1={AD_CFG.FREQ_HIGH} x2={maxFreq} y1={0} y2={AD_CFG.CPLPV_GOOD} fill={"#f59e0b"} fillOpacity={0.08} />
            <ReferenceArea x1={0} x2={AD_CFG.FREQ_HIGH} y1={AD_CFG.CPLPV_GOOD} y2={maxCplpv} fill={"#0ea5e9"} fillOpacity={0.06} />
            <ReferenceArea x1={AD_CFG.FREQ_HIGH} x2={maxFreq} y1={AD_CFG.CPLPV_GOOD} y2={maxCplpv} fill={NEGATIVE} fillOpacity={0.08} />
            <ReferenceLine x={AD_CFG.FREQ_HIGH} stroke={palette.textDim} strokeDasharray="3 3" />
            <ReferenceLine y={AD_CFG.CPLPV_GOOD} stroke={palette.textDim} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="freq" name="Frequenza" domain={[0, maxFreq]}
              label={{ value: "Frequenza (imp/reach)", position: "insideBottom", offset: -20, style: { fill: palette.axis, fontSize: 11 } }}
              tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
            <YAxis type="number" dataKey="cplpv" name="CPLPV" domain={[0, maxCplpv]} reversed
              label={{ value: "CPLPV (€) — asse invertito", angle: -90, position: "insideLeft", style: { fill: palette.axis, fontSize: 11 } }}
              tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
              tickFormatter={(v) => eur(Number(v))} width={60} />
            <ZAxis type="number" dataKey="spesa" range={[40, 500]} name="Spesa" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
              formatter={(v: unknown, n: unknown) => {
                if (n === "Frequenza") return [num(Number(v), 2), n];
                if (n === "CPLPV") return [eur(Number(v)), n];
                if (n === "Spesa") return [eur0(Number(v)), n];
                return [String(v), String(n)];
              }}
              labelFormatter={() => ""}
              content={(props) => {
                const p = (props as { payload?: readonly { payload?: CreativeMetrics }[] }).payload?.[0]?.payload;
                if (!p) return null;
                return (
                  <div style={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, padding: 8, color: palette.text, fontSize: 11 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, maxWidth: 260 }}>{p.name}</div>
                    <div>CPLPV: <strong>{eur(p.cplpv)}</strong> · Freq: <strong>{num(p.freq, 2)}</strong></div>
                    <div>Spesa: <strong>{eur0(p.spesa)}</strong> · LPV: <strong>{integer(p.lpv)}</strong></div>
                  </div>
                );
              }} />
            <Scatter data={points} fill={ACCENT} fillOpacity={0.65} stroke={ACCENT} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: palette.textDim, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <span>⬇︎sx <strong style={{ color: POSITIVE }}>Scala</strong> (CPLPV basso, freq bassa)</span>
        <span>⬇︎dx <strong style={{ color: "#f59e0b" }}>Mantieni</strong> (CPLPV ok ma freq alta)</span>
        <span>⬆︎sx <strong style={{ color: "#0ea5e9" }}>Osserva</strong> (freq bassa ma CPLPV alto)</span>
        <span>⬆︎dx <strong style={{ color: NEGATIVE }}>Spegni</strong></span>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// GOOGLE ADS VIEW
// ══════════════════════════════════════════════════════════════════

function GoogleView({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  // Aggregazione dal gads_daily
  // row: [data, campaign, tipo, costo, imp, click, ctr, conv, valore]
  const campaigns = useMemo(() => {
    const byName = new Map<string, { name: string; tipo: string; costo: number; imp: number; click: number; conv: number; valore: number }>();
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const name = String(r[1]); const tipo = String(r[2]);
      const cur = byName.get(name);
      const costo = Number(r[3]) || 0, imp = Number(r[4]) || 0, click = Number(r[5]) || 0;
      const conv = Number(r[7]) || 0, valore = Number(r[8]) || 0;
      if (cur) { cur.costo += costo; cur.imp += imp; cur.click += click; cur.conv += conv; cur.valore += valore; }
      else byName.set(name, { name, tipo, costo, imp, click, conv, valore });
    }
    return [...byName.values()].sort((a, b) => b.costo - a.costo);
  }, [data.gads_daily, range]);

  // Conversioni per azione
  // row: [data, campaign, azione, categoria, conv, valore]
  const conversioniAzione = useMemo(() => {
    const byKey = new Map<string, { azione: string; categoria: string; conv: number; valore: number }>();
    for (const r of data.gads_conv_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const azione = String(r[2]); const cat = String(r[3]);
      const key = azione + "|" + cat;
      const cur = byKey.get(key);
      const conv = Number(r[4]) || 0, valore = Number(r[5]) || 0;
      if (cur) { cur.conv += conv; cur.valore += valore; }
      else byKey.set(key, { azione, categoria: cat, conv, valore });
    }
    return [...byKey.values()].sort((a, b) => b.conv - a.conv);
  }, [data.gads_conv_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title={`Campagne Google Ads · ${range.days}g`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Campagna</th>
                <th style={ts.th}>Tipo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conversioni</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo per conv.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              </tr></thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  const cpa = c.conv > 0 ? c.costo / c.conv : 0;
                  const roas = c.costo > 0 ? c.valore / c.costo : 0;
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={c.name}>{c.name}</td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 10, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{c.tipo}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.costo)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.conv > 0 ? 600 : 400 }}>{num(c.conv, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.conv > 0 ? eur(cpa) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(c.valore)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: roas >= 2 ? POSITIVE : roas > 0 && roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 600 }}>{num(roas, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Conversioni per azione · range corrente" />
        {conversioniAzione.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Azione</th>
                <th style={ts.th}>Categoria</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conversioni</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
              </tr></thead>
              <tbody>
                {conversioniAzione.map((r, i) => {
                  const isPurchase = r.categoria === "PURCHASE";
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{r.azione}</td>
                      <td style={ts.tdBase}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20,
                          background: isPurchase ? `${POSITIVE}25` : palette.divider,
                          color: isPurchase ? POSITIVE : palette.textDim,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                        }}>{r.categoria}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: isPurchase ? 700 : 500, color: isPurchase ? POSITIVE : ts.tdBase.color }}>{num(r.conv, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(r.valore)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// Silence unused re-exports the file may pull in
void groupSumInRange; void groupInRange; void CHART_PALETTE; void ResponsiveContainer; void XAxis; void YAxis; void Tooltip; void Legend;
void React;
