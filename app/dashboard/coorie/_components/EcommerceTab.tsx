"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line, Bar,
} from "recharts";
import {
  CoorieData, useDateRange, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, tableStyles,
  ACCENT, SAND, CHART_PALETTE, COMPARE_LABEL, POSITIVE,
  sumInRange, dailyInRange, fasciaProdotto,
} from "./shared";

const GA4_TOOLTIP = "Ricavi da GA4 ecommerce: sottostimati rispetto agli ordini reali finché il tracking non è completo.";

export function EcommerceTab({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();

  const revCur = sumInRange(data.ga4?.daily, range, 4);
  const revPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 4) : null;
  const transCur = sumInRange(data.ga4?.daily, range, 3);
  const transPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 3) : null;
  const aovCur = transCur > 0 ? revCur / transCur : 0;
  const aovPrev = transPrev && transPrev > 0 ? (revPrev ?? 0) / transPrev : null;

  const chart = useMemo(() => dailyInRange(data.ga4?.daily, range).map((r) => ({
    date: String(r[0]), label: fmtDate(String(r[0])),
    revenue: Number(r[4]) || 0,
    transazioni: Number(r[3]) || 0,
  })), [data.ga4?.daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Ecommerce
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Ricavi GA4" value={eur0(revCur)} delta={revPrev != null ? calcDelta(revCur, revPrev) : null}
          info={GA4_TOOLTIP} accent={ACCENT} />
        <KpiTile label="Transazioni GA4" value={integer(transCur)} delta={transPrev != null ? calcDelta(transCur, transPrev) : null}
          info={`Transazioni sul range. ${GA4_TOOLTIP}`} />
        <KpiTile label="Scontrino medio GA4" value={transCur > 0 ? eur(aovCur) : "—"} delta={aovPrev != null ? calcDelta(aovCur, aovPrev) : null}
          info={`Revenue GA4 ÷ transazioni. ${GA4_TOOLTIP}`} />
      </div>

      {/* Chart ricavi + transazioni */}
      <Card>
        <CardHeader title={`Ricavi e transazioni · ${range.days} giorni`} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 300 }}>
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
                  tickFormatter={(v) => integer(Number(v))} width={40} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [String(n) === "Ricavi GA4" ? eur(Number(v ?? 0)) : integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                <Bar yAxisId="right" dataKey="transazioni" name="Transazioni" fill={SAND} radius={[3, 3, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Ricavi GA4" stroke={ACCENT} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <FunnelView data={data} />
      <NewRetView data={data} />
      <ProductsView data={data} />
    </div>
  );
}

// ─── Funnel (w30 fisso) ────────────────────────────────────────────

function FunnelView({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const f = data.ga4?.funnel?.w30;
  if (!f) {
    return <Card><CardHeader title="Funnel · 30 giorni" /><EmptyState label="Funnel non disponibile" /></Card>;
  }
  const steps = [
    { label: "Visualizzazioni prodotto", val: f.views, color: ACCENT },
    { label: "Aggiungi al carrello", val: f.atc, color: CHART_PALETTE[2] },
    { label: "Checkout iniziato", val: f.checkout, color: SAND },
    { label: "Acquisti", val: f.purchases, color: POSITIVE },
  ];
  const maxV = Math.max(...steps.map((s) => s.val), 1);

  return (
    <Card>
      <CardHeader title="Funnel · 30 giorni"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>step successivo ÷ step corrente</span>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => {
          const pct = maxV > 0 ? (s.val / maxV) * 100 : 0;
          const rate = i > 0 ? (steps[i - 1].val > 0 ? (s.val / steps[i - 1].val) * 100 : 0) : null;
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ minWidth: 180, fontSize: 12, color: palette.text, fontWeight: 500 }}>{s.label}</span>
              <div style={{
                flex: 1, height: 24, background: palette.divider,
                borderRadius: 4, overflow: "hidden", position: "relative",
              }}>
                <div style={{
                  width: `${pct}%`, height: "100%", background: s.color, transition: "width 0.3s",
                }} />
                <span style={{
                  position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                  fontSize: 11, color: palette.text, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                }}>{integer(s.val)}</span>
              </div>
              <span style={{
                minWidth: 90, fontSize: 11, textAlign: "right", color: palette.textMuted, fontVariantNumeric: "tabular-nums",
              }}>{rate != null ? `${pctStr(rate, 1)} pass.` : "—"}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Nuovi vs ricorrenti (sul range da newret_daily) ─────────────

function NewRetView({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();

  // newret_daily row: [data, "new"|"returning", users, transactions, revenue]
  const agg = useMemo(() => {
    let newUsers = 0, retUsers = 0, newTrans = 0, retTrans = 0;
    for (const r of data.ga4?.newret_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const tipo = String(r[1]);
      const users = Number(r[2]) || 0;
      const trans = Number(r[3]) || 0;
      if (tipo === "new") { newUsers += users; newTrans += trans; }
      else { retUsers += users; retTrans += trans; }
    }
    const totUsers = newUsers + retUsers;
    const totTrans = newTrans + retTrans;
    return {
      newUsers, retUsers, newTrans, retTrans, totUsers, totTrans,
      newUsersPct: totUsers > 0 ? (newUsers / totUsers) * 100 : 0,
      newTransPct: totTrans > 0 ? (newTrans / totTrans) * 100 : 0,
    };
  }, [data.ga4?.newret_daily, range]);

  return (
    <Card>
      <CardHeader title="Nuovi vs ricorrenti · range corrente" />
      {agg.totUsers === 0 ? <EmptyState /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <NrTile label="Nuovi utenti" val={agg.newUsers} pct={agg.newUsersPct} color={ACCENT} palette={palette} />
          <NrTile label="Utenti ricorrenti" val={agg.retUsers} pct={100 - agg.newUsersPct} color={SAND} palette={palette} />
          <NrTile label="Transazioni nuovi" val={agg.newTrans} pct={agg.newTransPct} color={ACCENT} palette={palette} />
          <NrTile label="Transazioni ricorrenti" val={agg.retTrans} pct={100 - agg.newTransPct} color={SAND} palette={palette} />
        </div>
      )}
    </Card>
  );
}

function NrTile({ label, val, pct, color, palette }: {
  label: string; val: number; pct: number; color: string; palette: import("./shared").Palette;
}) {
  return (
    <div style={{
      background: palette.divider, borderLeft: `3px solid ${color}`,
      borderRadius: 8, padding: "0.75rem 0.9rem",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em", marginTop: 4 }}>{integer(val)}</div>
      <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>quota <strong style={{ color }}>{pctStr(pct, 1)}</strong></div>
    </div>
  );
}

// ─── Prodotti (preset w30/w90) ────────────────────────────────────

function ProductsView({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const [win, setWin] = useState<"w30" | "w90">("w30");
  const ts = tableStyles(palette);
  const rows = (win === "w30" ? data.ga4?.items?.w30 : data.ga4?.items?.w90) ?? [];

  // row: [prodotto, fascia, count, rev]
  const enriched = useMemo(() => rows.map((r) => ({
    prod: String(r[0]),
    fasciaRaw: String(r[1]),
    fascia: fasciaProdotto(String(r[1])),
    count: Number(r[2]) || 0,
    rev: Number(r[3]) || 0,
  })), [rows]);

  const byFascia = useMemo(() => {
    const m = new Map<string, number>();
    let tot = 0;
    for (const e of enriched) { m.set(e.fascia, (m.get(e.fascia) ?? 0) + e.rev); tot += e.rev; }
    return { entries: [...m.entries()].sort((a, b) => b[1] - a[1]), tot };
  }, [enriched]);

  return (
    <Card>
      <CardHeader title="Prodotti (GA4)"
        right={<div style={{ display: "flex", gap: 6 }}>
          <Pill active={win === "w30"} onClick={() => setWin("w30")}>30g</Pill>
          <Pill active={win === "w90"} onClick={() => setWin("w90")}>90g</Pill>
        </div>} />
      {enriched.length === 0 ? <EmptyState /> : (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {byFascia.entries.map(([f, r]) => (
              <span key={f} style={{
                padding: "4px 10px", borderRadius: 20, background: palette.divider,
                color: palette.textMuted, fontSize: 11, fontWeight: 600,
              }}>{f} · <strong style={{ color: ACCENT }}>{eur0(r)}</strong> ({pctStr(byFascia.tot > 0 ? (r / byFascia.tot) * 100 : 0, 1)})</span>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Prodotto</th>
                <th style={ts.th}>Fascia</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Unità</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Ricavo</th>
              </tr></thead>
              <tbody>
                {enriched.sort((a, b) => b.rev - a.rev).map((e, i) => (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{e.prod}</td>
                    <td style={ts.tdBase}>
                      <span style={{
                        padding: "1px 7px", borderRadius: 20,
                        background: e.fascia === "Bundle" ? `${SAND}30` : e.fascia === "Full Size" ? `${ACCENT}30` : palette.divider,
                        color: e.fascia === "Bundle" ? SAND : e.fascia === "Full Size" ? ACCENT : palette.textDim,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                      }}>{e.fascia}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(e.count)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(e.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
