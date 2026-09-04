"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import {
  DashboardData, eur, integer, num, pctStr, fmtDate, CHART_PALETTE,
  Card, CardHeader, SectionTitle, EmptyState, Pill, tableStyles, useTheme,
} from "./shared";

type Window = "w7" | "w30";

export function TrafficoTab({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const [window, setWindow] = useState<Window>("w30");

  const chartData = useMemo(() => {
    return (data.ga4?.daily ?? [])
      .filter((r) => r && r.length >= 3)
      .map((r) => ({
        date: String(r[0]),
        dateLabel: fmtDate(String(r[0])),
        sessioni: Number(r[1]) || 0,
        utenti: Number(r[2]) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.ga4?.daily]);

  const channels = data.ga4?.channels?.[window] ?? [];
  const devices = data.ga4?.devices ?? [];
  const age = data.ga4?.demo?.age ?? [];
  const gender = data.ga4?.demo?.gender ?? [];
  const countries = data.ga4?.geo?.country ?? [];
  const regions = data.ga4?.geo?.region ?? [];
  const demoAvailable = age.length > 0 || gender.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub="Andamento sessioni, canali di acquisizione e composizione utenti">Traffico</SectionTitle>

      {/* Chart 90g */}
      <Card>
        <CardHeader title="Sessioni e utenti · Ultimi 90 giorni" />
        {chartData.length === 0 ? (
          <EmptyState label="Nessun dato giornaliero GA4" />
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="dateLabel"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip
                  contentStyle={{
                    background: palette.tooltipBg,
                    border: `1px solid ${palette.tooltipBorder}`,
                    borderRadius: 8, color: palette.text,
                  }}
                  formatter={(v: unknown) => integer(Number(v ?? 0))}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                <Line type="monotone" dataKey="sessioni" name="Sessioni" stroke="#64CBFF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="utenti" name="Utenti" stroke="#96C228" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Canali di acquisizione */}
      <Card>
        <CardHeader
          title="Canali di acquisizione"
          right={
            <div style={{ display: "flex", gap: 6 }}>
              <Pill active={window === "w7"} onClick={() => setWindow("w7")}>Ultimi 7g</Pill>
              <Pill active={window === "w30"} onClick={() => setWindow("w30")}>Ultimi 30g</Pill>
            </div>
          }
        />
        {channels.length === 0 ? (
          <EmptyState label={`Nessun dato canali per la finestra ${window === "w7" ? "7 giorni" : "30 giorni"}`} />
        ) : (
          <ChannelsTable rows={channels} />
        )}
      </Card>

      {/* Dispositivi */}
      <Card>
        <CardHeader title="Dispositivi" />
        {devices.length === 0 ? <EmptyState /> : <DevicesRow rows={devices} />}
      </Card>

      {/* Demografia */}
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

      {/* Geo */}
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

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function ChannelsTable({ rows }: { rows: (string | number)[][] }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const activeBg = theme === "dark" ? "rgba(150,194,40,0.10)" : "rgba(150,194,40,0.14)";
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
            const trans = Number(r[3]) || 0;
            const active = trans > 0;
            return (
              <tr key={i} style={{ background: active ? activeBg : undefined }}>
                <td style={{ ...ts.tdBase, color: active ? "#96C228" : ts.tdBase.color, fontWeight: active ? 600 : 400 }}>
                  {String(r[0] ?? "—")}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: active ? "#96C228" : ts.tdBase.color, fontWeight: active ? 700 : 400 }}>
                  {integer(trans)}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>
                  {trans > 0 ? eur(Number(r[4])) : "—"}
                </td>
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
