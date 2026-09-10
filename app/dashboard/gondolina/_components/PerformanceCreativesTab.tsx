"use client";

import { useMemo, useState } from "react";
import {
  GondolinaData, useTheme,
  eur, eur0, integer, num, pctStr,
  Card, CardHeader, KpiTile, EmptyState, Pill, tableStyles,
  ACCENT, GOLD, POSITIVE, NEGATIVE,
} from "./shared";
import { aggregateRawByNameFormato, type CreativeMetricsRaw } from "./AdvertisingTab";

type FamilyKey = "video" | "carosello" | "statico";
type Preset = "w7" | "w30" | "w90";

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
  const [preset, setPreset] = useState<Preset>("w30");
  const [family, setFamily] = useState<FamilyKey>("video");
  const [includePaused, setIncludePaused] = useState(false);

  const rows = data.meta?.creatives?.[preset]?.rows ?? [];
  const label = data.meta?.creatives?.[preset]?.label ?? preset;

  const allAgg = useMemo(() => aggregateRawByNameFormato(rows), [rows]);

  const byFamily = useMemo(() => {
    const g: Record<FamilyKey, CreativeMetricsRaw[]> = { video: [], carosello: [], statico: [] };
    for (const c of allAgg) {
      const fam = classifyFamily(c.formato);
      if (!fam) continue;
      if (!includePaused && c.stato !== "ACTIVE") continue;
      g[fam].push(c);
    }
    return g;
  }, [allAgg, includePaused]);

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
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          Deep dive sulla performance delle creatività Meta, distinta per famiglia. Solo i video espongono hook rate, hold rate e ritenzione.
        </p>
      </div>

      {/* Preset finestra + toggle paused */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: palette.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>Finestra:</span>
        <Pill active={preset === "w7"} onClick={() => setPreset("w7")}>7g</Pill>
        <Pill active={preset === "w30"} onClick={() => setPreset("w30")}>30g</Pill>
        <Pill active={preset === "w90"} onClick={() => setPreset("w90")}>90g</Pill>
        <span style={{ fontSize: 11, color: palette.textDim }}>· {label}</span>
        <div style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
          <input type="checkbox" checked={includePaused} onChange={(e) => setIncludePaused(e.target.checked)} style={{ accentColor: ACCENT }} />
          <span style={{ color: palette.textMuted }}>Includi in pausa</span>
        </label>
      </div>

      {/* Card famiglia */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {(Object.keys(FAMILY_META) as FamilyKey[]).map((k) => {
          const m = FAMILY_META[k];
          const active = family === k;
          const t = totals[k];
          return (
            <button key={k} onClick={() => setFamily(k)} style={{
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
      <FamilyDetail family={family} rows={currentRows} meta={currentMeta} palette={palette} />
    </div>
  );
}

function FamilyDetail({ family, rows, meta, palette }: {
  family: FamilyKey; rows: CreativeMetricsRaw[]; meta: typeof FAMILY_META[FamilyKey]; palette: import("./shared").Palette;
}) {
  const ts = tableStyles(palette);
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

      {/* Tabella dettaglio con colonne specifiche per famiglia */}
      <Card>
        <CardHeader title={`${meta.label} · Dettaglio inserzioni`} />
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <th style={ts.th}>Creatività</th>
              <th style={ts.th}>Soggetto</th>
              <th style={ts.th}>Stato</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Impr.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>CTR link</th>
              <th style={{ ...ts.th, ...ts.thRight }}>LPV rate</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Costo/LPV</th>
              <th style={{ ...ts.th, ...ts.thRight }}>ATC</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Costo/ATC</th>
              {family === "video" && <th style={{ ...ts.th, ...ts.thRight }}>Hook</th>}
              {family === "video" && <th style={{ ...ts.th, ...ts.thRight }}>Hold</th>}
              {family === "video" && <th style={{ ...ts.th, ...ts.thRight }}>Ritenz. 50%</th>}
              <th style={{ ...ts.th, ...ts.thRight }}>Acquisti</th>
              <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const active = r.stato === "ACTIVE";
                return (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={r.nome}>{r.nome}</td>
                    <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textMuted }}>{r.soggetto}</td>
                    <td style={{ ...ts.tdBase, fontSize: 10 }}>
                      <span style={{ padding: "1px 7px", borderRadius: 20, background: active ? "rgba(34,197,94,0.15)" : palette.divider, color: active ? POSITIVE : palette.textDim, fontWeight: 700, letterSpacing: "0.05em" }}>{r.stato}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(r.spesa)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.impression)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctrLink, 2)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.lpvRate, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.lpv > 0 ? eur(r.costoLpv) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.atc)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.atc > 0 ? eur(r.costoAtc) : "—"}</td>
                    {family === "video" && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.hookRate, 1)}</td>}
                    {family === "video" && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.holdRate, 1)}</td>}
                    {family === "video" && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ritenzione50, 1)}</td>}
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.acquisti > 0 ? 600 : 400 }}>{integer(r.acquisti)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.roas >= 2 ? POSITIVE : r.roas > 0 && r.roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 700 }}>{r.roas > 0 ? num(r.roas, 2) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
