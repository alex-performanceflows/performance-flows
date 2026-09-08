"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line, Bar,
} from "recharts";
import {
  CoorieData, useDateRange, useNav, useTheme,
  calcDelta, eur, eur0, integer, num,
  fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  ACCENT, SAND, CHART_PALETTE, COMPARE_LABEL,
  sumInRange, dailyInRange, groupSumInRange, isRangeBeforeFirstData,
} from "./shared";

const GA4_TOOLTIP = "Ricavi da GA4 ecommerce: sottostimati rispetto agli ordini reali finché il tracking non è completo.";

export function PanoramicaTab({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const { setTab } = useNav();

  const ga4First = data.health?.ga4_first_date ?? data.ga4?.first_date;
  const rangeTooEarly = isRangeBeforeFirstData(range, ga4First);

  // GA4 aggregates
  const sessCur = sumInRange(data.ga4?.daily, range, 1);
  const sessPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;
  const transCur = sumInRange(data.ga4?.daily, range, 3);
  const transPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 3) : null;
  const revCur = sumInRange(data.ga4?.daily, range, 4);
  const revPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 4) : null;
  const aovCur = transCur > 0 ? revCur / transCur : 0;
  const aovPrev = transPrev && transPrev > 0 ? (revPrev ?? 0) / transPrev : null;

  // ADV spesa (Meta + Google)
  const spesaMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 3), [data.meta?.campaigns_daily, range]);
  const spesaMetaPrev = useMemo(() => compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 3) : null, [data.meta?.campaigns_daily, compareRange]);
  const spesaGads = useMemo(() => sumInRange(data.gads_daily, range, 3), [data.gads_daily, range]);
  const spesaGadsPrev = useMemo(() => compareRange ? sumInRange(data.gads_daily, compareRange, 3) : null, [data.gads_daily, compareRange]);
  const spesaTot = spesaMeta + spesaGads;
  const spesaTotPrev = spesaMetaPrev != null || spesaGadsPrev != null ? (spesaMetaPrev ?? 0) + (spesaGadsPrev ?? 0) : null;

  const roasBlended = spesaTot > 0 ? revCur / spesaTot : 0;
  const roasBlendedPrev = spesaTotPrev && spesaTotPrev > 0 ? (revPrev ?? 0) / spesaTotPrev : null;
  const cpo = transCur > 0 ? spesaTot / transCur : 0;
  const cpoPrev = transPrev && transPrev > 0 && spesaTotPrev != null ? spesaTotPrev / transPrev : null;

  // Click organici
  const clickOrgCur = sumInRange(data.gsc?.daily, range, 1);
  const clickOrgPrev = compareRange ? sumInRange(data.gsc?.daily, compareRange, 1) : null;

  // Chart: barre spesa impilate Meta/Google + linea ricavi
  const chart = useMemo(() => {
    const metaMap = new Map<string, number>();
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      metaMap.set(d, (metaMap.get(d) ?? 0) + (Number(r[3]) || 0));
    }
    const gadsMap = new Map<string, number>();
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      gadsMap.set(d, (gadsMap.get(d) ?? 0) + (Number(r[3]) || 0));
    }
    const dates = new Set<string>([...metaMap.keys(), ...gadsMap.keys()]);
    for (const r of dailyInRange(data.ga4?.daily, range)) dates.add(String(r[0]));
    const revMap = new Map<string, number>();
    for (const r of dailyInRange(data.ga4?.daily, range)) revMap.set(String(r[0]), Number(r[4]) || 0);
    return [...dates].sort().map((d) => ({
      date: d, label: fmtDate(d),
      meta: metaMap.get(d) ?? 0,
      google: gadsMap.get(d) ?? 0,
      revenue: revMap.get(d) ?? 0,
    }));
  }, [data, range]);

  // Ripartizione spesa per obiettivo
  const byObjective = useMemo(() => {
    const m = groupSumInRange(data.meta?.campaigns_daily, range, 2, 3);
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const key = "Google Ads";
      m.set(key, (m.get(key) ?? 0) + (Number(r[3]) || 0));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [data, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Panoramica
      </SectionTitle>

      {rangeTooEarly && ga4First && (
        <div style={{
          background: `${SAND}18`, border: `1px solid ${SAND}45`,
          padding: "0.7rem 1rem", borderRadius: 10, fontSize: 12, color: palette.textMuted,
        }}>
          <strong style={{ color: SAND }}>Copertura parziale:</strong> il range parte prima del {fmtDate(ga4First)}, ossia il primo giorno con dati GA4. I giorni precedenti non hanno tracking.
        </div>
      )}

      {/* KPI ADV-centriche (adv in testa) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Spesa adv totale" value={eur0(spesaTot)} delta={spesaTotPrev != null ? calcDelta(spesaTot, spesaTotPrev) : null}
          info={`Meta ${eur0(spesaMeta)} + Google ${eur0(spesaGads)}`} accent={ACCENT}
          onClick={() => setTab("advertising")} />
        <KpiTile label="ROAS blended GA4" value={num(roasBlended, 2)} delta={roasBlendedPrev != null ? calcDelta(roasBlended, roasBlendedPrev) : null}
          info={`Revenue GA4 ÷ spesa totale. ${GA4_TOOLTIP}`} accent={ACCENT}
          onClick={() => setTab("advertising")} />
        <KpiTile label="Ricavi GA4" value={eur0(revCur)} delta={revPrev != null ? calcDelta(revCur, revPrev) : null}
          info={GA4_TOOLTIP} accent={ACCENT}
          onClick={() => setTab("ecommerce")} />
        <KpiTile label="Transazioni GA4" value={integer(transCur)} delta={transPrev != null ? calcDelta(transCur, transPrev) : null}
          info={`Transazioni registrate da GA4 sul range. ${GA4_TOOLTIP}`}
          onClick={() => setTab("ecommerce")} />
        <KpiTile label="Costo per ordine" value={transCur > 0 ? eur(cpo) : "—"} delta={cpoPrev != null ? calcDelta(cpo, cpoPrev) : null}
          info="Spesa adv totale ÷ transazioni GA4. Più basso è meglio." />
        <KpiTile label="Scontrino medio GA4" value={transCur > 0 ? eur(aovCur) : "—"} delta={aovPrev != null ? calcDelta(aovCur, aovPrev) : null}
          info={`Revenue GA4 ÷ transazioni GA4. ${GA4_TOOLTIP}`} />
        <KpiTile label="Sessioni GA4" value={integer(sessCur)} delta={sessPrev != null ? calcDelta(sessCur, sessPrev) : null}
          info="Sessioni sul range" onClick={() => setTab("traffico")} />
        <KpiTile label="Click organici" value={integer(clickOrgCur)} delta={clickOrgPrev != null ? calcDelta(clickOrgCur, clickOrgPrev) : null}
          info="Click da Google organico (Search Console). Ritardo ~3g." onClick={() => setTab("seo")} />
      </div>

      {/* Chart principale: spesa stacked Meta/Google + revenue line */}
      <Card>
        <CardHeader title={`Spesa Meta + Google e ricavi GA4 · ${range.days} giorni`} />
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
                <YAxis yAxisId="right" orientation="right" tick={{ fill: SAND, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [eur(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                <Bar yAxisId="left" dataKey="meta" stackId="spesa" name="Spesa Meta" fill={ACCENT} radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="google" stackId="spesa" name="Spesa Google" fill={CHART_PALETTE[2]} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Ricavi GA4" stroke={SAND} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Ripartizione spesa per obiettivo */}
      <Card>
        <CardHeader title="Ripartizione spesa per obiettivo · range corrente"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>Meta obiettivi + Google Ads aggregato</span>} />
        {byObjective.length === 0 || spesaTot === 0 ? <EmptyState /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {byObjective.map(([obj, spesa], i) => {
              const pct = spesaTot > 0 ? (spesa / spesaTot) * 100 : 0;
              const color = CHART_PALETTE[i % CHART_PALETTE.length];
              return (
                <div key={obj} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    minWidth: 140, fontSize: 12, color: palette.text, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }} title={obj}>{obj}</span>
                  <div style={{
                    flex: 1, height: 20, background: palette.divider,
                    borderRadius: 4, overflow: "hidden", position: "relative",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%", background: color,
                      transition: "width 0.3s",
                    }} />
                  </div>
                  <span style={{
                    minWidth: 100, fontSize: 12, color: palette.textMuted,
                    textAlign: "right", fontVariantNumeric: "tabular-nums",
                  }}>{eur0(spesa)} · {num(pct, 1)}%</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
