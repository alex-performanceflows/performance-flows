"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line, Bar,
} from "recharts";
import {
  MomiData, useDateRange, useNav, useTheme,
  calcDelta, invertDeltaColor, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  sumInRange, gadsSignupsInRange, ga4SignupsInRange,
  COMPARE_LABEL, isRangeBeforeFirstData,
} from "./shared";
import { ACCENT, CREAM, CHART_PALETTE, isSignupAction } from "../config";

export function PanoramicaTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const { setTab } = useNav();

  const ga4First = data.health?.ga4_first_date ?? data.ga4?.first_date;
  const rangeTooEarly = isRangeBeforeFirstData(range, ga4First);

  // ─── Aggregati sul range ────────────────────────────────────────

  const spesaMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 4), [data.meta?.campaigns_daily, range]);
  const spesaMetaPrev = useMemo(() => compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 4) : null, [data.meta?.campaigns_daily, compareRange]);
  const spesaGads = useMemo(() => sumInRange(data.gads_daily, range, 3), [data.gads_daily, range]);
  const spesaGadsPrev = useMemo(() => compareRange ? sumInRange(data.gads_daily, compareRange, 3) : null, [data.gads_daily, compareRange]);
  const spesaTot = spesaMeta + spesaGads;
  const spesaTotPrev = spesaMetaPrev != null || spesaGadsPrev != null ? (spesaMetaPrev ?? 0) + (spesaGadsPrev ?? 0) : null;

  const regMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 8), [data.meta?.campaigns_daily, range]);
  const regMetaPrev = useMemo(() => compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 8) : null, [data.meta?.campaigns_daily, compareRange]);
  const regGads = useMemo(() => gadsSignupsInRange(data, range), [data, range]);
  const regGadsPrev = useMemo(() => compareRange ? gadsSignupsInRange(data, compareRange) : null, [data, compareRange]);
  const regAttr = regMeta + regGads;
  const regAttrPrev = regMetaPrev != null || regGadsPrev != null ? (regMetaPrev ?? 0) + (regGadsPrev ?? 0) : null;

  const regGa4 = useMemo(() => ga4SignupsInRange(data, range), [data, range]);
  const regGa4Prev = useMemo(() => compareRange ? ga4SignupsInRange(data, compareRange) : null, [data, compareRange]);

  const cprBlended = regAttr > 0 ? spesaTot / regAttr : 0;
  const cprBlendedPrev = regAttrPrev && regAttrPrev > 0 && spesaTotPrev != null ? spesaTotPrev / regAttrPrev : null;

  const coverage = regGa4 > 0 ? (regAttr / regGa4) * 100 : 0;
  const coveragePrev = regGa4Prev && regGa4Prev > 0 && regAttrPrev != null ? (regAttrPrev / regGa4Prev) * 100 : null;

  // Install totali: Meta install + Google MULTI_CHANNEL conv (conv col 6 in gads_daily)
  const installMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 7), [data.meta?.campaigns_daily, range]);
  const installMetaPrev = useMemo(() => compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 7) : null, [data.meta?.campaigns_daily, compareRange]);
  const installGads = useMemo(() => {
    let s = 0;
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      if (String(r[2]) === "MULTI_CHANNEL") s += Number(r[6]) || 0;
    }
    return s;
  }, [data.gads_daily, range]);
  const installGadsPrev = useMemo(() => {
    if (!compareRange) return null;
    let s = 0;
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < compareRange.start || d > compareRange.end) continue;
      if (String(r[2]) === "MULTI_CHANNEL") s += Number(r[6]) || 0;
    }
    return s;
  }, [data.gads_daily, compareRange]);
  const installTot = installMeta + installGads;
  const installTotPrev = installMetaPrev != null || installGadsPrev != null ? (installMetaPrev ?? 0) + (installGadsPrev ?? 0) : null;
  const cpi = installTot > 0 ? spesaTot / installTot : 0;
  const cpiPrev = installTotPrev && installTotPrev > 0 && spesaTotPrev != null ? spesaTotPrev / installTotPrev : null;

  const sessCur = sumInRange(data.ga4?.daily, range, 1);
  const sessPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;
  const clickOrg = sumInRange(data.gsc?.daily, range, 1);
  const clickOrgPrev = compareRange ? sumInRange(data.gsc?.daily, compareRange, 1) : null;

  const freqW30 = data.health?.account_frequency_w30 ?? null;

  // ─── Chart data (giornaliero) ───────────────────────────────────

  const chart = useMemo(() => {
    // Serie per data: metaIos, metaAndroid, metaFan, google, regAttr, regGa4
    const dates = new Set<string>();
    const daily = new Map<string, { metaIos: number; metaAndroid: number; metaFan: number; google: number; regAttr: number; regGa4: number }>();
    const get = (d: string) => {
      dates.add(d);
      const cur = daily.get(d) ?? { metaIos: 0, metaAndroid: 0, metaFan: 0, google: 0, regAttr: 0, regGa4: 0 };
      daily.set(d, cur);
      return cur;
    };
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const obiettivo = String(r[2]);
      const plat = String(r[3]);
      const spesa = Number(r[4]) || 0;
      const reg = Number(r[8]) || 0;
      const cur = get(d);
      if (obiettivo === "Fan Acquisition") cur.metaFan += spesa;
      else if (plat === "iOS") cur.metaIos += spesa;
      else if (plat === "Android") cur.metaAndroid += spesa;
      cur.regAttr += reg;
    }
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      get(d).google += Number(r[3]) || 0;
    }
    for (const r of data.gads_conv_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      if (isSignupAction(String(r[2]))) get(d).regAttr += Number(r[5]) || 0;
    }
    for (const r of data.ga4?.events_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      if (String(r[1]) === "sign_up") get(d).regGa4 += Number(r[3]) || 0;
    }
    return [...dates].sort().map((d) => {
      const r = daily.get(d)!;
      return { date: d, label: fmtDate(d), ...r };
    });
  }, [data, range]);

  // ─── Ripartizione spesa per obiettivo (fascia orizzontale) ──────

  const perObj = useMemo(() => {
    const groups: Record<string, { spesa: number; risultato: number; label: string; costoLabel: string; color: string }> = {
      "iOS": { spesa: 0, risultato: 0, label: "App Install iOS", costoLabel: "CPR", color: CHART_PALETTE[0] },
      "Android": { spesa: 0, risultato: 0, label: "App Install Android", costoLabel: "CPR", color: CHART_PALETTE[2] },
      "Fan": { spesa: 0, risultato: 0, label: "Fan Acquisition", costoLabel: "CPV", color: CHART_PALETTE[3] },
      "Google": { spesa: 0, risultato: 0, label: "Google Ads", costoLabel: "CPR", color: CHART_PALETTE[6] },
    };
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const obiettivo = String(r[2]);
      const plat = String(r[3]);
      const spesa = Number(r[4]) || 0;
      const reg = Number(r[8]) || 0;
      const vis = Number(r[9]) || 0;
      if (obiettivo === "Fan Acquisition") { groups.Fan.spesa += spesa; groups.Fan.risultato += vis; }
      else if (plat === "iOS") { groups.iOS.spesa += spesa; groups.iOS.risultato += reg; }
      else if (plat === "Android") { groups.Android.spesa += spesa; groups.Android.risultato += reg; }
    }
    groups.Google.spesa = spesaGads;
    groups.Google.risultato = regGads;
    return Object.entries(groups).map(([key, g]) => ({
      key, ...g,
      quota: spesaTot > 0 ? (g.spesa / spesaTot) * 100 : 0,
      costo: g.risultato > 0 ? g.spesa / g.risultato : 0,
    })).filter((g) => g.spesa > 0).sort((a, b) => b.spesa - a.spesa);
  }, [data, range, spesaTot, spesaGads, regGads]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Panoramica
      </SectionTitle>

      {rangeTooEarly && ga4First && (
        <div style={{
          background: `${ACCENT}15`, border: `1px solid ${ACCENT}35`,
          padding: "0.7rem 1rem", borderRadius: 10, fontSize: 12, color: palette.textMuted,
        }}>
          <strong style={{ color: ACCENT }}>Copertura parziale:</strong> il range parte prima del {fmtDate(ga4First)}, ossia il primo giorno con dati GA4.
        </div>
      )}

      {/* Riga KPI 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Spesa totale" value={eur0(spesaTot)} delta={spesaTotPrev != null ? calcDelta(spesaTot, spesaTotPrev) : null}
          info={`Meta ${eur0(spesaMeta)} + Google ${eur0(spesaGads)}`} accent={ACCENT} onClick={() => setTab("advertising")} />
        <KpiTile label="Registrazioni attribuite" value={integer(regAttr)} delta={regAttrPrev != null ? calcDelta(regAttr, regAttrPrev) : null}
          info={`Meta ${integer(regMeta)} + Google ${integer(regGads)}`} onClick={() => setTab("advertising")} />
        <KpiTile label="CPR blended" value={regAttr > 0 ? eur(cprBlended) : "—"} delta={cprBlendedPrev != null ? invertDeltaColor(calcDelta(cprBlended, cprBlendedPrev)) : null}
          info="Spesa totale ÷ registrazioni attribuite. Delta invertito: scendere è positivo." accent={ACCENT} />
        <KpiTile label="Registrazioni GA4" value={integer(regGa4)} delta={regGa4Prev != null ? calcDelta(regGa4, regGa4Prev) : null}
          info="Totale reale — evento sign_up da GA4 su tutte le piattaforme (web / iOS / Android)" />
        <KpiTile label="Copertura attribuzione" value={regGa4 > 0 ? pctStr(coverage, 1) : "—"} delta={coveragePrev != null ? calcDelta(coverage, coveragePrev) : null}
          info="Registrazioni attribuite ÷ registrazioni GA4. Sotto 70% c'è tracking mancante o traffico molto organico." />
      </div>

      {/* Riga KPI 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Install totali" value={integer(installTot)} delta={installTotPrev != null ? calcDelta(installTot, installTotPrev) : null}
          info={`Meta ${integer(installMeta)} + Google ${integer(installGads)}`} />
        <KpiTile label="CPI blended" value={installTot > 0 ? eur(cpi) : "—"} delta={cpiPrev != null ? invertDeltaColor(calcDelta(cpi, cpiPrev)) : null}
          info="Spesa totale ÷ install. Delta invertito: scendere è positivo." />
        <KpiTile label="Sessioni GA4" value={integer(sessCur)} delta={sessPrev != null ? calcDelta(sessCur, sessPrev) : null}
          info="Sessioni sul sito sul range" onClick={() => setTab("traffico")} />
        <KpiTile label="Click organici" value={integer(clickOrg)} delta={clickOrgPrev != null ? calcDelta(clickOrg, clickOrgPrev) : null}
          info="Click da Google organico (Search Console). Ritardo ~3g." onClick={() => setTab("seo")} />
        <KpiTile label="Frequenza account Meta" value={freqW30 != null ? num(freqW30, 2) : "—"}
          info="Frequenza media dell'account su 30 giorni (dato fisso, non varia col range). Sopra 3 iniziare ad allargare il pubblico." />
      </div>

      {/* Chart: spesa stacked + reg attribuite + reg GA4 */}
      <Card>
        <CardHeader title={`Spesa per fonte e registrazioni · ${range.days} giorni`}
          right={<span style={{ fontSize: 11, color: palette.textDim }}>barre = spesa · linee = registrazioni</span>} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <ComposedChart data={chart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left" tick={{ fill: ACCENT, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={60} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: CREAM, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => {
                    const s = String(n);
                    if (s.startsWith("Reg")) return [integer(Number(v ?? 0)), s];
                    return [eur(Number(v ?? 0)), s];
                  }} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                <Bar yAxisId="left" dataKey="metaIos"     stackId="spesa" name="Meta iOS"     fill={CHART_PALETTE[0]} />
                <Bar yAxisId="left" dataKey="metaAndroid" stackId="spesa" name="Meta Android" fill={CHART_PALETTE[2]} />
                <Bar yAxisId="left" dataKey="metaFan"     stackId="spesa" name="Meta Fan"     fill={CHART_PALETTE[3]} />
                <Bar yAxisId="left" dataKey="google"      stackId="spesa" name="Google"       fill={CHART_PALETTE[6]} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="regAttr" name="Reg. attribuite" stroke={CREAM} strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="regGa4" name="Reg. GA4 (totale reale)" stroke={CREAM} strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Ripartizione obiettivi */}
      <Card>
        <CardHeader title="Ripartizione spesa per obiettivo · range corrente" />
        {perObj.length === 0 ? <EmptyState /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {perObj.map((o) => (
              <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  minWidth: 170, fontSize: 12, color: palette.text, fontWeight: 500,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{o.label}</span>
                <div style={{
                  flex: 1, height: 22, background: palette.divider,
                  borderRadius: 4, overflow: "hidden", position: "relative",
                }}>
                  <div style={{ width: `${o.quota}%`, height: "100%", background: o.color, transition: "width 0.3s" }} />
                </div>
                <span style={{
                  minWidth: 170, fontSize: 11, color: palette.textMuted, textAlign: "right", fontVariantNumeric: "tabular-nums",
                }}>
                  {eur0(o.spesa)} · {num(o.quota, 1)}% · {o.costoLabel} {o.risultato > 0 ? eur(o.costo) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
