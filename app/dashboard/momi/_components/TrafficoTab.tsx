"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area,
} from "recharts";
import {
  MomiData, useDateRange, useTheme,
  calcDelta, integer, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles,
  sumInRange, dailyInRange, COMPARE_LABEL,
} from "./shared";
import { ACCENT, CREAM, CHART_PALETTE } from "../config";

export function TrafficoTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const ts = tableStyles(palette);

  const sess = sumInRange(data.ga4?.daily, range, 1);
  const users = sumInRange(data.ga4?.daily, range, 2);
  const newU = sumInRange(data.ga4?.daily, range, 3);
  const engaged = sumInRange(data.ga4?.daily, range, 4);
  const engRate = sess > 0 ? (engaged / sess) * 100 : 0;

  const sessP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;
  const usersP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 2) : null;
  const newUP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 3) : null;
  const engagedP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 4) : null;
  const engRateP = sessP && sessP > 0 ? ((engagedP ?? 0) / sessP) * 100 : null;

  // Eventi chiave per piattaforma
  type EvRow = { platform: string; Click_CTA_Download: number; first_open: number; sign_up: number };
  const eventsPerPlatform = useMemo<EvRow[]>(() => {
    const platforms = ["web", "iOS", "Android"];
    const map: Record<string, EvRow> = {};
    for (const p of platforms) map[p] = { platform: p, Click_CTA_Download: 0, first_open: 0, sign_up: 0 };
    for (const r of data.ga4?.events_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const evStr = String(r[1]);
      const plat = String(r[2]);
      if (!map[plat]) continue;
      if (evStr !== "Click_CTA_Download" && evStr !== "first_open" && evStr !== "sign_up") continue;
      const ev = evStr as "Click_CTA_Download" | "first_open" | "sign_up";
      map[plat][ev] += Number(r[3]) || 0;
    }
    return platforms.map((p) => map[p]);
  }, [data.ga4?.events_daily, range]);

  // Canali stacked
  const channels = useMemo(() => {
    const totals = new Map<string, number>();
    for (const r of data.ga4?.channels_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const canale = String(r[1]);
      totals.set(canale, (totals.get(canale) ?? 0) + (Number(r[2]) || 0));
    }
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
    const arr = [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, day]) => {
      const row: Record<string, string | number> = { date: d, label: fmtDate(d) };
      for (const k of keys) row[k] = day[k] ?? 0;
      return row;
    });
    return { data: arr, keys };
  }, [data.ga4?.channels_daily, range]);

  // Tabella canali w30 (aggregata sul range)
  const canaliTable = useMemo(() => {
    const m = new Map<string, { canale: string; sess: number; users: number }>();
    for (const r of data.ga4?.channels_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const canale = String(r[1]);
      const cur = m.get(canale);
      const s = Number(r[2]) || 0, u = Number(r[3]) || 0;
      if (cur) { cur.sess += s; cur.users += u; } else m.set(canale, { canale, sess: s, users: u });
    }
    return [...m.values()].sort((a, b) => b.sess - a.sess);
  }, [data.ga4?.channels_daily, range]);

  // Chart sessioni+utenti
  const chart = useMemo(() => dailyInRange(data.ga4?.daily, range).map((r) => ({
    date: String(r[0]), label: fmtDate(String(r[0])),
    sess: Number(r[1]) || 0, utenti: Number(r[2]) || 0,
  })), [data.ga4?.daily, range]);

  const devices = data.ga4?.devices ?? [];
  const age = data.ga4?.demo?.age ?? [];
  const gender = data.ga4?.demo?.gender ?? [];
  const country = data.ga4?.geo?.country ?? [];
  const region = data.ga4?.geo?.region ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Traffico
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <KpiTile label="Sessioni" value={integer(sess)} delta={sessP != null ? calcDelta(sess, sessP) : null} />
        <KpiTile label="Utenti" value={integer(users)} delta={usersP != null ? calcDelta(users, usersP) : null} />
        <KpiTile label="Nuovi utenti" value={integer(newU)} delta={newUP != null ? calcDelta(newU, newUP) : null} />
        <KpiTile label="Sessioni coinvolte" value={integer(engaged)} delta={engagedP != null ? calcDelta(engaged, engagedP) : null} />
        <KpiTile label="Tasso di coinvolgimento" value={pctStr(engRate, 1)} delta={engRateP != null ? calcDelta(engRate, engRateP) : null} />
      </div>

      {/* Eventi chiave per piattaforma */}
      <Card>
        <CardHeader title="Eventi chiave per piattaforma"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>Click_CTA_Download → first_open → sign_up</span>} />
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <th style={ts.th}>Piattaforma</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Click CTA Download</th>
              <th style={{ ...ts.th, ...ts.thRight }}>First open</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Sign up</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Tasso first_open → sign_up</th>
            </tr></thead>
            <tbody>
              {eventsPerPlatform.map((p) => {
                const rate = p.first_open > 0 ? (p.sign_up / p.first_open) * 100 : 0;
                const isApp = p.platform === "iOS" || p.platform === "Android";
                return (
                  <tr key={p.platform}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{p.platform}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.Click_CTA_Download)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.first_open)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: p.sign_up > 0 ? 600 : 400 }}>{integer(p.sign_up)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: isApp ? palette.text : palette.textDim, fontWeight: isApp ? 600 : 400 }}>
                      {isApp ? (p.first_open > 0 ? pctStr(rate, 1) : "—") : "n.a."}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Chart sessioni */}
      <Card>
        <CardHeader title={`Sessioni e utenti · ${range.days} giorni`} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={chart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                <Area type="monotone" dataKey="sess" name="Sessioni" stroke={ACCENT} fill={ACCENT} fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" dataKey="utenti" name="Utenti" stroke={CREAM} fill={CREAM} fillOpacity={0.10} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Canali stacked */}
      <Card>
        <CardHeader title={`Canali · area impilata · ${range.days} giorni`} />
        {channels.data.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={channels.data} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                {channels.keys.map((k, i) => (
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
        <CardHeader title={`Tabella canali · ${range.days}g`} />
        {canaliTable.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Canale</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>
              </tr></thead>
              <tbody>
                {canaliTable.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{r.canale}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(r.sess)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Demo / geo / devices */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Dispositivi · w30" />
          {devices.length === 0 ? <EmptyState /> : <SimpleTable rows={devices} labelHead="Dispositivo" palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Età · w30" />
          {age.length === 0 ? <EmptyState label="Demografica non ancora popolata da GA4" /> : <SimpleTable rows={age} labelHead="Fascia" palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Genere · w30" />
          {gender.length === 0 ? <EmptyState label="Demografica non ancora popolata da GA4" /> : <SimpleTable rows={gender} labelHead="Genere" palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Paesi · w30" />
          {country.length === 0 ? <EmptyState /> : <SimpleTable rows={country} labelHead="Paese" palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Regioni · w30" />
          {region.length === 0 ? <EmptyState /> : <SimpleTable rows={region} labelHead="Regione" palette={palette} />}
        </Card>
      </div>
    </div>
  );
}

function SimpleTable({ rows, labelHead, palette }: {
  rows: (string | number)[][]; labelHead: string; palette: import("./shared").Palette;
}) {
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto", maxHeight: 300 }}>
      <table style={ts.table}>
        <thead><tr>
          <th style={ts.th}>{labelHead}</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
          {rows[0] && rows[0][2] != null && <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>}
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[1]))}</td>
              {r[2] != null && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
