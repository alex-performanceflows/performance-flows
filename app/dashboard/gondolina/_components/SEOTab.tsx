"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line,
} from "recharts";
import {
  GondolinaData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, tableStyles,
  ACCENT, GOLD, COMPARE_LABEL,
  clipRange, dailyInRange, isBrandQuery,
} from "./shared";

type SubTab = "andamento" | "query" | "pagine";

const SUB: { key: SubTab; label: string }[] = [
  { key: "andamento", label: "Andamento" },
  { key: "query", label: "Query" },
  { key: "pagine", label: "Pagine, paesi, dispositivi" },
];

export function SEOTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const [sub, setSub] = useState<SubTab>("andamento");
  const { range, compareRange, compare } = useDateRange();
  const gscLast = data.gsc?.ultimo_giorno;
  const clippedRange = clipRange(range, gscLast);
  const truncated = gscLast && range.end > gscLast;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>SEO</h2>
          {gscLast && (
            <span style={{ fontSize: 12, color: palette.textDim }}>
              dati fino al <strong style={{ color: palette.textMuted }}>{fmtDate(gscLast)}</strong>
            </span>
          )}
        </div>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          {clippedRange.days} giorni · {compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}
        </p>
        {truncated && (
          <p style={{ margin: "6px 0 0", padding: "0.5rem 0.75rem", background: palette.divider, borderRadius: 8, fontSize: 11, color: palette.textMuted }}>
            <strong>Range troncato al {fmtDate(gscLast!)}:</strong> Search Console ha ~3 giorni di ritardo. Il calo apparente sugli ultimi giorni non esiste, sono dati che ancora non ha rilasciato.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SUB.map((s) => (
          <button key={s.key} onClick={() => setSub(s.key)} style={{
            padding: "0.5rem 0.9rem", borderRadius: 10,
            border: `1px solid ${sub === s.key ? palette.textFaint : palette.cardBorder}`,
            background: sub === s.key ? palette.buttonHover : "transparent",
            color: sub === s.key ? palette.text : palette.textMuted,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{s.label}</button>
        ))}
      </div>

      {sub === "andamento" && <AndamentoSEO data={data} clippedRange={clippedRange} />}
      {sub === "query" && <QueryView data={data} />}
      {sub === "pagine" && <PaginePaesiView data={data} />}
    </div>
  );
}

// ── 4a Andamento ─────────────────────────────────────────────────

function AndamentoSEO({ data, clippedRange }: { data: GondolinaData; clippedRange: { start: string; end: string; days: number } }) {
  const { palette } = useTheme();
  const { compareRange } = useDateRange();
  const cur = useMemo(() => dailyInRange(data.gsc?.daily, clippedRange), [data.gsc?.daily, clippedRange]);
  const prev = useMemo(() => compareRange ? dailyInRange(data.gsc?.daily, compareRange) : [], [data.gsc?.daily, compareRange]);

  const agg = useMemo(() => aggregate(cur), [cur]);
  const aggPrev = useMemo(() => prev.length > 0 ? aggregate(prev) : null, [prev]);

  const chart = useMemo(() => cur.map((r, i) => ({
    label: fmtDate(String(r[0])),
    click: Number(r[1]) || 0, imp: Number(r[2]) || 0,
    prevClick: prev[i] ? Number(prev[i][1]) || 0 : null,
    prevImp: prev[i] ? Number(prev[i][2]) || 0 : null,
  })), [cur, prev]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <KpiTile label="Click organici" value={integer(agg.clicks)} delta={calcDelta(agg.clicks, aggPrev?.clicks)}
          info={`Click da risultati Google organici (${clippedRange.days}g)`} />
        <KpiTile label="Impression" value={integer(agg.imps)} delta={calcDelta(agg.imps, aggPrev?.imps)}
          info={`Impression organiche (${clippedRange.days}g)`} />
        <KpiTile label="CTR medio" value={pctStr(agg.ctr, 2)} delta={calcDelta(agg.ctr, aggPrev?.ctr)}
          info="Click ÷ Impression × 100 (aggregato del periodo, non media dei giornalieri)" />
        <KpiTile label="Posizione media" value={num(agg.position, 2)} delta={invertDeltaColor(calcDelta(agg.position, aggPrev?.position))}
          info="Media ponderata sulle impression. Più bassa è meglio: delta invertito (scende = verde)." />
      </div>
      <Card>
        <CardHeader title={`Click e impression · ${clippedRange.days} giorni`} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left" tick={{ fill: ACCENT, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={60} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: GOLD, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                {compareRange && (
                  <>
                    <Line yAxisId="left" type="monotone" dataKey="prevClick" name="Click (prec.)" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="prevImp" name="Impression (prec.)" stroke={GOLD} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                  </>
                )}
                <Line yAxisId="left" type="monotone" dataKey="click" name="Click" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="imp" name="Impression" stroke={GOLD} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 4b Query (brand vs non-brand) ────────────────────────────────

function QueryView({ data }: { data: GondolinaData }) {
  const { palette, theme } = useTheme();
  const [win, setWin] = useState<"w30" | "w90">("w30");
  const ts = tableStyles(palette);
  const rows = (win === "w30" ? data.gsc?.queries_w30 : data.gsc?.queries_w90) ?? [];
  const opportunityBg = theme === "dark" ? "rgba(201,162,39,0.10)" : "rgba(201,162,39,0.14)";

  const stats = useMemo(() => {
    let brandClicks = 0, nonBrandClicks = 0, oppCount = 0;
    for (const r of rows) {
      const clicks = Number(r[1]) || 0;
      const pos = Number(r[4]) || 0;
      const q = String(r[0]);
      if (isBrandQuery(q)) brandClicks += clicks;
      else nonBrandClicks += clicks;
      if (pos >= 4 && pos <= 10) oppCount++;
    }
    return { brandClicks, nonBrandClicks, oppCount };
  }, [rows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        <KpiTile label="Opportunità (pos. 4-10)" value={integer(stats.oppCount)}
          info="Query a un passo dalla prima pagina: sono le prime dove intervenire" accent={GOLD} />
        <KpiTile label="Click di brand" value={integer(stats.brandClicks)}
          info='Query che contengono "gondolina": cresce da sola quando cresce il paid' />
        <KpiTile label="Click non-brand" value={integer(stats.nonBrandClicks)}
          info="Misura reale della crescita organica indipendente dal brand" accent={ACCENT} />
      </div>
      <Card>
        <CardHeader title="Query" right={
          <div style={{ display: "flex", gap: 6 }}>
            <Pill active={win === "w30"} onClick={() => setWin("w30")}>30g</Pill>
            <Pill active={win === "w90"} onClick={() => setWin("w90")}>90g</Pill>
          </div>
        } />
        {rows.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Query</th>
                <th style={ts.th}>Tipo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Pos.</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => {
                  const q = String(r[0]);
                  const pos = Number(r[4]) || 0;
                  const opp = pos >= 4 && pos <= 10;
                  const brand = isBrandQuery(q);
                  return (
                    <tr key={i} style={{ background: opp ? opportunityBg : undefined }}>
                      <td style={{ ...ts.tdBase, color: opp ? GOLD : palette.text, fontWeight: opp ? 600 : 500 }}>{q}</td>
                      <td style={ts.tdBase}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20,
                          background: brand ? "rgba(123,34,51,0.20)" : palette.divider,
                          color: brand ? "#c04b5f" : palette.textDim,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                        }}>{brand ? "BRAND" : "NON-BRAND"}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[1]))}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(Number(r[3]), 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: pos > 0 && pos <= 3 ? "#22c55e" : opp ? GOLD : ts.tdBase.color, fontWeight: 600 }}
                        title={opp ? "Prima pagina ma non top 3: opportunità di scalata" : pos <= 3 ? "Top 3" : "Oltre la prima pagina"}>
                        {num(pos, 1)}
                      </td>
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

// ── 4c Pagine, paesi, dispositivi ─────────────────────────────────

function PaginePaesiView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const pages = data.gsc?.pages_w30 ?? [];
  const paesi = data.gsc?.paesi_w30 ?? [];
  const devices = data.gsc?.devices_w30 ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
      <Card>
        <CardHeader title="Top pagine · 30g" />
        {pages.length === 0 ? <EmptyState /> : <SEOTable rows={pages} isPage ts={ts} palette={palette} />}
      </Card>
      <Card>
        <CardHeader title="Paesi · 30g" />
        {paesi.length === 0 ? <EmptyState /> : <SEOTable rows={paesi} ts={ts} palette={palette} />}
      </Card>
      <Card>
        <CardHeader title="Dispositivi · 30g" />
        {devices.length === 0 ? <EmptyState /> : <SEOTable rows={devices} ts={ts} palette={palette} />}
      </Card>
    </div>
  );
}

function SEOTable({ rows, isPage, ts, palette }: {
  rows: (string | number)[][]; isPage?: boolean;
  ts: ReturnType<typeof tableStyles>; palette: import("./shared").Palette;
}) {
  return (
    <div style={{ overflowX: "auto", maxHeight: 420 }}>
      <table style={ts.table}>
        <thead><tr>
          <th style={ts.th}>Nome</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Imp.</th>
          <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Pos.</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{
                ...ts.tdBase, color: palette.text, fontWeight: 500,
                maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: isPage ? "'JetBrains Mono', ui-monospace, monospace" : "inherit",
                fontSize: isPage ? 11 : 12,
              }} title={String(r[0])}>{String(r[0])}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[1]))}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(Number(r[3]), 2)}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(Number(r[4]), 1)}</td>
            </tr>
          ))}
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
