"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ZAxis,
} from "recharts";
import {
  CentogiriData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, eur, eur0, integer, num, pctStr,
  Card, CardHeader, SectionTitle, EmptyState, Pill, tableStyles,
  COMPARE_LABEL, ACCENT, POSITIVE, NEGATIVE,
  sumInRange, groupInRange,
  isLeadObjective, LEAD_OBJECTIVES, AD_CFG, PHONE_CATEGORY,
} from "./shared";

type SubTab = "meta" | "gads";
type CreativesWindow = "w7" | "w30" | "w90";

export function AdvertisingTab({ data }: { data: CentogiriData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const [sub, setSub] = useState<SubTab>("meta");

  const spendMeta = sumInRange(data.meta?.campaigns_daily, range, 3);
  const spendGads = sumInRange(data.gads_daily, range, 3);
  const spendTot = spendMeta + spendGads;
  const spendMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 3) : 0;
  const spendGadsPrev = compareRange ? sumInRange(data.gads_daily, compareRange, 3) : 0;
  const spendTotPrev = compareRange ? spendMetaPrev + spendGadsPrev : null;

  const contattiCur = sumInRange(data.leads?.daily, range, 2);
  const contattiPrev = compareRange ? sumInRange(data.leads?.daily, compareRange, 2) : null;
  const cpc = contattiCur > 0 ? spendTot / contattiCur : 0;
  const cpcPrev = compareRange && contattiPrev && contattiPrev > 0 ? spendTotPrev! / contattiPrev : null;

  const metaPct = spendTot > 0 ? (spendMeta / spendTot) * 100 : 0;
  const gadsPct = spendTot > 0 ? (spendGads / spendTot) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`Panorama investimenti · ${range.days} giorni · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Advertising
      </SectionTitle>

      <Card>
        <CardHeader title="Blended · Meta + Google Ads" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          <div>
            <p style={LBL(palette.textDim)}>Spesa totale</p>
            <p style={BIG(palette.text)}>{eur(spendTot)}</p>
            {spendTotPrev != null && renderDelta(calcDelta(spendTot, spendTotPrev), palette.textDim, "vs periodo precedente")}
          </div>
          <div>
            <p style={LBL(palette.textDim)}>Meta / Google</p>
            <p style={BIG(palette.text)}>
              <span style={{ color: "#4267B2" }}>{pctStr(metaPct, 1)}</span>
              <span style={{ color: palette.textFaint, margin: "0 8px" }}>·</span>
              <span style={{ color: "#DB4437" }}>{pctStr(gadsPct, 1)}</span>
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: palette.textDim }}>
              Meta {eur0(spendMeta)} · Google {eur0(spendGads)}
            </p>
          </div>
          <div>
            <p style={LBL(palette.textDim)}>Costo per Contatto</p>
            <p style={BIG(palette.text)}>{eur(cpc)}</p>
            {cpcPrev != null && renderDelta(invertDeltaColor(calcDelta(cpc, cpcPrev)), palette.textDim, "vs periodo precedente · sale = peggio")}
          </div>
          <div>
            <p style={LBL(palette.textDim)}>Contatti totali</p>
            <p style={BIG(ACCENT)}>{integer(contattiCur)}</p>
            {contattiPrev != null && renderDelta(calcDelta(contattiCur, contattiPrev), palette.textDim)}
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8 }}>
        <SubtabBtn active={sub === "meta"} onClick={() => setSub("meta")}>Meta</SubtabBtn>
        <SubtabBtn active={sub === "gads"} onClick={() => setSub("gads")}>Google Ads</SubtabBtn>
      </div>

      {sub === "meta" ? <MetaView data={data} /> : <GoogleAdsView data={data} />}
    </div>
  );
}

function LBL(color: string): React.CSSProperties {
  return { margin: 0, fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em", textTransform: "uppercase" };
}
function BIG(color: string): React.CSSProperties {
  return { margin: "6px 0 0", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color, fontVariantNumeric: "tabular-nums" };
}
function renderDelta(d: ReturnType<typeof calcDelta>, dim: string, note?: string) {
  if (!d) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: d.color, display: "inline-flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 10 }}>{d.arrow}</span>{d.label}
      </span>
      {note && <span style={{ fontSize: 11, color: dim }}>{note}</span>}
    </div>
  );
}

function SubtabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <button onClick={onClick} style={{
      padding: "0.55rem 1.15rem", borderRadius: 10,
      border: `1px solid ${active ? palette.textFaint : palette.cardBorder}`,
      background: active ? palette.buttonHover : "transparent",
      color: active ? palette.text : palette.textMuted,
      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>{children}</button>
  );
}

// ═══ Google Ads ═══════════════════════════════════════════════════

function GoogleAdsView({ data }: { data: CentogiriData }) {
  const { range } = useDateRange();
  const { palette } = useTheme();
  const ts = tableStyles(palette);

  // Aggregate campaigns from gads_daily: [data, campagna, tipo, costo, imp, click, ...]
  // Nota: escludiamo conversioni/chiamate perché il conteggio contatti affidabile arriva dai form (tab Contatti)
  const campaigns = useMemo(() => {
    const grouped = new Map<string, { tipo: string; costo: number; imp: number; click: number }>();
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0] ?? "");
      if (d < range.start || d > range.end) continue;
      const camp = String(r[1] ?? "");
      const tipo = String(r[2] ?? "");
      const g = grouped.get(camp) ?? { tipo, costo: 0, imp: 0, click: 0 };
      g.costo += Number(r[3]) || 0;
      g.imp += Number(r[4]) || 0;
      g.click += Number(r[5]) || 0;
      if (!g.tipo) g.tipo = tipo;
      grouped.set(camp, g);
    }
    return Array.from(grouped.entries()).map(([campagna, v]) => ({ campagna, ...v }))
      .sort((a, b) => b.costo - a.costo);
  }, [data.gads_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <CardHeader title={`Campagne Google Ads · ${range.days} giorni`} />
        {campaigns.length === 0 ? <EmptyState label="Nessuna campagna nel periodo" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead>
                <tr>
                  <th style={ts.th}>Campagna</th>
                  <th style={ts.th}>Tipo</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Costo</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Impression</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={c.campagna}>
                        {c.campagna}
                      </td>
                      <td style={{ ...ts.tdBase, fontSize: 10, color: palette.textDim }}>{c.tipo}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(c.costo)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
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

// ═══ Meta ═════════════════════════════════════════════════════════

function MetaView({ data }: { data: CentogiriData }) {
  const { range } = useDateRange();
  const { palette } = useTheme();
  const ts = tableStyles(palette);

  // Aggregate Meta campaigns from campaigns_daily
  // row: [data, campagna, obiettivo, spesa, imp, click, lead, contatti, interazioni, acquisti, valore]
  const campaigns = useMemo(() => {
    const grouped = new Map<string, {
      obiettivo: string; spesa: number; imp: number; click: number;
      lead: number; contatti: number; interazioni: number; acquisti: number; valore: number;
    }>();
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0] ?? "");
      if (d < range.start || d > range.end) continue;
      const camp = String(r[1] ?? "");
      const obj = String(r[2] ?? "");
      const g = grouped.get(camp) ?? { obiettivo: obj, spesa: 0, imp: 0, click: 0, lead: 0, contatti: 0, interazioni: 0, acquisti: 0, valore: 0 };
      g.spesa += Number(r[3]) || 0;
      g.imp += Number(r[4]) || 0;
      g.click += Number(r[5]) || 0;
      g.lead += Number(r[6]) || 0;
      g.contatti += Number(r[7]) || 0;
      g.interazioni += Number(r[8]) || 0;
      g.acquisti += Number(r[9]) || 0;
      g.valore += Number(r[10]) || 0;
      if (!g.obiettivo) g.obiettivo = obj;
      grouped.set(camp, g);
    }
    return Array.from(grouped.entries())
      .map(([campagna, v]) => ({ campagna, ...v }))
      .sort((a, b) => b.spesa - a.spesa);
  }, [data.meta?.campaigns_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <CardHeader title={`Campagne Meta · ${range.days} giorni`} />
        {campaigns.length === 0 ? <EmptyState label="Nessuna campagna nel periodo" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead>
                <tr>
                  <th style={ts.th}>Campagna</th>
                  <th style={ts.th}>Obiettivo</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Contatti (form)</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Contatti Meta</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Interazioni</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Costo/Risultato</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  const isLead = isLeadObjective(c.obiettivo);
                  const denom = isLead ? c.lead : (c.contatti + c.interazioni);
                  const cpr = denom > 0 ? c.spesa / denom : 0;
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={c.campagna}>
                        {c.campagna}
                      </td>
                      <td style={{ ...ts.tdBase, fontSize: 10 }}>
                        <span style={{
                          display: "inline-block", padding: "1px 7px", borderRadius: 20,
                          background: isLead ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.20)",
                          color: isLead ? "#22c55e" : palette.textDim,
                          fontWeight: 700, letterSpacing: "0.05em",
                        }}>{c.obiettivo}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(c.spesa)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.lead > 0 ? 600 : 400 }}>{integer(c.lead)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.contatti)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.interazioni)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}
                        title={isLead ? "Spesa ÷ contatti da form" : "Spesa ÷ (contatti Meta + interazioni)"}>
                        {cpr > 0 ? eur(cpr) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreativesSection data={data} />
    </div>
  );
}

// ─── Verdetti creatività ──────────────────────────────────────────

type Verdict = "scala" | "fatigue" | "spegni" | "osserva" | "mantieni";

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; desc: string }> = {
  scala: { label: "Scala", color: "#22c55e", bg: "rgba(34,197,94,0.15)", desc: "Costo per contatto basso e pubblico non saturo: alza il budget" },
  fatigue: { label: "Fatigue in arrivo", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", desc: "Sta ancora funzionando ma inizia a perdere: prepara il ricambio" },
  spegni: { label: "Spegni", color: "#ef4444", bg: "rgba(239,68,68,0.15)", desc: "Spreco: costa e non produce" },
  osserva: { label: "Osserva", color: "#94a3b8", bg: "rgba(148,163,184,0.18)", desc: "Dati insufficienti per giudicare" },
  mantieni: { label: "Mantieni", color: "#0ea5e9", bg: "rgba(14,165,233,0.15)", desc: "Nella norma, non toccare" },
};

type CreativeMetrics = {
  name: string; stato: string; obiettivo: string;
  spesa: number; imp: number; reach: number; freq: number;
  click: number; ctr: number; cpm: number; cpc: number;
  lead: number; contatti: number; interazioni: number; lpv: number;
  acquisti: number; valore: number; cpl: number;
};

function toMetrics(r: (string | number)[]): CreativeMetrics {
  const spesa = Number(r[3]) || 0;
  const lead = Number(r[11]) || 0;
  const cpl = r[17] != null ? (Number(r[17]) || 0) : (lead > 0 ? spesa / lead : 0);
  return {
    name: String(r[0] ?? ""),
    stato: String(r[1] ?? ""),
    obiettivo: String(r[2] ?? ""),
    spesa,
    imp: Number(r[4]) || 0,
    reach: Number(r[5]) || 0,
    freq: Number(r[6]) || 0,
    click: Number(r[7]) || 0,
    ctr: Number(r[8]) || 0,
    cpm: Number(r[9]) || 0,
    cpc: Number(r[10]) || 0,
    lead,
    contatti: Number(r[12]) || 0,
    interazioni: Number(r[13]) || 0,
    lpv: Number(r[14]) || 0,
    acquisti: Number(r[15]) || 0,
    valore: Number(r[16]) || 0,
    cpl,
  };
}

function computeVerdict(w30: CreativeMetrics, w7: CreativeMetrics | undefined): { verdict: Verdict; reason: string } {
  const spesa = w30.spesa;
  const isLead = isLeadObjective(w30.obiettivo);
  const ctrW30 = w30.ctr;
  const ctrW7 = w7?.ctr ?? 0;
  const freqW7 = w7?.freq ?? 0;
  const ctrDropRatio = ctrW30 > 0 ? ctrW7 / ctrW30 : 1;

  // Regole per obiettivo CONTATTI (Meta OUTCOME_LEADS / LEAD_GENERATION / CONVERSIONS)
  if (isLead) {
    // SPEGNI
    if (spesa >= AD_CFG.MIN_SPEND && w30.lead === 0) {
      return { verdict: "spegni", reason: `Obiettivo CONTATTI · spesa ${eur(spesa)} con 0 contatti` };
    }
    // OSSERVA (dati insufficienti)
    if (spesa < AD_CFG.MIN_SPEND) {
      return { verdict: "osserva", reason: `Obiettivo CONTATTI · spesa ${eur(spesa)} sotto ${eur(AD_CFG.MIN_SPEND)}: dati insufficienti` };
    }
    // Costo per contatto ok?
    if (w30.cpl > 0 && w30.cpl <= AD_CFG.CPL_GOOD) {
      // FATIGUE
      if (freqW7 >= AD_CFG.FREQ_HIGH) {
        return { verdict: "fatigue", reason: `Obiettivo CONTATTI · Costo/Contatto ${eur(w30.cpl)} ok ma frequenza w7 ${num(freqW7, 2)} ≥ ${num(AD_CFG.FREQ_HIGH, 1)}` };
      }
      if (w7 && ctrW30 > 0 && ctrDropRatio < 1 - AD_CFG.CTR_DROP) {
        const drop = (1 - ctrDropRatio) * 100;
        return { verdict: "fatigue", reason: `Obiettivo CONTATTI · CTR w7 ${pctStr(ctrW7 * 100, 2)} vs ${pctStr(ctrW30 * 100, 2)} 30g (−${num(drop, 0)}%)` };
      }
      // SCALA
      if (w7 && freqW7 < AD_CFG.FREQ_HIGH && ctrW7 >= ctrW30) {
        return { verdict: "scala", reason: `Obiettivo CONTATTI · Costo/Contatto ${eur(w30.cpl)} · freq w7 ${num(freqW7, 2)} · CTR stabile o crescente` };
      }
    }
    return { verdict: "mantieni", reason: `Obiettivo CONTATTI · Costo/Contatto ${eur(w30.cpl)} · performance nella norma` };
  }

  // Regole per obiettivo NON-LEAD (interazione, traffico, awareness, messaggi)
  const label = w30.obiettivo || "ALTRO";
  // SPEGNI
  if (spesa >= AD_CFG.MIN_SPEND && w30.interazioni === 0 && w30.contatti === 0) {
    return { verdict: "spegni", reason: `Obiettivo ${label} · spesa ${eur(spesa)} con 0 interazioni e 0 contatti` };
  }
  // OSSERVA
  if (spesa < AD_CFG.MIN_SPEND) {
    return { verdict: "osserva", reason: `Obiettivo ${label} · spesa ${eur(spesa)} sotto ${eur(AD_CFG.MIN_SPEND)}: dati insufficienti` };
  }
  // FATIGUE
  if (freqW7 >= AD_CFG.FREQ_HIGH) {
    return { verdict: "fatigue", reason: `Obiettivo ${label} · frequenza w7 ${num(freqW7, 2)} ≥ ${num(AD_CFG.FREQ_HIGH, 1)}` };
  }
  if (w7 && ctrW30 > 0 && ctrDropRatio < 1 - AD_CFG.CTR_DROP) {
    const drop = (1 - ctrDropRatio) * 100;
    return { verdict: "fatigue", reason: `Obiettivo ${label} · CTR w7 ${pctStr(ctrW7 * 100, 2)} vs ${pctStr(ctrW30 * 100, 2)} 30g (−${num(drop, 0)}%)` };
  }
  // Nessuna SCALA per non-lead (no CPL da valutare)
  return { verdict: "mantieni", reason: `Obiettivo ${label} · performance nella norma` };
}

function CreativesSection({ data }: { data: CentogiriData }) {
  const { palette } = useTheme();
  const [scatterWindow, setScatterWindow] = useState<CreativesWindow>("w30");

  const w30rows = data.meta?.creatives?.w30?.rows ?? [];
  const w7rows = data.meta?.creatives?.w7?.rows ?? [];

  const enriched = useMemo(() => {
    const w7map = new Map<string, CreativeMetrics>();
    for (const r of w7rows) {
      const m = toMetrics(r);
      w7map.set(m.name.toLowerCase().trim(), m);
    }
    return w30rows.map((r) => {
      const w30m = toMetrics(r);
      const w7m = w7map.get(w30m.name.toLowerCase().trim());
      const v = computeVerdict(w30m, w7m);
      return { w30: w30m, w7: w7m, verdict: v.verdict, reason: v.reason };
    }).sort((a, b) => b.w30.spesa - a.w30.spesa);
  }, [w30rows, w7rows]);

  const [filter, setFilter] = useState<"all" | Verdict>("all");
  const [includePaused, setIncludePaused] = useState(false);

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

  // Matrix scatter (only lead objective)
  const scatterSrc = data.meta?.creatives?.[scatterWindow];
  const scatterRows = (scatterSrc?.rows ?? []).map(toMetrics).filter((m) => isLeadObjective(m.obiettivo));

  if (enriched.length === 0 && scatterRows.length === 0) {
    return (
      <Card>
        <CardHeader title="Analisi creatività" />
        <EmptyState label="Nessuna creatività Meta nel periodo" />
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Matrice creatività · Costo per Contatto × Frequenza (solo obiettivo contatti)"
          right={
            <div style={{ display: "flex", gap: 6 }}>
              <Pill active={scatterWindow === "w7"} onClick={() => setScatterWindow("w7")}>7g</Pill>
              <Pill active={scatterWindow === "w30"} onClick={() => setScatterWindow("w30")}>30g</Pill>
              <Pill active={scatterWindow === "w90"} onClick={() => setScatterWindow("w90")}>90g</Pill>
            </div>
          }
        />
        {scatterRows.length === 0 ? (
          <EmptyState label={`Nessuna creatività con obiettivo contatti in ${scatterWindow}`} />
        ) : (
          <CplScatter rows={scatterRows} />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Verdetti operativi creatività"
          right={
            <span style={{ fontSize: 11, color: palette.textDim }}>
              w7 vs w30 · soglie Costo/Contatto ≤ {eur(AD_CFG.CPL_GOOD)} · freq ≥ {num(AD_CFG.FREQ_HIGH, 1)} · spesa min {eur(AD_CFG.MIN_SPEND)}
            </span>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
          <VerdictCard verdict="scala" label="Da scalare" count={counts.scala} active={filter === "scala"} onClick={() => setFilter(filter === "scala" ? "all" : "scala")} />
          <VerdictCard verdict="fatigue" label="Fatigue in arrivo" count={counts.fatigue} active={filter === "fatigue"} onClick={() => setFilter(filter === "fatigue" ? "all" : "fatigue")} />
          <VerdictCard verdict="spegni" label="Da spegnere" count={counts.spegni} active={filter === "spegni"} onClick={() => setFilter(filter === "spegni" ? "all" : "spegni")} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: palette.textDim, fontWeight: 600, marginRight: 4 }}>Filtra:</span>
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

        {visible.length === 0 ? <EmptyState label="Nessuna creatività corrisponde ai filtri" /> : (
          <VerdictTable rows={visible} />
        )}
      </Card>
    </>
  );
}

function VerdictCard({ verdict, label, count, active, onClick }: {
  verdict: Verdict; label: string; count: number; active: boolean; onClick: () => void;
}) {
  const { palette } = useTheme();
  const meta = VERDICT_META[verdict];
  return (
    <button onClick={onClick} style={{
      textAlign: "left", cursor: "pointer",
      padding: "0.9rem 1rem", borderRadius: 12,
      border: `1px solid ${active ? meta.color : palette.cardBorder}`,
      background: active ? meta.bg : palette.divider,
      color: palette.text, fontFamily: "inherit",
      boxShadow: active ? `0 0 0 2px ${meta.bg}` : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{integer(count)}</p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.textDim }}>{meta.desc}</p>
    </button>
  );
}

type VerdictRow = { w30: CreativeMetrics; w7: CreativeMetrics | undefined; verdict: Verdict; reason: string };

function VerdictTable({ rows }: { rows: VerdictRow[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Creatività</th>
            <th style={ts.th}>Obiettivo</th>
            <th style={ts.th}>Stato</th>
            <th style={ts.th}>Verdetto</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Spesa 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Freq. 7g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR 7g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Contatti 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Costo/Contatto 30g</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const meta = VERDICT_META[r.verdict];
            const active = r.w30.stato === "ACTIVE";
            const isLead = isLeadObjective(r.w30.obiettivo);
            return (
              <tr key={i}>
                <td style={{ ...ts.tdBase, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: palette.text, fontWeight: 500 }} title={r.w30.name}>
                  {r.w30.name}
                </td>
                <td style={ts.tdBase}>
                  <span style={{
                    display: "inline-block", padding: "1px 7px", borderRadius: 20,
                    background: isLead ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.20)",
                    color: isLead ? "#22c55e" : palette.textDim,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  }}>{r.w30.obiettivo}</span>
                </td>
                <td style={ts.tdBase}>
                  <span style={{
                    display: "inline-block", padding: "1px 8px", borderRadius: 20,
                    background: active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.20)",
                    color: active ? "#22c55e" : palette.textDim,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  }}>{r.w30.stato}</span>
                </td>
                <td style={ts.tdBase}>
                  <span title={r.reason} style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 20,
                    background: meta.bg, color: meta.color,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                    textTransform: "uppercase", cursor: "help",
                    border: `1px solid ${meta.color}30`,
                  }}>{meta.label}</span>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.w30.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.w7 && r.w7.freq >= AD_CFG.FREQ_HIGH ? "#f59e0b" : ts.tdBase.color, fontWeight: 500 }}>
                  {r.w7 ? num(r.w7.freq, 2) : "—"}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.w7 ? pctStr(r.w7.ctr * 100, 2) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.w30.ctr * 100, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.w30.lead > 0 ? 600 : 400 }}>{integer(r.w30.lead)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight,
                  color: isLead && r.w30.cpl > 0 && r.w30.cpl <= AD_CFG.CPL_GOOD ? POSITIVE : (isLead && r.w30.cpl > 0 ? NEGATIVE : ts.tdBase.color),
                  fontWeight: 700,
                }}>{r.w30.cpl > 0 ? eur(r.w30.cpl) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Scatter CPL × Freq (solo lead objective) ─────────────────────

function CplScatter({ rows }: { rows: CreativeMetrics[] }) {
  const { palette } = useTheme();
  const points = rows.filter((r) => r.freq > 0 && r.cpl > 0);
  if (points.length === 0) return <EmptyState label="Nessuna creatività con dati sufficienti" />;

  const maxFreq = Math.max(AD_CFG.FREQ_HIGH * 1.6, ...points.map((p) => p.freq));
  const maxCpl = Math.max(AD_CFG.CPL_GOOD * 2, ...points.map((p) => p.cpl));
  const maxSpesa = Math.max(1, ...points.map((p) => p.spesa));

  return (
    <div style={{ width: "100%", height: 380 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 24, bottom: 40, left: 40 }}>
          <CartesianGrid stroke={palette.grid} />
          {/* Quadrants: CPL basso (buono) = alto rendimento; freq bassa = pubblico non saturo */}
          {/* Scala: cpl <= good, freq < high (basso a sinistra visualmente ma "top-left" nel senso di alto rendimento) */}
          <ReferenceArea x1={0} x2={AD_CFG.FREQ_HIGH} y1={0} y2={AD_CFG.CPL_GOOD} fill="#22c55e" fillOpacity={0.06} strokeOpacity={0} />
          <ReferenceArea x1={AD_CFG.FREQ_HIGH} x2={maxFreq} y1={0} y2={AD_CFG.CPL_GOOD} fill="#0ea5e9" fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceArea x1={0} x2={AD_CFG.FREQ_HIGH} y1={AD_CFG.CPL_GOOD} y2={maxCpl} fill="#f97316" fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceArea x1={AD_CFG.FREQ_HIGH} x2={maxFreq} y1={AD_CFG.CPL_GOOD} y2={maxCpl} fill="#ef4444" fillOpacity={0.08} strokeOpacity={0} />

          <XAxis type="number" dataKey="freq" name="Frequenza" domain={[0, maxFreq]}
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => num(Number(v), 1)}
            label={{ value: "Frequenza →", position: "insideBottom", offset: -8, fill: palette.textDim, fontSize: 11 }} />
          <YAxis type="number" dataKey="cpl" name="Costo/Contatto" domain={[0, maxCpl]} reversed
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => eur0(Number(v))}
            label={{ value: "Costo/Contatto (basso = alto rendimento) ↑", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }} />
          <ZAxis type="number" dataKey="spesa" range={[40, Math.max(600, maxSpesa)]} name="Spesa" />
          <ReferenceLine y={AD_CFG.CPL_GOOD} stroke={palette.textFaint} strokeDasharray="4 4"
            label={{ value: `Costo/Contatto ${eur(AD_CFG.CPL_GOOD)}`, fill: palette.textDim, fontSize: 10, position: "insideBottomRight" }} />
          <ReferenceLine x={AD_CFG.FREQ_HIGH} stroke={palette.textFaint} strokeDasharray="4 4"
            label={{ value: `Freq ${num(AD_CFG.FREQ_HIGH, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideTopLeft" }} />

          <Tooltip cursor={{ strokeDasharray: "3 3", stroke: palette.textFaint }} content={<ScatterTooltip />} />

          {/* Quadrant labels */}
          <ReferenceLine segment={[{ x: AD_CFG.FREQ_HIGH / 2, y: AD_CFG.CPL_GOOD * 0.4 }, { x: AD_CFG.FREQ_HIGH / 2 + 0.001, y: AD_CFG.CPL_GOOD * 0.4 }]} stroke="none"
            label={{ value: "Scala", position: "center", fill: "rgba(34,197,94,0.85)", fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine segment={[{ x: AD_CFG.FREQ_HIGH + (maxFreq - AD_CFG.FREQ_HIGH) * 0.5, y: AD_CFG.CPL_GOOD * 0.4 }, { x: AD_CFG.FREQ_HIGH + (maxFreq - AD_CFG.FREQ_HIGH) * 0.5 + 0.001, y: AD_CFG.CPL_GOOD * 0.4 }]} stroke="none"
            label={{ value: "Mantieni", position: "center", fill: "rgba(14,165,233,0.85)", fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine segment={[{ x: AD_CFG.FREQ_HIGH / 2, y: AD_CFG.CPL_GOOD + (maxCpl - AD_CFG.CPL_GOOD) * 0.8 }, { x: AD_CFG.FREQ_HIGH / 2 + 0.001, y: AD_CFG.CPL_GOOD + (maxCpl - AD_CFG.CPL_GOOD) * 0.8 }]} stroke="none"
            label={{ value: "Osserva", position: "center", fill: "rgba(249,115,22,0.85)", fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine segment={[{ x: AD_CFG.FREQ_HIGH + (maxFreq - AD_CFG.FREQ_HIGH) * 0.5, y: AD_CFG.CPL_GOOD + (maxCpl - AD_CFG.CPL_GOOD) * 0.8 }, { x: AD_CFG.FREQ_HIGH + (maxFreq - AD_CFG.FREQ_HIGH) * 0.5 + 0.001, y: AD_CFG.CPL_GOOD + (maxCpl - AD_CFG.CPL_GOOD) * 0.8 }]} stroke="none"
            label={{ value: "Spegni", position: "center", fill: "rgba(239,68,68,0.9)", fontSize: 11, fontWeight: 700 }} />

          <Scatter data={points} fill={ACCENT} fillOpacity={0.7} stroke={ACCENT} strokeWidth={1.5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltip({ active, payload }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as CreativeMetrics;
  return (
    <div style={{
      background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.7rem 0.85rem",
      fontSize: 12, color: palette.text, maxWidth: 260,
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    }}>
      <p style={{ margin: 0, fontWeight: 700, marginBottom: 4, wordBreak: "break-word" }}>{p.name}</p>
      <p style={{ margin: 0, fontSize: 10, color: p.stato === "ACTIVE" ? "#22c55e" : palette.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>{p.stato} · {p.obiettivo}</p>
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>Costo/Contatto</span><span style={{ textAlign: "right" }}>{eur(p.cpl)}</span>
        <span style={{ color: palette.textDim }}>Frequenza</span><span style={{ textAlign: "right" }}>{num(p.freq, 2)}</span>
        <span style={{ color: palette.textDim }}>Spesa</span><span style={{ textAlign: "right" }}>{eur(p.spesa)}</span>
        <span style={{ color: palette.textDim }}>Contatti</span><span style={{ textAlign: "right" }}>{integer(p.lead)}</span>
        <span style={{ color: palette.textDim }}>CTR</span><span style={{ textAlign: "right" }}>{pctStr(p.ctr * 100, 2)}</span>
      </div>
    </div>
  );
}

// silence unused imports
void LEAD_OBJECTIVES; void groupInRange;
