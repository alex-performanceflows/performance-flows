"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  DashboardData, calcDelta, invertDeltaColor,
  integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles, useTheme,
} from "./shared";

// Numero di giorni per finestra corrente (e comparazione)
const RANGE_DAYS = 30;

export function SEOTab({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const gsc = data.gsc;
  const daily = gsc?.daily ?? [];
  const queries = gsc?.queries_w30 ?? [];
  const pages = gsc?.pages_w30 ?? [];

  // Empty state se non c'è nulla di significativo
  const isEmpty = daily.length === 0 && queries.length === 0 && pages.length === 0;
  if (isEmpty) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionTitle>SEO</SectionTitle>
        <Card>
          <EmptyState label="In attesa dei primi dati Search Console" />
        </Card>
      </div>
    );
  }

  // Ordino asc per data
  const sorted = useMemo(() => {
    return [...daily]
      .filter((r) => r && r.length >= 5)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, [daily]);

  const lastDate = sorted[sorted.length - 1]?.[0];
  const current = sorted.slice(-RANGE_DAYS);
  const previous = sorted.slice(-RANGE_DAYS * 2, -RANGE_DAYS);

  const agg = useMemo(() => aggregate(current), [current]);
  const aggPrev = useMemo(() => (previous.length > 0 ? aggregate(previous) : null), [previous]);

  const chartData = useMemo(() => buildChartData(current, previous), [current, previous]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>
            SEO
          </h2>
          {lastDate && (
            <span style={{ fontSize: 12, color: palette.textDim }}>
              dati fino al <strong style={{ color: palette.textMuted }}>{fmtDate(String(lastDate))}</strong>
              {" · "}
              <span style={{ color: palette.textFaint, fontSize: 11 }}>
                Search Console ha ~3 giorni di ritardo
              </span>
            </span>
          )}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          Ultimi {RANGE_DAYS} giorni vs {RANGE_DAYS} giorni precedenti
        </p>
      </div>

      {/* KPI cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}>
        <KpiTile
          label="Click organici"
          value={integer(agg.clicks)}
          delta={calcDelta(agg.clicks, aggPrev?.clicks)}
          info="Numero di click da risultati organici Google negli ultimi 30 giorni disponibili in Search Console"
        />
        <KpiTile
          label="Impression"
          value={integer(agg.imps)}
          delta={calcDelta(agg.imps, aggPrev?.imps)}
          info="Numero di volte in cui una pagina del sito è apparsa nei risultati Google negli ultimi 30 giorni"
        />
        <KpiTile
          label="CTR medio"
          value={pctStr(agg.ctr, 2)}
          delta={calcDelta(agg.ctr, aggPrev?.ctr)}
          info="Click-Through Rate: Σ click ÷ Σ impression del periodo. NON è la media dei CTR giornalieri"
        />
        <KpiTile
          label="Posizione media"
          value={num(agg.position, 2)}
          delta={invertDeltaColor(calcDelta(agg.position, aggPrev?.position))}
          info="Posizione media ponderata sulle impression: Σ(posizione × impression) ÷ Σ impression. Più bassa è meglio (1 = prima posizione). Il delta è colorato al contrario: verde = miglioramento (scesa), rosso = peggioramento (salita)"
        />
      </div>

      {/* Chart click + impression con comparazione tratteggiata */}
      <Card>
        <CardHeader title={`Click e impression · Ultimi ${RANGE_DAYS} giorni`} />
        {chartData.length === 0 ? (
          <EmptyState label="Nessun dato disponibile per il grafico" />
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 12 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis yAxisId="left"
                  tick={{ fill: "#96C228", fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <YAxis yAxisId="right" orientation="right"
                  tick={{ fill: "#64CBFF", fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip content={<GscTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                {/* Comparazione (tratteggiate, sotto) */}
                <Line yAxisId="left" type="monotone" dataKey="prevClicks" name="Click (periodo prec.)"
                  stroke="#96C228" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.6}
                  dot={false} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="prevImps" name="Impression (periodo prec.)"
                  stroke="#64CBFF" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.6}
                  dot={false} connectNulls />
                {/* Serie correnti */}
                <Line yAxisId="left" type="monotone" dataKey="clicks" name="Click"
                  stroke="#96C228" strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="imps" name="Impression"
                  stroke="#64CBFF" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Query + pagine */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader
            title="Top query · Ultimi 30g"
            right={<Note text="Righe evidenziate: posizione 4-10 (opportunità)" />}
          />
          {queries.length === 0 ? <EmptyState label="Nessuna query nel periodo" /> : <SearchTable rows={queries} nameLabel="Query" />}
        </Card>
        <Card>
          <CardHeader
            title="Top pagine · Ultimi 30g"
            right={<Note text="Righe evidenziate: posizione 4-10 (opportunità)" />}
          />
          {pages.length === 0 ? <EmptyState label="Nessuna pagina nel periodo" /> : <SearchTable rows={pages} nameLabel="Pagina" isPage />}
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Note({ text }: { text: string }) {
  const { palette } = useTheme();
  return (
    <span style={{ fontSize: 11, color: palette.textDim }}>{text}</span>
  );
}

function SearchTable({ rows, nameLabel, isPage }: { rows: (string | number)[][]; nameLabel: string; isPage?: boolean }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const highlightBg = theme === "dark" ? "rgba(100,203,255,0.08)" : "rgba(100,203,255,0.12)";
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
            const clicks = Number(r[1]) || 0;
            const imps = Number(r[2]) || 0;
            const ctr = Number(r[3]) || 0;
            const pos = Number(r[4]) || 0;
            const opportunity = pos >= 4 && pos <= 10;
            return (
              <tr key={i} style={{ background: opportunity ? highlightBg : undefined }}>
                <td
                  style={{
                    ...ts.tdBase,
                    maxWidth: 320,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    color: opportunity ? "#64CBFF" : ts.tdBase.color,
                    fontWeight: opportunity ? 600 : 400,
                    fontFamily: isPage ? "'JetBrains Mono', ui-monospace, monospace" : "inherit",
                    fontSize: isPage ? 11 : 12,
                  }}
                  title={name}
                >
                  {name}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(clicks)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(imps)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                <td
                  style={{
                    ...ts.tdBase, ...ts.tdRight,
                    color: pos > 0 && pos <= 3 ? "#22c55e" : opportunity ? "#64CBFF" : ts.tdBase.color,
                    fontWeight: 600,
                  }}
                  title={opportunity ? "Prima pagina ma non top 3: opportunità di scalata" : pos <= 3 ? "Top 3" : "Oltre la prima pagina"}
                >
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

// ─── Helpers ──────────────────────────────────────────────────────

type Agg = { clicks: number; imps: number; ctr: number; position: number };

function aggregate(rows: (string | number)[][]): Agg {
  let clicks = 0;
  let imps = 0;
  let weightedPos = 0;
  let weight = 0;
  for (const r of rows) {
    const c = Number(r[1]) || 0;
    const i = Number(r[2]) || 0;
    const p = Number(r[4]) || 0;
    clicks += c;
    imps += i;
    if (i > 0 && p > 0) {
      weightedPos += p * i;
      weight += i;
    }
  }
  return {
    clicks,
    imps,
    ctr: imps > 0 ? (clicks / imps) * 100 : 0,
    position: weight > 0 ? weightedPos / weight : 0,
  };
}

type ChartRow = {
  date: string;
  label: string;
  clicks: number | null;
  imps: number | null;
  prevClicks: number | null;
  prevImps: number | null;
};

function buildChartData(current: (string | number)[][], previous: (string | number)[][]): ChartRow[] {
  const result: ChartRow[] = [];
  const maxLen = current.length;

  for (let idx = 0; idx < maxLen; idx++) {
    const cur = current[idx];
    const prev = previous[idx]; // stesso day-of-period index
    const date = String(cur?.[0] ?? "");
    result.push({
      date,
      label: fmtDate(date),
      clicks: cur ? Number(cur[1]) || 0 : null,
      imps: cur ? Number(cur[2]) || 0 : null,
      prevClicks: prev ? Number(prev[1]) || 0 : null,
      prevImps: prev ? Number(prev[2]) || 0 : null,
    });
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GscTooltip({ active, payload, label }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: palette.tooltipBg,
      border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.6rem 0.75rem",
      fontSize: 12, color: palette.text,
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    }}>
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload
        .filter((p: { value: unknown }) => p.value != null)
        .map((p: { dataKey: string; name: string; value: number; color: string; strokeDasharray?: string }) => (
        <p key={p.dataKey} style={{
          margin: 0,
          color: p.color,
          fontVariantNumeric: "tabular-nums",
          opacity: p.dataKey.startsWith("prev") ? 0.7 : 1,
        }}>
          {p.name}: {integer(p.value)}
        </p>
      ))}
    </div>
  );
}

