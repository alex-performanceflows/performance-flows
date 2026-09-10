"use client";

import { useMemo, useState } from "react";
import {
  MomiData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, tableStyles,
  sumInRange, gadsSignupsInRange, COMPARE_LABEL,
} from "./shared";
import { ACCENT, POSITIVE, NEGATIVE, isSignupAction } from "../config";

type SubTab = "meta" | "google";

export function AdvertisingTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const [sub, setSub] = useState<SubTab>("meta");
  const { range, compareRange, compare } = useDateRange();

  const spesaMeta = sumInRange(data.meta?.campaigns_daily, range, 4);
  const spesaGads = sumInRange(data.gads_daily, range, 3);
  const spesaTot = spesaMeta + spesaGads;
  const regMeta = sumInRange(data.meta?.campaigns_daily, range, 8);
  const regGads = gadsSignupsInRange(data, range);
  const regAttr = regMeta + regGads;
  const cpr = regAttr > 0 ? spesaTot / regAttr : 0;

  const spesaMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 4) : null;
  const spesaGadsPrev = compareRange ? sumInRange(data.gads_daily, compareRange, 3) : null;
  const spesaTotPrev = spesaMetaPrev != null || spesaGadsPrev != null ? (spesaMetaPrev ?? 0) + (spesaGadsPrev ?? 0) : null;
  const regMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 8) : null;
  const regGadsPrev = compareRange ? gadsSignupsInRange(data, compareRange) : null;
  const regAttrPrev = regMetaPrev != null || regGadsPrev != null ? (regMetaPrev ?? 0) + (regGadsPrev ?? 0) : null;
  const cprPrev = regAttrPrev && regAttrPrev > 0 && spesaTotPrev != null ? spesaTotPrev / regAttrPrev : null;

  const metaShare = spesaTot > 0 ? (spesaMeta / spesaTot) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Advertising
      </SectionTitle>

      {/* Blended */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Spesa totale" value={eur0(spesaTot)} delta={spesaTotPrev != null ? calcDelta(spesaTot, spesaTotPrev) : null}
          info={`Meta ${eur0(spesaMeta)} + Google ${eur0(spesaGads)}`} accent={ACCENT} />
        <KpiTile label="Ripartizione Meta" value={pctStr(metaShare, 1)}
          info={`Meta ${eur0(spesaMeta)} · Google ${eur0(spesaGads)}`} />
        <KpiTile label="Registrazioni attribuite" value={integer(regAttr)} delta={regAttrPrev != null ? calcDelta(regAttr, regAttrPrev) : null}
          info={`Meta ${integer(regMeta)} + Google ${integer(regGads)}`} />
        <KpiTile label="CPR blended" value={regAttr > 0 ? eur(cpr) : "—"} delta={cprPrev != null ? invertDeltaColor(calcDelta(cpr, cprPrev)) : null}
          info="Spesa totale ÷ registrazioni attribuite. Delta invertito." accent={ACCENT} />
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

// ═══ META ═════════════════════════════════════════════════════════

function MetaView({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const ts = tableStyles(palette);

  // 3 card obiettivo (aggregato dal campaigns_daily sul range)
  const cards = useMemo(() => computeMetaObjCards(data, range, compareRange), [data, range, compareRange]);

  // Tabella campagne aggregata sul range
  const campaigns = useMemo(() => {
    const byName = new Map<string, { name: string; obiettivo: string; piattaforma: string; spesa: number; imp: number; click: number; install: number; reg: number; visite: number }>();
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const name = String(r[1]); const obiettivo = String(r[2]); const plat = String(r[3]);
      const cur = byName.get(name);
      const spesa = Number(r[4]) || 0, imp = Number(r[5]) || 0, click = Number(r[6]) || 0;
      const install = Number(r[7]) || 0, reg = Number(r[8]) || 0, vis = Number(r[9]) || 0;
      if (cur) { cur.spesa += spesa; cur.imp += imp; cur.click += click; cur.install += install; cur.reg += reg; cur.visite += vis; }
      else byName.set(name, { name, obiettivo, piattaforma: plat, spesa, imp, click, install, reg, visite: vis });
    }
    return [...byName.values()].sort((a, b) => b.spesa - a.spesa);
  }, [data.meta?.campaigns_daily, range]);

  // Adset w30 raggruppate per campagna
  const adsetsByCampaign = useMemo(() => {
    const map = new Map<string, (string | number)[][]>();
    for (const r of data.meta?.adsets_w30 ?? []) {
      const camp = String(r[1]);
      const arr = map.get(camp) ?? [];
      arr.push(r); map.set(camp, arr);
    }
    return map;
  }, [data.meta?.adsets_w30]);

  const alerts = useMemo(() => {
    const out: string[] = [];
    for (const r of data.meta?.adsets_w30 ?? []) {
      const spesa = Number(r[5]) || 0;
      const freq = Number(r[8]) || 0;
      if (spesa >= 100 && freq >= 3.5) out.push(String(r[0]));
    }
    return out;
  }, [data.meta?.adsets_w30]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 3 card obiettivo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {cards.map((c) => <ObiettivoCard key={c.key} c={c} />)}
      </div>

      {/* Tabella campagne */}
      <Card>
        <CardHeader title={`Campagne Meta · ${range.days}g`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Campagna</th>
                <th style={ts.th}>Obiettivo</th>
                <th style={ts.th}>Piatt.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Install</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CPI</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Reg.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CPR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Visite prof.</th>
              </tr></thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  const cpi = c.install > 0 ? c.spesa / c.install : 0;
                  const cpr = c.reg > 0 ? c.spesa / c.reg : 0;
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={c.name}>{c.name}</td>
                      <td style={ts.tdBase}>{c.obiettivo}</td>
                      <td style={{ ...ts.tdBase, fontSize: 11 }}>{c.piattaforma}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.spesa)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.install)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.install > 0 ? eur(cpi) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.reg > 0 ? 600 : 400 }}>{integer(c.reg)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: cpr > 0 && cpr < 2 ? POSITIVE : cpr > 3.5 ? NEGATIVE : ts.tdBase.color, fontWeight: 600 }}>{c.reg > 0 ? eur(cpr) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.visite)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Ad set w30 */}
      <Card>
        <CardHeader title="Ad set (30 giorni fissi)"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>gli ad set non variano col range: sempre 30g</span>} />
        {adsetsByCampaign.size === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Ad set</th>
                <th style={ts.th}>Campagna</th>
                <th style={ts.th}>Stato</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Freq</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Install</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Reg.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CPR</th>
              </tr></thead>
              <tbody>
                {[...adsetsByCampaign.entries()].map(([camp, rows]) => (
                  <>
                    <tr key={camp} style={{ background: palette.divider }}>
                      <td colSpan={10} style={{ ...ts.tdBase, fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{camp}</td>
                    </tr>
                    {rows.map((r, i) => {
                      const stato = String(r[4]);
                      const spesa = Number(r[5]) || 0;
                      const imp = Number(r[6]) || 0;
                      const freq = Number(r[8]) || 0;
                      const ctr = Number(r[9]) || 0;
                      const install = Number(r[10]) || 0;
                      const reg = Number(r[11]) || 0;
                      const cpr = Number(r[12]) || 0;
                      return (
                        <tr key={camp + i}>
                          <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontSize: 12 }}>{String(r[0])}</td>
                          <td style={{ ...ts.tdBase, fontSize: 10, color: palette.textDim }}>—</td>
                          <td style={{ ...ts.tdBase, fontSize: 10 }}>
                            <span style={{ padding: "1px 7px", borderRadius: 20, background: stato === "ACTIVE" ? `${POSITIVE}25` : palette.divider, color: stato === "ACTIVE" ? POSITIVE : palette.textDim, fontWeight: 700 }}>{stato}</span>
                          </td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(spesa)}</td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(imp)}</td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight, color: freq >= 3.5 ? "#f59e0b" : ts.tdBase.color, fontWeight: freq >= 3.5 ? 600 : 400 }}>{num(freq, 2)}</td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(install)}</td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: reg > 0 ? 600 : 400 }}>{integer(reg)}</td>
                          <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{cpr > 0 ? eur(cpr) : "—"}</td>
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {alerts.length > 0 && (
          <div style={{ marginTop: 12, padding: "0.7rem 0.9rem", background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.30)", borderRadius: 8, fontSize: 12, color: palette.textMuted, lineHeight: 1.45 }}>
            {alerts.map((a) => (
              <div key={a} style={{ marginBottom: 3 }}><strong style={{ color: "#f59e0b" }}>{a}:</strong> frequenza alta con spesa sostenuta — la saturazione è dell&apos;audience, non della creatività.</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

type ObjCard = {
  key: string; label: string; spesa: number; risultato: number; risultatoLabel: string;
  costo: number; costoLabel: string; install: number; freq: number | null;
  delta: { spesa: number | null; risultato: number | null; costo: number | null };
};

function computeMetaObjCards(data: MomiData, range: { start: string; end: string }, compareRange: { start: string; end: string } | null): ObjCard[] {
  function agg(r: { start: string; end: string }) {
    const g: Record<string, { spesa: number; reg: number; install: number; vis: number; freqSum: number; freqN: number }> = {
      "iOS":     { spesa: 0, reg: 0, install: 0, vis: 0, freqSum: 0, freqN: 0 },
      "Android": { spesa: 0, reg: 0, install: 0, vis: 0, freqSum: 0, freqN: 0 },
      "Fan":     { spesa: 0, reg: 0, install: 0, vis: 0, freqSum: 0, freqN: 0 },
    };
    for (const row of data.meta?.campaigns_daily ?? []) {
      const d = String(row[0]); if (d < r.start || d > r.end) continue;
      const obiettivo = String(row[2]); const plat = String(row[3]);
      const spesa = Number(row[4]) || 0;
      const install = Number(row[7]) || 0;
      const reg = Number(row[8]) || 0;
      const vis = Number(row[9]) || 0;
      const k = obiettivo === "Fan Acquisition" ? "Fan" : plat === "iOS" ? "iOS" : plat === "Android" ? "Android" : null;
      if (!k) continue;
      g[k].spesa += spesa; g[k].install += install; g[k].reg += reg; g[k].vis += vis;
    }
    // Frequenza dalle campaigns w30 (approssimazione: prendi frequenza dalla riga campaigns w30 se disponibile)
    return g;
  }
  const cur = agg(range);
  const prev = compareRange ? agg(compareRange) : null;

  // Frequenza da meta.campaigns.w30 (dato fisso 30g)
  const freqByKey: Record<string, number> = {};
  for (const r of data.meta?.campaigns?.w30 ?? []) {
    const obiettivo = String(r[1]); const plat = String(r[2]);
    const k = obiettivo === "Fan Acquisition" ? "Fan" : plat === "iOS" ? "iOS" : plat === "Android" ? "Android" : null;
    if (!k) continue;
    const freq = Number(r[6]) || 0;
    // media pesata sarebbe meglio ma qui prendiamo la più alta (peggio-caso, utile all'attenzione)
    if ((freqByKey[k] ?? 0) < freq) freqByKey[k] = freq;
  }

  function build(k: string, label: string): ObjCard {
    const c = cur[k]; const p = prev?.[k];
    const isFan = k === "Fan";
    const risultato = isFan ? c.vis : c.reg;
    const risultatoPrev = p ? (isFan ? p.vis : p.reg) : null;
    const costo = risultato > 0 ? c.spesa / risultato : 0;
    const costoPrev = risultatoPrev != null && risultatoPrev > 0 && p ? p.spesa / risultatoPrev : null;
    return {
      key: k, label,
      spesa: c.spesa, risultato,
      risultatoLabel: isFan ? "Visite profilo" : "Registrazioni",
      costo, costoLabel: isFan ? "CPV" : "CPR",
      install: c.install,
      freq: freqByKey[k] ?? null,
      delta: {
        spesa: p ? ((c.spesa - p.spesa) / (p.spesa || 1)) * 100 : null,
        risultato: risultatoPrev != null ? ((risultato - risultatoPrev) / (risultatoPrev || 1)) * 100 : null,
        costo: costoPrev != null ? ((costo - costoPrev) / (costoPrev || 1)) * 100 : null,
      },
    };
  }
  return [build("iOS", "App Install iOS"), build("Android", "App Install Android"), build("Fan", "Fan Acquisition")];
}

function ObiettivoCard({ c }: { c: ObjCard }) {
  const { palette } = useTheme();
  const dArrow = (d: number | null, inverted?: boolean) => {
    if (d == null) return { text: "—", color: palette.textDim };
    const isGood = inverted ? d < 0 : d > 0;
    return {
      text: `${d > 0 ? "+" : ""}${num(d, 1)}%`,
      color: Math.abs(d) < 1 ? palette.textDim : isGood ? POSITIVE : NEGATIVE,
    };
  };
  const dSpesa = dArrow(c.delta.spesa);
  const dRes = dArrow(c.delta.risultato);
  const dCosto = dArrow(c.delta.costo, true);
  return (
    <div style={{
      background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 14,
      padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: 8,
      borderLeft: `3px solid ${ACCENT}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.05em", textTransform: "uppercase" }}>{c.label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>Spesa</span>
        <span style={{ textAlign: "right", color: palette.text, fontWeight: 600 }}>{eur0(c.spesa)} <span style={{ fontSize: 10, color: dSpesa.color }}>{dSpesa.text}</span></span>
        <span style={{ color: palette.textDim }}>{c.risultatoLabel}</span>
        <span style={{ textAlign: "right", color: palette.text, fontWeight: 600 }}>{integer(c.risultato)} <span style={{ fontSize: 10, color: dRes.color }}>{dRes.text}</span></span>
        <span style={{ color: palette.textDim }}>{c.costoLabel}</span>
        <span style={{ textAlign: "right", color: palette.text, fontWeight: 600 }}>{c.risultato > 0 ? eur(c.costo) : "—"} <span style={{ fontSize: 10, color: dCosto.color }}>{dCosto.text}</span></span>
        <span style={{ color: palette.textDim }}>Install</span>
        <span style={{ textAlign: "right", color: palette.text }}>{integer(c.install)}</span>
        <span style={{ color: palette.textDim }}>Freq. max (w30)</span>
        <span style={{ textAlign: "right", color: c.freq != null && c.freq >= 3 ? "#f59e0b" : palette.text }}>{c.freq != null ? num(c.freq, 2) : "—"}</span>
      </div>
    </div>
  );
}

// ═══ GOOGLE ═══════════════════════════════════════════════════════

function GoogleView({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  const campaigns = useMemo(() => {
    const byName = new Map<string, { name: string; tipo: string; costo: number; imp: number; click: number; conv: number }>();
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const name = String(r[1]); const tipo = String(r[2]);
      const cur = byName.get(name);
      const costo = Number(r[3]) || 0, imp = Number(r[4]) || 0, click = Number(r[5]) || 0, conv = Number(r[6]) || 0;
      if (cur) { cur.costo += costo; cur.imp += imp; cur.click += click; cur.conv += conv; }
      else byName.set(name, { name, tipo, costo, imp, click, conv });
    }
    return [...byName.values()].sort((a, b) => b.costo - a.costo);
  }, [data.gads_daily, range]);

  const conversioni = useMemo(() => {
    const byKey = new Map<string, { azione: string; categoria: string; conv: number; convTot: number }>();
    for (const r of data.gads_conv_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const az = String(r[2]); const cat = String(r[3]);
      const key = az + "|" + cat;
      const cur = byKey.get(key);
      const conv = Number(r[4]) || 0, convTot = Number(r[5]) || 0;
      if (cur) { cur.conv += conv; cur.convTot += convTot; }
      else byKey.set(key, { azione: az, categoria: cat, conv, convTot });
    }
    return [...byKey.values()].sort((a, b) => b.convTot - a.convTot);
  }, [data.gads_conv_daily, range]);

  function tipoBadgeLabel(tipo: string): string {
    if (tipo === "MULTI_CHANNEL") return "APP";
    if (tipo === "VIDEO") return "VIDEO";
    if (tipo === "SEARCH") return "SEARCH";
    return tipo;
  }

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
                <th style={{ ...ts.th, ...ts.thRight }}>Conv.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo/Conv.</th>
              </tr></thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  const cpc = c.conv > 0 ? c.costo / c.conv : 0;
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={c.name}>{c.name}</td>
                      <td style={ts.tdBase}>
                        <span style={{ padding: "1px 7px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>{tipoBadgeLabel(c.tipo)}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.costo)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.conv > 0 ? 600 : 400 }}>{num(c.conv, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.conv > 0 ? eur(cpc) : "—"}</td>
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
        {conversioni.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Azione</th>
                <th style={ts.th}>Categoria</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conv.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conv. totali</th>
              </tr></thead>
              <tbody>
                {conversioni.map((c, i) => {
                  const isReg = isSignupAction(c.azione);
                  return (
                    <tr key={i} style={{ background: isReg ? `${POSITIVE}12` : undefined }}>
                      <td style={{ ...ts.tdBase, color: isReg ? POSITIVE : palette.text, fontWeight: isReg ? 600 : 500 }}>{c.azione}</td>
                      <td style={ts.tdBase}>
                        <span style={{ padding: "1px 7px", borderRadius: 20, background: isReg ? `${POSITIVE}25` : palette.divider, color: isReg ? POSITIVE : palette.textDim, fontSize: 10, fontWeight: 700 }}>{c.categoria}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(c.conv, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(c.convTot)}</td>
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
