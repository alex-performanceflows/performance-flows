"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DashboardData, integer, num, pctStr, CHART_PALETTE,
  Card, CardHeader, SectionTitle, EmptyState, tableStyles, useTheme,
} from "./shared";

export function UtentiTab({ data }: { data: DashboardData }) {
  const age = data.ga4?.demo?.age ?? [];
  const gender = data.ga4?.demo?.gender ?? [];
  const countries = data.ga4?.geo?.country ?? [];
  const regions = data.ga4?.geo?.region ?? [];
  const devices = data.ga4?.devices ?? [];

  const demoAvailable = age.length > 0 || gender.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub="Composizione utenti e sorgenti geografiche">Utenti</SectionTitle>

      {!demoAvailable && (
        <Card padding={16}>
          <p style={{ margin: 0, fontSize: 13 }}>
            <strong style={{ color: "#f59e0b" }}>Nota:</strong> dati demografici non disponibili (Google Signals disattivato o soglia utenti non raggiunta).
          </p>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Fasce d'età" />
          {age.length === 0 ? <EmptyState /> : <AgeChart rows={age} />}
        </Card>
        <Card>
          <CardHeader title="Genere" />
          {gender.length === 0 ? <EmptyState /> : <DonutChart rows={gender} />}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
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
          <XAxis type="number"
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }}
            tickFormatter={(v) => integer(Number(v))} />
          <YAxis type="category" dataKey="fascia" width={60}
            tick={{ fill: palette.textMuted, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }}
            tickLine={false} />
          <Tooltip
            cursor={{ fill: palette.buttonHover }}
            contentStyle={{
              background: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              borderRadius: 8, color: palette.text,
            }}
            formatter={(v: unknown) => integer(Number(v ?? 0))}
          />
          <Bar dataKey="utenti" fill="#64CBFF" radius={[0, 4, 4, 0]} />
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
          <Pie data={chart} dataKey="value" nameKey="name"
            cx="50%" cy="50%" innerRadius={60} outerRadius={85}
            paddingAngle={2} stroke="none">
            {chart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{
              background: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              borderRadius: 8, color: palette.text,
            }}
            formatter={(v: unknown, n: unknown) => {
              const nv = Number(v ?? 0);
              return [`${integer(nv)} · ${pctStr(total ? (nv / total) * 100 : 0, 1)}`, String(n)];
            }}
          />
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "center" }}>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chart} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={55} outerRadius={90}
              paddingAngle={2} stroke="none">
              {chart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: palette.tooltipBg,
                border: `1px solid ${palette.tooltipBorder}`,
                borderRadius: 8, color: palette.text,
              }}
              formatter={(v: unknown, n: unknown) => {
                const nv = Number(v ?? 0);
                return [`${integer(nv)} · ${pctStr(total ? (nv / total) * 100 : 0, 1)}`, String(n)];
              }}
            />
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
