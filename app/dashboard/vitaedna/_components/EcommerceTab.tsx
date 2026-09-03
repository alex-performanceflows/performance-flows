"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ComposedChart, Line,
} from "recharts";
import {
  DashboardData, calcDelta, eur, eur0, integer, fmtDate,
  KITS, kitOf, KIT_COLORS,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles, useTheme,
} from "./shared";

export function EcommerceTab({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const woo30 = data.woo?.totals?.w30;
  const wooP30 = data.woo?.totals?.p30;

  const kitRevenue = useMemo(() => {
    const acc: Record<string, { key: string; label: string; color: string; revenue: number; qty: number }> = {};
    for (const k of KITS) acc[k.key] = { key: k.key, label: k.label, color: k.color, revenue: 0, qty: 0 };
    acc.altri = { key: "altri", label: "Altri", color: KIT_COLORS.altri, revenue: 0, qty: 0 };
    for (const r of data.woo?.by_product ?? []) {
      const name = String(r[0] ?? "");
      const qty = Number(r[1]) || 0;
      const rev = Number(r[2]) || 0;
      const kk = kitOf(name);
      acc[kk].revenue += rev;
      acc[kk].qty += qty;
    }
    return Object.values(acc).filter((r) => r.revenue > 0 || r.qty > 0);
  }, [data.woo?.by_product]);

  const dailyChart = useMemo(() => {
    return (data.woo?.daily ?? [])
      .filter((r) => r && r.length >= 3)
      .map((r) => ({
        date: String(r[0]),
        dateLabel: fmtDate(String(r[0])),
        revenue: Number(r[1]) || 0,
        ordini: Number(r[2]) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.woo?.daily]);

  const coupons = data.woo?.coupons ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub="WooCommerce · ultimi 30 giorni vs 30 giorni precedenti">Ecommerce</SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Revenue" value={eur(woo30?.revenue ?? 0)} delta={calcDelta(woo30?.revenue, wooP30?.revenue)} />
        <KpiTile label="Ordini" value={integer(woo30?.orders ?? 0)} delta={calcDelta(woo30?.orders, wooP30?.orders)} />
        <KpiTile label="AOV" value={eur(woo30?.aov ?? 0)} delta={calcDelta(woo30?.aov, wooP30?.aov)} />
      </div>

      <Card>
        <CardHeader title="Vendite per kit prodotto" />
        {kitRevenue.length === 0 ? (
          <EmptyState label="Nessuna vendita per kit rilevata" />
        ) : (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={kitRevenue} margin={{ top: 12, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.textMuted, fontSize: 12 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={70} />
                <Tooltip
                  cursor={{ fill: palette.buttonHover }}
                  contentStyle={{
                    background: palette.tooltipBg,
                    border: `1px solid ${palette.tooltipBorder}`,
                    borderRadius: 8, color: palette.text,
                  }}
                  formatter={(_v: unknown, _n: unknown, p: unknown) => {
                    const payload = (p as { payload?: { revenue?: number; qty?: number } })?.payload ?? {};
                    return [`${eur(payload.revenue ?? 0)} · ${integer(payload.qty ?? 0)} pz`, "Vendite"];
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {kitRevenue.map((r) => <Cell key={r.key} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Coupon utilizzati" />
        {coupons.length === 0 ? <EmptyState label="Nessun coupon nel periodo" /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead>
                <tr>
                  <th style={ts.th}>Codice</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Usi</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Sconto totale</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 600 }}>
                      {String(r[0] ?? "—")}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: "#ef4444" }}>
                      − {eur(Number(r[2]))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Andamento giornaliero · Revenue e Ordini" />
        {dailyChart.length === 0 ? <EmptyState label="Nessun dato giornaliero" /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyChart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="dateLabel"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left"
                  tick={{ fill: "#64CBFF", fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={70} />
                <YAxis yAxisId="right" orientation="right"
                  tick={{ fill: "#96C228", fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip
                  contentStyle={{
                    background: palette.tooltipBg,
                    border: `1px solid ${palette.tooltipBorder}`,
                    borderRadius: 8, color: palette.text,
                  }}
                  formatter={(v: unknown, n: unknown) => {
                    const nv = Number(v ?? 0);
                    const name = String(n);
                    return [name === "Revenue" ? eur(nv) : integer(nv), name];
                  }}
                />
                <Bar yAxisId="right" dataKey="ordini" name="Ordini" fill="#96C228" opacity={0.7} radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#64CBFF" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
