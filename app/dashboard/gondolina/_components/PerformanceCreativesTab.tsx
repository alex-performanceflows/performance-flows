"use client";

import { Fragment, useMemo, useState } from "react";
import {
  GondolinaData, useTheme, useDateRange,
  eur, eur0, integer, num, pctStr,
  Card, CardHeader, KpiTile, EmptyState, Pill, tableStyles,
  ACCENT, GOLD, POSITIVE, NEGATIVE, AD_CFG,
  creativeWindowFor, useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle, useElementWidth,
  type CreativeWindow, type MetaBenchmark, type SortValue,
} from "./shared";
import {
  CreativeWindowDetail, AvgTd, WINDOW_LABEL,
  creativeKey, statoLabel, useCreativeWindows,
  type CreativeMetricsRaw, type CreativeWindows,
} from "./creatives";

type FamilyKey = "video" | "carosello" | "statico";

const FAMILY_META: Record<FamilyKey, { label: string; color: string; formats: string[]; hasHook: boolean; desc: string }> = {
  video:     { label: "Video",     color: ACCENT,    formats: ["Video"],                hasHook: true,  desc: "Attenzione: hook rate, hold rate, ritenzione 50%" },
  carosello: { label: "Caroselli", color: GOLD,      formats: ["Carosello"],            hasHook: false, desc: "Attenzione: CTR link, LPV rate" },
  statico:   { label: "Statici",   color: "#4a7a8a", formats: ["Immagine", "Raccolta"], hasHook: false, desc: "Attenzione: CTR link, CPM" },
};

function classifyFamily(formato: string): FamilyKey | null {
  const f = formato.toLowerCase();
  if (f.includes("video")) return "video";
  if (f.includes("carosello")) return "carosello";
  if (f.includes("immagine") || f.includes("raccolta") || f.includes("statico")) return "statico";
  return null;
}

export function PerformanceCreativesTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { preset, range } = useDateRange();
  const [family, setFamily] = useState<FamilyKey>("video");
  const [includePaused, setIncludePaused] = useState(false);

  // Il periodo lo decide il selettore in alto: ricondotto alla finestra del motore più vicina
  const { win, exact } = creativeWindowFor(preset, range.days);
  const windows = useCreativeWindows(data);

  const byFamily = useMemo(() => {
    const g: Record<FamilyKey, CreativeMetricsRaw[]> = { video: [], carosello: [], statico: [] };
    for (const c of windows[win].values()) {
      const fam = classifyFamily(c.formato);
      if (!fam) continue;
      if (!includePaused && c.stato !== "ACTIVE") continue;
      g[fam].push(c);
    }
    return g;
  }, [windows, win, includePaused]);

  const totals = useMemo(() => {
    const t: Record<FamilyKey, { spesa: number; impression: number; acquisti: number; atc: number }> = {
      video: { spesa: 0, impression: 0, acquisti: 0, atc: 0 },
      carosello: { spesa: 0, impression: 0, acquisti: 0, atc: 0 },
      statico: { spesa: 0, impression: 0, acquisti: 0, atc: 0 },
    };
    for (const k of Object.keys(byFamily) as FamilyKey[]) {
      for (const c of byFamily[k]) {
        t[k].spesa += c.spesa; t[k].impression += c.impression;
        t[k].acquisti += c.acquisti; t[k].atc += c.atc;
      }
    }
    return t;
  }, [byFamily]);

  const currentRows = byFamily[family];
  const currentMeta = FAMILY_META[family];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Performance Creatives Workflow</h2>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
          Deep dive sulla performance delle creatività Meta, distinta per famiglia. Solo i video espongono hook rate, hold rate e ritenzione.
          {" "}Periodo creatività: <strong style={{ color: palette.textMuted }}>{WINDOW_LABEL[win]}</strong>
          {exact ? "." : ", la finestra più vicina al periodo selezionato in alto: le creatività sono calcolate su 7, 30 e 90 giorni."}
        </p>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, alignSelf: "flex-start" }}>
        <input type="checkbox" checked={includePaused} onChange={(e) => setIncludePaused(e.target.checked)} style={{ accentColor: ACCENT }} />
        <span style={{ color: palette.textMuted }}>Includi in pausa</span>
      </label>

      {/* Card famiglia */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {(Object.keys(FAMILY_META) as FamilyKey[]).map((k) => {
          const m = FAMILY_META[k];
          const active = family === k;
          const t = totals[k];
          return (
            <button key={k} onClick={() => setFamily(k)} aria-pressed={active} style={{
              textAlign: "left", cursor: "pointer",
              padding: "1rem 1.1rem", borderRadius: 14,
              border: `1px solid ${active ? m.color : palette.cardBorder}`,
              background: active ? `${m.color}18` : palette.cardBg,
              color: palette.text, fontFamily: "inherit",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: m.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{m.label}</span>
                <span style={{ fontSize: 10, color: palette.textDim, marginLeft: "auto" }}>{byFamily[k].length} inserz.</span>
              </div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: palette.text }}>{eur0(t.spesa)}</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: palette.textDim }}>{integer(t.impression)} impression · {integer(t.acquisti)} acquisti</p>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: palette.textFaint, borderTop: `1px dashed ${palette.divider}`, paddingTop: 6 }}>{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Riepilogo famiglia scelta */}
      <FamilyDetail family={family} rows={currentRows} meta={currentMeta} palette={palette}
        windows={windows} win={win} benchmark={data.meta?.benchmark} />
    </div>
  );
}

function FamilyDetail({ family, rows, meta, palette, windows, win, benchmark }: {
  family: FamilyKey; rows: CreativeMetricsRaw[]; meta: typeof FAMILY_META[FamilyKey]; palette: import("./shared").Palette;
  windows: CreativeWindows; win: CreativeWindow; benchmark?: MetaBenchmark;
}) {
  if (rows.length === 0) {
    return <Card><CardHeader title={`${meta.label} · Riepilogo`} /><EmptyState label={`Nessuna creatività ${meta.label.toLowerCase()} nel range`} /></Card>;
  }

  // KPI di famiglia
  const spesa = rows.reduce((s, r) => s + r.spesa, 0);
  const impression = rows.reduce((s, r) => s + r.impression, 0);
  const acquisti = rows.reduce((s, r) => s + r.acquisti, 0);
  const atc = rows.reduce((s, r) => s + r.atc, 0);
  const valore = rows.reduce((s, r) => s + r.valore, 0);
  const clickLink = rows.reduce((s, r) => s + r.clickLink, 0);
  const roas = spesa > 0 ? valore / spesa : 0;
  const cpa = acquisti > 0 ? spesa / acquisti : 0;
  const cpAtc = atc > 0 ? spesa / atc : 0;
  const ctrLinkMedio = impression > 0 ? (clickLink / impression) * 100 : 0;
  // Solo video: medie ponderate di hook/hold
  const hookMedio = family === "video" && impression > 0
    ? rows.reduce((s, r) => s + r.hookRate * r.impression, 0) / impression : 0;
  const holdMedio = family === "video" && impression > 0
    ? rows.reduce((s, r) => s + r.holdRate * r.impression, 0) / impression : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title={`${meta.label} · Riepilogo di famiglia`}
          right={<span style={{ fontSize: 11, color: palette.textDim }}>{integer(rows.length)} inserzioni aggregate per nome + formato</span>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <KpiTile label="Spesa" value={eur(spesa)} accent={meta.color} info={`Spesa totale ${meta.label.toLowerCase()} nel range`} />
          <KpiTile label="Impression" value={integer(impression)} />
          <KpiTile label="CTR link medio" value={pctStr(ctrLinkMedio, 2)} info="Click sul link ÷ impression × 100, aggregato sulla famiglia" />
          <KpiTile label="ATC" value={integer(atc)} />
          <KpiTile label="Costo/ATC" value={atc > 0 ? eur(cpAtc) : "—"} info="Spesa ÷ aggiunte al carrello" />
          <KpiTile label="Acquisti" value={integer(acquisti)} />
          <KpiTile label="CPA" value={acquisti > 0 ? eur(cpa) : "—"} info="Spesa ÷ acquisti" />
          <KpiTile label="ROAS" value={num(roas, 2)} info="Valore acquisti ÷ spesa (attribuzione Meta)" />
          {family === "video" && <KpiTile label="Hook rate medio" value={pctStr(hookMedio, 1)} info="Rilevante solo per video: quota di chi guarda oltre i primi 3 secondi" accent={meta.color} />}
          {family === "video" && <KpiTile label="Hold rate medio" value={pctStr(holdMedio, 1)} info="Rilevante solo per video: quota di chi arriva a 15s / al termine" />}
        </div>
      </Card>

      <FamilyTable key={family} family={family} label={meta.label} rows={rows} windows={windows} win={win} benchmark={benchmark} />
    </div>
  );
}

// ─── Tabella inserzioni della famiglia ────────────────────────────

function FamilyTable({ family, label, rows, windows, win, benchmark }: {
  family: FamilyKey; label: string; rows: CreativeMetricsRaw[];
  windows: CreativeWindows; win: CreativeWindow; benchmark?: MetaBenchmark;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const video = family === "video";
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Il pannello di dettaglio resta a vista anche con la tabella scrollata in orizzontale
  const { ref: wrapRef, width: wrapWidth } = useElementWidth<HTMLDivElement>();

  const { sorted, sort, toggle, reset } = useTableSort<CreativeMetricsRaw>(rows, (r, key): SortValue => {
    switch (key) {
      case "nome": return r.nome;
      case "soggetto": return r.soggetto;
      case "stato": return statoLabel(r.stato);
      case "spesa": return r.spesa;
      case "impr": return r.impression;
      case "ctrLink": return r.impression > 0 ? r.ctrLink : null;
      case "lpvRate": return r.clickLink > 0 ? r.lpvRate : null;
      case "costoLpv": return r.lpv > 0 ? r.costoLpv : null;
      case "atc": return r.atc;
      case "costoAtc": return r.atc > 0 ? r.costoAtc : null;
      case "hook": return r.impression > 0 ? r.hookRate : null;
      case "hold": return r.impression > 0 ? r.holdRate : null;
      case "ret50": return r.impression > 0 ? r.ritenzione50 : null;
      case "acquisti": return r.acquisti;
      case "roas": return r.valore > 0 ? r.roas : null;
      default: return null;
    }
  });

  // Media sulle righe visibili: costi e tassi dai totali, volumi per riga
  const avg = useMemo(() => {
    const t = { spesa: 0, impr: 0, clickLink: 0, lpv: 0, atc: 0, valore: 0, hook: 0, hold: 0, ret50: 0 };
    for (const r of rows) {
      t.spesa += r.spesa; t.impr += r.impression; t.clickLink += r.clickLink;
      t.lpv += r.lpv; t.atc += r.atc; t.valore += r.valore;
      t.hook += r.hookRate * r.impression; t.hold += r.holdRate * r.impression; t.ret50 += r.ritenzione50 * r.impression;
    }
    return {
      spesa: mean(rows.map((r) => r.spesa)),
      impr: mean(rows.map((r) => r.impression)),
      ctrLink: ratio(t.clickLink, t.impr, 100),
      lpvRate: ratio(t.lpv, t.clickLink, 100),
      costoLpv: ratio(t.spesa, t.lpv),
      atc: mean(rows.map((r) => r.atc)),
      costoAtc: ratio(t.spesa, t.atc),
      hook: ratio(t.hook, t.impr),
      hold: ratio(t.hold, t.impr),
      ret50: ratio(t.ret50, t.impr),
      acquisti: mean(rows.map((r) => r.acquisti)),
      roas: t.valore > 0 ? ratio(t.valore, t.spesa) : null,
    };
  }, [rows]);

  const th = { sort, onSort: toggle };
  const dash = "—";
  const fmt = (v: number | null, f: (n: number) => string) => (v == null ? dash : f(v));
  const colCount = video ? 15 : 12;

  return (
    <Card>
      <CardHeader title={`${label} · Dettaglio inserzioni`}
        right={sort ? <Pill active={false} onClick={reset}>Ordine predefinito</Pill> : undefined} />
      <div ref={wrapRef} style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead><tr>
            <SortTh label="Creatività" sortKey="nome" {...th} />
            <SortTh label="Soggetto" sortKey="soggetto" {...th} />
            <SortTh label="Stato" sortKey="stato" {...th} />
            <SortTh label="Spesa" sortKey="spesa" align="right" {...th} />
            <SortTh label="Impr." sortKey="impr" align="right" {...th} />
            <SortTh label="CTR link" sortKey="ctrLink" align="right" {...th} />
            <SortTh label="LPV rate" sortKey="lpvRate" align="right" title="Landing page view ÷ click sul link" {...th} />
            <SortTh label="Costo/LPV" sortKey="costoLpv" align="right" first="asc" {...th} />
            <SortTh label="ATC" sortKey="atc" align="right" {...th} />
            <SortTh label="Costo/ATC" sortKey="costoAtc" align="right" first="asc" {...th} />
            {video && <SortTh label="Hook" sortKey="hook" align="right" {...th} />}
            {video && <SortTh label="Hold" sortKey="hold" align="right" {...th} />}
            {video && <SortTh label="Ritenz. 50%" sortKey="ret50" align="right" {...th} />}
            <SortTh label="Acquisti" sortKey="acquisti" align="right" {...th} />
            <SortTh label="ROAS" sortKey="roas" align="right" {...th} />
          </tr></thead>
          <tbody>
            <tr style={avgRowStyle(palette)}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700, whiteSpace: "nowrap" }} title={AVG_TITLE}>
                Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(rows.length)} creatività</span>
              </td>
              <td style={ts.tdBase} />
              <td style={ts.tdBase} />
              <AvgTd ts={ts}>{fmt(avg.spesa, eur)}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.impr, integer)}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.ctrLink, (v) => pctStr(v, 2))}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.lpvRate, (v) => pctStr(v, 1))}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.costoLpv, eur)}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.atc, (v) => num(v, 1))}</AvgTd>
              <AvgTd ts={ts} strong>{fmt(avg.costoAtc, eur)}</AvgTd>
              {video && <AvgTd ts={ts}>{fmt(avg.hook, (v) => pctStr(v, 1))}</AvgTd>}
              {video && <AvgTd ts={ts}>{fmt(avg.hold, (v) => pctStr(v, 1))}</AvgTd>}
              {video && <AvgTd ts={ts}>{fmt(avg.ret50, (v) => pctStr(v, 1))}</AvgTd>}
              <AvgTd ts={ts}>{fmt(avg.acquisti, (v) => num(v, 1))}</AvgTd>
              <AvgTd ts={ts} strong>{fmt(avg.roas, (v) => num(v, 2))}</AvgTd>
            </tr>

            {sorted.map((r) => {
              const active = r.stato === "ACTIVE";
              const key = creativeKey(r.nome, r.formato);
              const isOpen = openKey === key;
              const toggleOpen = () => setOpenKey(isOpen ? null : key);
              return (
                <Fragment key={key}>
                  <tr
                    onClick={toggleOpen}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOpen(); } }}
                    tabIndex={0}
                    aria-expanded={isOpen}
                    style={{ cursor: "pointer", background: isOpen ? palette.buttonHover : undefined }}
                  >
                    <td style={{ ...ts.tdBase, maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={r.nome}>
                      <span style={{ display: "inline-block", width: 12, color: palette.textDim, fontSize: 9 }}>{isOpen ? "▾" : "▸"}</span>
                      {r.nome}
                    </td>
                    <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textMuted }}>{r.soggetto}</td>
                    <td style={{ ...ts.tdBase, fontSize: 10 }}>
                      <span style={{ padding: "1px 7px", borderRadius: 20, background: active ? "rgba(34,197,94,0.15)" : palette.divider, color: active ? POSITIVE : palette.textDim, fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{statoLabel(r.stato)}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(r.spesa)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.impression)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctrLink, 2)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.clickLink > 0 ? pctStr(r.lpvRate, 1) : dash}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.lpv > 0 ? eur(r.costoLpv) : dash}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.atc)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{r.atc > 0 ? eur(r.costoAtc) : dash}</td>
                    {video && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.hookRate, 1)}</td>}
                    {video && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.holdRate, 1)}</td>}
                    {video && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ritenzione50, 1)}</td>}
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.acquisti > 0 ? 600 : 400 }}>{integer(r.acquisti)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.roas >= AD_CFG.ROAS_GOOD ? POSITIVE : r.roas > 0 && r.roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 700 }}>{r.valore > 0 ? num(r.roas, 2) : dash}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={colCount} style={{ padding: 0, borderBottom: `1px solid ${palette.cardBorder}`, background: palette.divider }}>
                        <div style={{ position: "sticky", left: 0, width: wrapWidth || "100%", boxSizing: "border-box", padding: "14px 16px 16px" }}>
                          <CreativeWindowDetail nome={r.nome} formato={r.formato} windows={windows} highlight={win} benchmark={benchmark} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
