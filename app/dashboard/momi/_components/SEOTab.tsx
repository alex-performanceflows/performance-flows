"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line,
} from "recharts";
import {
  MomiData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, EmptyState, tableStyles,
  clipRange, dailyInRange, COMPARE_LABEL,
  useDailyMaps, buildSpark, useSparkProps,
  useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle,
} from "./shared";
import { ACCENT, CREAM } from "../config";

export function SEOTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();

  const gscLast = useMemo(() => {
    const daily = data.gsc?.daily ?? [];
    if (daily.length === 0) return null;
    let max = String(daily[0][0]);
    for (const r of daily) { const d = String(r[0]); if (d > max) max = d; }
    return max;
  }, [data.gsc?.daily]);
  const clipped = clipRange(range, gscLast);
  const clippedCompare = compareRange ? clipRange(compareRange, gscLast) : null;
  const truncated = gscLast && range.end > gscLast;

  const cur = useMemo(() => dailyInRange(data.gsc?.daily, clipped), [data.gsc?.daily, clipped]);
  const prev = useMemo(() => clippedCompare ? dailyInRange(data.gsc?.daily, clippedCompare) : [], [data.gsc?.daily, clippedCompare]);

  const agg = useMemo(() => aggregate(cur), [cur]);

  // Sparkline: si fermano all'ultimo giorno rilasciato da Search Console
  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => ({
    click: buildSpark(range, { num: [dm.gscClicks], to: dm.gscLast }),
    imp: buildSpark(range, { num: [dm.gscImpr], to: dm.gscLast }),
    ctr: buildSpark(range, { num: [dm.gscClicks], den: [dm.gscImpr], scale: 100, to: dm.gscLast }),
    pos: buildSpark(range, { num: [dm.gscPosWeighted], den: [dm.gscImpr], to: dm.gscLast }),
  }), [dm, range]);
  const aggPrev = useMemo(() => prev.length > 0 ? aggregate(prev) : null, [prev]);

  const chart = useMemo(() => cur.map((r, i) => ({
    label: fmtDate(String(r[0])),
    click: Number(r[1]) || 0, imp: Number(r[2]) || 0,
    prevClick: prev[i] ? Number(prev[i][1]) || 0 : null,
    prevImp: prev[i] ? Number(prev[i][2]) || 0 : null,
  })), [cur, prev]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>SEO</h2>
          {gscLast && <span style={{ fontSize: 12, color: palette.textDim }}>dati fino al <strong style={{ color: palette.textMuted }}>{fmtDate(gscLast)}</strong></span>}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          {clipped.days} giorni · {compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"} · I dati Search Console arrivano con 3 giorni di ritardo
        </p>
        {truncated && (
          <p style={{ margin: "6px 0 0", padding: "0.5rem 0.75rem", background: palette.divider, borderRadius: 8, fontSize: 11, color: palette.textMuted }}>
            <strong>Range troncato al {fmtDate(gscLast!)}:</strong> Search Console ha ~3 giorni di ritardo fisiologico.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <KpiTile label="Click organici" value={integer(agg.clicks)} delta={calcDelta(agg.clicks, aggPrev?.clicks)} info={`Click da Google organico (${clipped.days}g)`} {...spark(sp.click, integer)} />
        <KpiTile label="Impression" value={integer(agg.imps)} delta={calcDelta(agg.imps, aggPrev?.imps)} info={`Impression organiche (${clipped.days}g)`} {...spark(sp.imp, integer)} />
        <KpiTile label="CTR medio" value={pctStr(agg.ctr, 2)} delta={calcDelta(agg.ctr, aggPrev?.ctr)} info="Click ÷ Impression × 100 (aggregato, non media dei giornalieri)" {...spark(sp.ctr, (v) => pctStr(v, 2))} />
        <KpiTile label="Posizione media" value={num(agg.position, 2)} delta={invertDeltaColor(calcDelta(agg.position, aggPrev?.position))} info="Ponderata sulle impression. Più bassa è meglio: delta invertito (scende = verde). Nella sparkline una linea che scende è un miglioramento." {...spark(sp.pos, (v) => num(v, 1))} />
      </div>

      <Card>
        <CardHeader title={`Click e impression · ${clipped.days} giorni`} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left" tick={{ fill: ACCENT, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={60} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: CREAM, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                {clippedCompare && (
                  <>
                    <Line yAxisId="left" type="monotone" dataKey="prevClick" name="Click (prec.)" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="prevImp" name="Impression (prec.)" stroke={CREAM} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                  </>
                )}
                <Line yAxisId="left" type="monotone" dataKey="click" name="Click" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="imp" name="Impression" stroke={CREAM} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Top query · 30g" />
          <GscTable rows={data.gsc?.queries_w30 ?? []} palette={palette} />
        </Card>
        <Card>
          <CardHeader title="Top pagine · 30g" />
          <GscTable rows={data.gsc?.pages_w30 ?? []} palette={palette} isPage />
        </Card>
      </div>
    </div>
  );
}

function GscTable({ rows, palette, isPage }: {
  rows: (string | number)[][]; palette: import("./shared").Palette; isPage?: boolean;
}) {
  const ts = tableStyles(palette);
  const { sorted, sort, toggle } = useTableSort<(string | number)[]>(rows, (r, key) => {
    switch (key) {
      case "nome": return String(r[0]);
      case "click": return Number(r[1]) || 0;
      case "imp": return Number(r[2]) || 0;
      case "ctr": return Number(r[3]) || 0;
      case "pos": return Number(r[4]) > 0 ? Number(r[4]) : null;
      default: return null;
    }
  });
  const avg = useMemo(() => {
    let click = 0, imp = 0, posW = 0;
    for (const r of rows) {
      const c = Number(r[1]) || 0, i = Number(r[2]) || 0;
      click += c; imp += i; posW += (Number(r[4]) || 0) * i;
    }
    return {
      click: mean(rows.map((r) => Number(r[1]) || 0)),
      imp: mean(rows.map((r) => Number(r[2]) || 0)),
      ctr: ratio(click, imp, 100),
      pos: ratio(posW, imp),
    };
  }, [rows]);
  if (rows.length === 0) return <EmptyState />;
  const th = { sort, onSort: toggle };
  const f = (v: number | null, fmt: (n: number) => string) => (v == null ? "—" : fmt(v));
  return (
    <div style={{ overflowX: "auto", maxHeight: 420 }}>
      <table style={ts.table}>
        <thead><tr>
          <SortTh label={isPage ? "Pagina" : "Query"} sortKey="nome" {...th} />
          <SortTh label="Click" sortKey="click" align="right" {...th} />
          <SortTh label="Imp." sortKey="imp" align="right" {...th} />
          <SortTh label="CTR" sortKey="ctr" align="right" {...th} />
          <SortTh label="Pos." sortKey="pos" align="right" first="asc" {...th} />
        </tr></thead>
        <tbody>
          <tr style={avgRowStyle(palette)}>
            <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700 }} title={AVG_TITLE}>
              Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {rows.length} {isPage ? "pagine" : "query"}</span>
            </td>
            {[f(avg.click, integer), f(avg.imp, integer), f(avg.ctr, (v) => pctStr(v, 2)), f(avg.pos, (v) => num(v, 1))].map((v, i) => (
              <td key={i} style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600, fontStyle: "italic" }}>{v}</td>
            ))}
          </tr>
          {sorted.map((r) => {
            const pos = Number(r[4]) || 0;
            const opp = pos >= 4 && pos <= 10;
            return (
              <tr key={String(r[0])} style={{ background: opp ? "rgba(245,158,11,0.10)" : undefined }}>
                <td style={{
                  ...ts.tdBase, color: palette.text, fontWeight: opp ? 600 : 500,
                  maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: isPage ? "'JetBrains Mono', ui-monospace, monospace" : "inherit",
                  fontSize: isPage ? 11 : 12,
                }} title={String(r[0])}>{String(r[0])}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[1]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(Number(r[3]), 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: pos > 0 && pos <= 3 ? "#22c55e" : opp ? "#f59e0b" : ts.tdBase.color, fontWeight: 600 }}
                  title={opp ? "A un passo dalla prima pagina alta" : pos <= 3 ? "Top 3" : "Oltre la prima pagina"}>
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
