"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  DashboardData, eur, integer, fmtDate,
  Card, CardHeader, SectionTitle, EmptyState, Pill, tableStyles, useTheme,
} from "./shared";

type Window = "w7" | "w30";

export function TrafficoTab({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const [window, setWindow] = useState<Window>("w30");

  const chartData = useMemo(() => {
    const rows = data.ga4?.daily ?? [];
    return rows
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub="Andamento sessioni e canali di acquisizione">Traffico</SectionTitle>

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
    </div>
  );
}

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
