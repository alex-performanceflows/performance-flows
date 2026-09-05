"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  CentogiriData, useDateRange, useTheme,
  integer, eur, num, pctStr, fmtDate,
  Card, CardHeader, SectionTitle, EmptyState, tableStyles,
  groupInRange, dailyInRange, COMPARE_LABEL,
  ACCENT, BRAND_CYAN, CHART_PALETTE,
} from "./shared";

export function TrafficoTab({ data }: { data: CentogiriData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();

  const chartData = useMemo(() => {
    const cur = dailyInRange(data.ga4?.daily, range);
    const prev = compareRange ? dailyInRange(data.ga4?.daily, compareRange) : [];
    const rows = [] as { i: number; label: string; sessioni: number | null; utenti: number | null; prevSessioni: number | null; prevUtenti: number | null }[];
    for (let i = 0; i < cur.length; i++) {
      const c = cur[i];
      const p = prev[i];
      rows.push({
        i, label: c ? fmtDate(String(c[0])) : "",
        sessioni: c ? Number(c[1]) || 0 : null,
        utenti: c ? Number(c[2]) || 0 : null,
        prevSessioni: p ? Number(p[1]) || 0 : null,
        prevUtenti: p ? Number(p[2]) || 0 : null,
      });
    }
    return rows;
  }, [data.ga4?.daily, range, compareRange]);

  const channels = useMemo(() => {
    const grouped = groupInRange(data.ga4?.channels_daily, range, 1, [2, 3, 4, 5]);
    const out = Array.from(grouped.entries()).map(([canale, [sess, users, trans, rev]]) => ({
      canale, sess, users, trans, rev,
    }));
    out.sort((a, b) => b.sess - a.sess);
    return out;
  }, [data.ga4?.channels_daily, range]);

  const age = data.ga4?.demo?.age ?? [];
  const gender = data.ga4?.demo?.gender ?? [];
  const countries = data.ga4?.geo?.country ?? [];
  const regions = data.ga4?.geo?.region ?? [];
  const devices = data.ga4?.devices ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`Andamento, canali e composizione utenti · ${range.days} giorni · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Traffico
      </SectionTitle>

      <Card>
        <CardHeader title={`Sessioni e utenti · ${range.days} giorni`} />
        {chartData.length === 0 ? (
          <EmptyState label="Nessun dato giornaliero GA4 nel periodo" />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
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
                {compareRange && (
                  <>
                    <Line type="monotone" dataKey="prevSessioni" name="Sessioni (prec.)" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                    <Line type="monotone" dataKey="prevUtenti" name="Utenti (prec.)" stroke={BRAND_CYAN} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.55} dot={false} connectNulls />
                  </>
                )}
                <Line type="monotone" dataKey="sessioni" name="Sessioni" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="utenti" name="Utenti" stroke={BRAND_CYAN} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={`Canali di acquisizione · ${range.days} giorni`} />
        {channels.length === 0 ? <EmptyState label="Nessun dato canali nel periodo" /> : <ChannelsTable rows={channels} />}
      </Card>

{/* Demografia: nascondi se entrambe vuote */}
      {(age.length > 0 || gender.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {age.length > 0 && (
            <Card>
              <CardHeader title="Fasce d'età" />
              <AgeChart rows={age} />
            </Card>
          )}
          {gender.length > 0 && (
            <Card>
              <CardHeader title="Genere" />
              <DonutChart rows={gender} />
            </Card>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Top paesi" />
          <GeoTable rows={countries} />
        </Card>
        <Card>
          <CardHeader title="Top regioni" />
          <GeoTable rows={regions} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Dispositivi" />
        {devices.length === 0 ? <EmptyState /> : <DevicesRow rows={devices} />}
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

type ChannelRow = { canale: string; sess: number; users: number; trans: number; rev: number };

function ChannelsTable({ rows }: { rows: ChannelRow[] }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const activeBg = theme === "dark" ? "rgba(42,169,175,0.10)" : "rgba(42,169,175,0.14)";
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Canale</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Transazioni</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const active = r.trans > 0;
            return (
              <tr key={i} style={{ background: active ? activeBg : undefined }}>
                <td style={{ ...ts.tdBase, color: active ? BRAND_CYAN : ts.tdBase.color, fontWeight: active ? 600 : 400 }}>{r.canale}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.sess)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.users)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: active ? 700 : 400 }}>{integer(r.trans)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.trans > 0 ? eur(r.rev) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AgeChart({ rows }: { rows: (string | number)[][] }) {
  const { palette } = useTheme();
  const chart = rows
    .filter((r) => r && r.length >= 2 && String(r[0]) !== "unknown")
    .map((r) => ({ fascia: String(r[0]), utenti: Number(r[1]) || 0 }))
    .sort((a, b) => a.fascia.localeCompare(b.fascia));
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={palette.grid} horizontal={false} />
          <XAxis type="number" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }}
            tickFormatter={(v) => integer(Number(v))} />
          <YAxis type="category" dataKey="fascia" width={60}
            tick={{ fill: palette.textMuted, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
          <Tooltip cursor={{ fill: palette.buttonHover }}
            contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
            formatter={(v: unknown) => integer(Number(v ?? 0))} />
          <Bar dataKey="utenti" fill={ACCENT} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChart({ rows }: { rows: (string | number)[][] }) {
  const { palette } = useTheme();
  const chart = rows
    .filter((r) => r && r.length >= 2 && String(r[0]) !== "unknown")
    .map((r) => ({ name: labelize(String(r[0])), value: Number(r[1]) || 0 }));
  const total = chart.reduce((a, r) => a + r.value, 0);
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={chart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="none">
            {chart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
            formatter={(v: unknown, n: unknown) => {
              const nv = Number(v ?? 0);
              return [`${integer(nv)} · ${pctStr(total ? (nv / total) * 100 : 0, 1)}`, String(n)];
            }} />
          <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function GeoTable({ rows }: { rows: (string | number)[][] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  if (!rows || rows.length === 0) return <EmptyState />;
  const top = rows.slice(0, 10);
  return (
    <div style={{ overflowX: "auto", maxHeight: 320 }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Nome</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r, i) => (
            <tr key={i}>
              <td style={ts.tdBase}>{String(r[0] ?? "—")}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DevicesRow({ rows }: { rows: (string | number)[][] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const chart = rows.map((r) => ({
    name: labelize(String(r[0] ?? "")),
    value: Number(r[2]) || Number(r[1]) || 0,
    sessions: Number(r[1]) || 0,
    transactions: Number(r[3]) || 0,
    revenue: Number(r[4]) || 0,
  }));
  const total = chart.reduce((a, r) => a + r.value, 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "center" }}>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
              {chart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
              formatter={(v: unknown, n: unknown) => {
                const nv = Number(v ?? 0);
                return [`${integer(nv)} · ${pctStr(total ? (nv / total) * 100 : 0, 1)}`, String(n)];
              }} />
            <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Device</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Sess.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Trans.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {chart.map((r, i) => (
              <tr key={i}>
                <td style={ts.tdBase}>{r.name}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.sessions)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.transactions)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(r.revenue, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function labelize(s: string): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
