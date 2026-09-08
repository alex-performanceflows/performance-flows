"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area,
} from "recharts";
import {
  CoorieData, useDateRange, useTheme,
  calcDelta, integer, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles,
  ACCENT, SAND, CHART_PALETTE, COMPARE_LABEL,
  sumInRange, dailyInRange, groupSumInRange,
} from "./shared";

export function TrafficoTab({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const ts = tableStyles(palette);

  const sessCur = sumInRange(data.ga4?.daily, range, 1);
  const sessPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;
  const usersCur = sumInRange(data.ga4?.daily, range, 2);
  const usersPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 2) : null;

  // Chart sessioni + utenti giornaliero
  const chart = useMemo(() => dailyInRange(data.ga4?.daily, range).map((r) => ({
    date: String(r[0]), label: fmtDate(String(r[0])),
    sess: Number(r[1]) || 0,
    utenti: Number(r[2]) || 0,
  })), [data.ga4?.daily, range]);

  // Canali giornalieri stacked area
  const channelsAgg = useMemo(() => {
    // top 5 canali per sessioni totali sul range
    const totals = groupSumInRange(data.ga4?.channels_daily, range, 1, 2);
    const top5 = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    const perDay = new Map<string, Record<string, number>>();
    for (const r of data.ga4?.channels_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const canale = String(r[1]);
      const key = top5.includes(canale) ? canale : "Altro";
      const day = perDay.get(d) ?? {};
      day[key] = (day[key] ?? 0) + (Number(r[2]) || 0);
      perDay.set(d, day);
    }
    const keys = [...top5, "Altro"];
    const chartData = [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, day]) => {
      const row: Record<string, string | number> = { date: d, label: fmtDate(d) };
      for (const k of keys) row[k] = day[k] ?? 0;
      return row;
    });
    return { data: chartData, keys };
  }, [data.ga4?.channels_daily, range]);

  // Tabella canali (aggregata sul range)
  const canaliTable = useMemo(() => {
    const m = new Map<string, { sess: number; users: number; trans: number; rev: number }>();
    for (const r of data.ga4?.channels_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const canale = String(r[1]);
      const cur = m.get(canale);
      const vals = { sess: Number(r[2]) || 0, users: Number(r[3]) || 0, trans: Number(r[4]) || 0, rev: Number(r[5]) || 0 };
      if (cur) { cur.sess += vals.sess; cur.users += vals.users; cur.trans += vals.trans; cur.rev += vals.rev; }
      else m.set(canale, vals);
    }
    return [...m.entries()].map(([canale, v]) => ({ canale, ...v })).sort((a, b) => b.sess - a.sess);
  }, [data.ga4?.channels_daily, range]);

  const devices = data.ga4?.devices ?? [];
  const countries = data.ga4?.geo?.country ?? [];
  const regions = data.ga4?.geo?.region ?? [];
  const age = data.ga4?.demo?.age ?? [];
  const gender = data.ga4?.demo?.gender ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Traffico
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Sessioni" value={integer(sessCur)} delta={sessPrev != null ? calcDelta(sessCur, sessPrev) : null}
          info="Sessioni GA4 sul range" />
        <KpiTile label="Utenti" value={integer(usersCur)} delta={usersPrev != null ? calcDelta(usersCur, usersPrev) : null}
          info="Utenti unici GA4 sul range" />
      </div>

      <Card>
        <CardHeader title={`Sessioni e utenti · ${range.days} giorni`} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={chart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                <Area type="monotone" dataKey="sess" name="Sessioni" stroke={ACCENT} fill={ACCENT} fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" dataKey="utenti" name="Utenti" stroke={SAND} fill={SAND} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={`Canali · area impilata · ${range.days} giorni`} />
        {channelsAgg.data.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={channelsAgg.data} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                {channelsAgg.keys.map((k, i) => (
                  <Area key={k} type="monotone" dataKey={k} name={k} stackId="1"
                    stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                    fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                    fillOpacity={0.55} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={`Tabella canali · ${range.days} giorni`} />
        {canaliTable.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Canale</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Transazioni</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Ricavo</th>
              </tr></thead>
              <tbody>
                {canaliTable.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{r.canale}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(r.sess)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.users)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.trans > 0 ? 600 : 400 }}>{integer(r.trans)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{r.rev > 0 ? `${integer(r.rev)} €` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Dispositivi · w30" />
          {devices.length === 0 ? <EmptyState /> : <TrafficoTable rows={devices as (string | number)[][]} label="Dispositivo" ts={ts} palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Paesi · w30" />
          {countries.length === 0 ? <EmptyState /> : <TrafficoTable rows={countries as (string | number)[][]} label="Paese" ts={ts} palette={palette} onlyBasic />}
        </Card>
        <Card>
          <CardHeader title="Regioni · w30" />
          {regions.length === 0 ? <EmptyState /> : <TrafficoTable rows={regions as (string | number)[][]} label="Regione" ts={ts} palette={palette} onlyBasic />}
        </Card>
        <Card>
          <CardHeader title="Età · w30" />
          {age.length === 0 ? <EmptyState label="Demografica non ancora popolata da GA4" /> : <TrafficoTable rows={age as (string | number)[][]} label="Fascia" ts={ts} palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Genere · w30" />
          {gender.length === 0 ? <EmptyState label="Demografica non ancora popolata da GA4" /> : <TrafficoTable rows={gender as (string | number)[][]} label="Genere" ts={ts} palette={palette} />}
        </Card>
      </div>
    </div>
  );
}

function TrafficoTable({ rows, label, ts, palette, onlyBasic }: {
  rows: (string | number)[][]; label: string;
  ts: ReturnType<typeof tableStyles>; palette: import("./shared").Palette;
  onlyBasic?: boolean;
}) {
  return (
    <div style={{ overflowX: "auto", maxHeight: 320 }}>
      <table style={ts.table}>
        <thead><tr>
          <th style={ts.th}>{label}</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Sess.</th>
          {!onlyBasic && <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>}
          {!onlyBasic && <th style={{ ...ts.th, ...ts.thRight }}>Trans.</th>}
          {!onlyBasic && <th style={{ ...ts.th, ...ts.thRight }}>Ricavo</th>}
          {onlyBasic && <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>}
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[1]))}</td>
              {!onlyBasic && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>}
              {!onlyBasic && r[3] != null && <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: Number(r[3]) > 0 ? 600 : 400 }}>{integer(Number(r[3]))}</td>}
              {!onlyBasic && r[4] != null && <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{Number(r[4]) > 0 ? `${integer(Number(r[4]))} €` : "—"}</td>}
              {onlyBasic && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// unused helpers guard
void pctStr;
