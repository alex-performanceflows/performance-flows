"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line, Bar, LineChart,
} from "recharts";
import {
  GondolinaData, useDateRange, useNav, useTheme,
  calcDelta, eur, eur0, integer, num, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  ACCENT, GOLD, COMPARE_LABEL,
  sumInRange, dailyInRange, hasAdvActivity,
} from "./shared";

export function PanoramicaTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const { setTab } = useNav();

  // ─── Aggregati sul range ──────────────────────────────────────
  const sessCur = sumInRange(data.ga4?.daily, range, 1);
  const sessPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;
  const transCur = sumInRange(data.ga4?.daily, range, 4);
  const transPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 4) : null;
  const revCur = sumInRange(data.ga4?.daily, range, 5);
  const revPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 5) : null;

  // Spesa adv (tutte le piattaforme) + spesa Online + valore Online per ROAS
  const onlineObjs = new Set(data.online_objectives ?? ["Online"]);
  const advAgg = useMemo(() => aggregateAdv(data.adv?.daily, range, onlineObjs), [data.adv?.daily, range]);
  const advPrev = useMemo(() => compareRange ? aggregateAdv(data.adv?.daily, compareRange, onlineObjs) : null, [data.adv?.daily, compareRange]);

  const roasCur = advAgg.onlineSpend > 0 ? advAgg.onlineValue / advAgg.onlineSpend : 0;
  const roasPrev = advPrev && advPrev.onlineSpend > 0 ? advPrev.onlineValue / advPrev.onlineSpend : null;

  const clicksOrgCur = sumInRange(data.gsc?.daily, range, 1);
  const clicksOrgPrev = compareRange ? sumInRange(data.gsc?.daily, compareRange, 1) : null;
  const impOrgCur = sumInRange(data.gsc?.daily, range, 2);
  const impOrgPrev = compareRange ? sumInRange(data.gsc?.daily, compareRange, 2) : null;

  // Chart data: trans + spesa daily (doppio asse)
  const chart1 = useMemo(() => {
    const advSpendMap = new Map<string, number>();
    for (const r of data.adv?.daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      advSpendMap.set(d, (advSpendMap.get(d) ?? 0) + (Number(r[5]) || 0));
    }
    return dailyInRange(data.ga4?.daily, range).map((r) => ({
      date: String(r[0]), label: fmtDate(String(r[0])),
      transazioni: Number(r[4]) || 0,
      spesa: advSpendMap.get(String(r[0])) ?? 0,
    }));
  }, [data, range]);

  // Chart data: sessioni + click organici (sovrapposti, stessa scala)
  const chart2 = useMemo(() => {
    const clickMap = new Map<string, number>();
    for (const r of data.gsc?.daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      clickMap.set(d, Number(r[1]) || 0);
    }
    return dailyInRange(data.ga4?.daily, range).map((r) => ({
      date: String(r[0]), label: fmtDate(String(r[0])),
      sessioni: Number(r[1]) || 0,
      clickOrganici: clickMap.get(String(r[0])) ?? 0,
    }));
  }, [data, range]);

  // Warning se comparazione ricade in periodo senza campagne
  const compareNoAdv = compareRange && !hasAdvActivity(data.adv?.daily, compareRange) && hasAdvActivity(data.adv?.daily, range);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Panoramica
      </SectionTitle>

      {compareNoAdv && (
        <div style={{
          background: "rgba(201,162,39,0.10)", border: "1px solid rgba(201,162,39,0.30)",
          padding: "0.7rem 1rem", borderRadius: 10, fontSize: 12, color: palette.textMuted,
        }}>
          <strong style={{ color: GOLD }}>Confronto parziale:</strong> il periodo di comparazione non ha spesa advertising (le campagne sono partite più avanti). Le variazioni % vs paid sono di calcolo, non di significato.
        </div>
      )}

      {/* KPI principali (7) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Sessioni" value={integer(sessCur)} delta={sessPrev != null ? calcDelta(sessCur, sessPrev) : null}
          info={`Sessioni GA4 nel periodo (${range.days}g)`} onClick={() => setTab("traffico")} />
        <KpiTile label="Transazioni (da GA4)" value={integer(transCur)} delta={transPrev != null ? calcDelta(transCur, transPrev) : null}
          info="Transazioni registrate da GA4. Non da Shopify: GA4 sottostima. Serve per il trend e il confronto tra canali, non per il fatturato reale." accent={GOLD}
          onClick={() => setTab("traffico")} />
        <KpiTile label="Revenue (da GA4)" value={eur0(revCur)} delta={revPrev != null ? calcDelta(revCur, revPrev) : null}
          info="Revenue attribuito da GA4 nel periodo. Sottostimato rispetto a Shopify: usare per trend e confronto, non come fatturato assoluto." accent={GOLD}
          onClick={() => setTab("traffico")} />
        <KpiTile label="Impression organiche" value={integer(impOrgCur)} delta={impOrgPrev != null ? calcDelta(impOrgCur, impOrgPrev) : null}
          info="Impression da risultati organici Google (Search Console). Ritardo ~3 giorni." onClick={() => setTab("seo")} />
        <KpiTile label="Click organici" value={integer(clicksOrgCur)} delta={clicksOrgPrev != null ? calcDelta(clicksOrgCur, clicksOrgPrev) : null}
          info="Click da risultati organici Google (Search Console). Ritardo ~3 giorni." onClick={() => setTab("seo")} />
        <KpiTile label="Spesa advertising" value={eur0(advAgg.totalSpend)} delta={advPrev ? calcDelta(advAgg.totalSpend, advPrev.totalSpend) : null}
          info={`Investimento totale Meta + Google Ads nel periodo (${eur0(advAgg.metaSpend)} Meta + ${eur0(advAgg.googleSpend)} Google)`}
          onClick={() => setTab("advertising")} />
        <KpiTile label="ROAS" value={num(roasCur, 2)} delta={roasPrev != null ? calcDelta(roasCur, roasPrev) : null}
          info="Valore ÷ spesa sull'obiettivo Online. Non include Drive to Store (le vendite avvengono in boutique)."
          onClick={() => setTab("advertising")} />
      </div>

      {/* Chart 1: transazioni + spesa adv doppio asse */}
      <Card>
        <CardHeader title={`Transazioni e spesa advertising · ${range.days} giorni`} />
        {chart1.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chart1} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left" tick={{ fill: GOLD, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: ACCENT, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={70} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [String(n) === "Spesa adv" ? eur(Number(v ?? 0)) : integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                <Bar yAxisId="left" dataKey="transazioni" name="Transazioni (GA4)" fill={GOLD} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="spesa" name="Spesa adv" stroke={ACCENT} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Chart 2: sessioni + click organici */}
      <Card>
        <CardHeader title={`Sessioni sito e click organici · ${range.days} giorni`} />
        {chart2.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chart2} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                <Line type="monotone" dataKey="sessioni" name="Sessioni sito" stroke={ACCENT} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clickOrganici" name="Click organici" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Adv aggregation ──────────────────────────────────────────────

type AdvAgg = {
  totalSpend: number; metaSpend: number; googleSpend: number;
  onlineSpend: number; onlineValue: number;
};

function aggregateAdv(daily: (string | number)[][] | undefined, range: { start: string; end: string }, onlineObjs: Set<string>): AdvAgg {
  const a: AdvAgg = { totalSpend: 0, metaSpend: 0, googleSpend: 0, onlineSpend: 0, onlineValue: 0 };
  if (!daily) return a;
  for (const r of daily) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    const plat = String(r[1]); const obj = String(r[2]);
    const spend = Number(r[5]) || 0;
    const val = Number(r[9]) || 0;
    a.totalSpend += spend;
    if (plat === "Meta") a.metaSpend += spend;
    else if (plat === "Google") a.googleSpend += spend;
    if (onlineObjs.has(obj)) {
      a.onlineSpend += spend;
      a.onlineValue += val;
    }
  }
  return a;
}
