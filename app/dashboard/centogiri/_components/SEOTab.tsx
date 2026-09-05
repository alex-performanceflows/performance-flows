"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  CentogiriData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles,
  COMPARE_LABEL, dailyInRange,
} from "./shared";

export function SEOTab({ data }: { data: CentogiriData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const gsc = data.gsc;
  const daily = gsc?.daily ?? [];
  const queries = gsc?.queries_w30 ?? [];
  const pages = gsc?.pages_w30 ?? [];

  if (daily.length === 0 && queries.length === 0 && pages.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionTitle>SEO</SectionTitle>
        <Card><EmptyState label="In attesa dei primi dati Search Console" /></Card>
      </div>
    );
  }

  const cur = useMemo(() => dailyInRange(daily, range), [daily, range]);
  const prev = useMemo(() => compareRange ? dailyInRange(daily, compareRange) : [], [daily, compareRange]);
  const agg = useMemo(() => aggregate(cur), [cur]);
  const aggPrev = useMemo(() => (prev.length > 0 ? aggregate(prev) : null), [prev]);

  const chartData = useMemo(() => {
    const rows: { label: string; clicks: number | null; imps: number | null; prevClicks: number | null; prevImps: number | null }[] = [];
    for (let i = 0; i < cur.length; i++) {
      const c = cur[i];
      const p = prev[i];
      rows.push({
        label: c ? fmtDate(String(c[0])) : "",
        clicks: c ? Number(c[1]) || 0 : null,
        imps: c ? Number(c[2]) || 0 : null,
        prevClicks: p ? Number(p[1]) || 0 : null,
        prevImps: p ? Number(p[2]) || 0 : null,
      });
    }
    return rows;
  }, [cur, prev]);

  const lastDate = daily.length ? String([...daily].sort((a, b) => String(a[0]).localeCompare(String(b[0])))[daily.length - 1][0]) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>SEO</h2>
          {lastDate && (
            <span style={{ fontSize: 12, color: palette.textDim }}>
              dati fino al <strong style={{ color: palette.textMuted }}>{fmtDate(lastDate)}</strong>
              <span style={{ color: palette.textFaint, fontSize: 11 }}> · Search Console ha ~3 giorni di ritardo</span>
            </span>
          )}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          {range.days} giorni · {compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile label="Click organici" value={integer(agg.clicks)} delta={calcDelta(agg.clicks, aggPrev?.clicks)}
          info={`Click da risultati organici Google nel periodo (${range.days} giorni)`} />
        <KpiTile label="Impression" value={integer(agg.imps)} delta={calcDelta(agg.imps, aggPrev?.imps)}
          info={`Numero di volte in cui una pagina è apparsa nei risultati Google (${range.days} giorni)`} />
        <KpiTile label="CTR medio" value={pctStr(agg.ctr, 2)} delta={calcDelta(agg.ctr, aggPrev?.ctr)}
          info="Click-Through Rate: Σ click ÷ Σ impression del periodo. NON è la media dei CTR giornalieri" />
        <KpiTile label="Posizione media" value={num(agg.position, 2)}
          delta={invertDeltaColor(calcDelta(agg.position, aggPrev?.position))}
          info="Posizione media ponderata sulle impression: Σ(posizione × impression) ÷ Σ impression. Più bassa è meglio. Delta invertito: verde = miglioramento (scesa)." />
      </div>

      <Card>
        <CardHeader title={`Click e impression · ${range.days} giorni`} />
        {chartData.length === 0 ? <EmptyState label="Nessun dato disponibile per il grafico" /> : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 12 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left" tick={{ fill: "#22c55e", fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#f97316", fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                {compareRange && (
                  <>
                    <Line yAxisId="left" type="monotone" dataKey="prevClicks" name="Click (prec.)" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="prevImps" name="Impression (prec.)" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                  </>
                )}
                <Line yAxisId="left" type="monotone" dataKey="clicks" name="Click" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="imps" name="Impression" stroke="#f97316" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Top query · Ultimi 30g" />
          {queries.length === 0 ? <EmptyState /> : <SearchTable rows={queries} nameLabel="Query" />}
        </Card>
        <Card>
          <CardHeader title="Top pagine · Ultimi 30g" />
          {pages.length === 0 ? <EmptyState /> : <SearchTable rows={pages} nameLabel="Pagina" isPage />}
        </Card>
      </div>
    </div>
  );
}

function SearchTable({ rows, nameLabel, isPage }: { rows: (string | number)[][]; nameLabel: string; isPage?: boolean }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const highlightBg = theme === "dark" ? "rgba(249,115,22,0.10)" : "rgba(249,115,22,0.12)";
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>{nameLabel}</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Pos.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const name = String(r[0] ?? "—");
            const pos = Number(r[4]) || 0;
            const opportunity = pos >= 4 && pos <= 10;
            return (
              <tr key={i} style={{ background: opportunity ? highlightBg : undefined }}>
                <td style={{
                  ...ts.tdBase, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: opportunity ? "#f97316" : ts.tdBase.color, fontWeight: opportunity ? 600 : 400,
                  fontFamily: isPage ? "'JetBrains Mono', ui-monospace, monospace" : "inherit",
                  fontSize: isPage ? 11 : 12,
                }} title={name}>
                  {name}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[1]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(Number(r[3]), 2)}</td>
                <td style={{
                  ...ts.tdBase, ...ts.tdRight,
                  color: pos > 0 && pos <= 3 ? "#22c55e" : opportunity ? "#f97316" : ts.tdBase.color, fontWeight: 600,
                }} title={opportunity ? "Prima pagina ma non top 3: opportunità di scalata" : pos <= 3 ? "Top 3" : "Oltre la prima pagina"}>
                  {num(pos, 1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function aggregate(rows: (string | number)[][]) {
  let clicks = 0, imps = 0, wpos = 0, w = 0;
  for (const r of rows) {
    const c = Number(r[1]) || 0, i = Number(r[2]) || 0, p = Number(r[4]) || 0;
    clicks += c; imps += i;
    if (i > 0 && p > 0) { wpos += p * i; w += i; }
  }
  return { clicks, imps, ctr: imps > 0 ? (clicks / imps) * 100 : 0, position: w > 0 ? wpos / w : 0 };
}
