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
  useDailyMaps, buildSpark, useSparkProps, useTableSort, SortTh,
} from "./shared";
import { ACCENT, CREAM, CHART_PALETTE } from "../config";

export function TrafficoTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();

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

  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => {
    const from = dm.ga4First;
    return {
      sess: buildSpark(range, { num: [dm.sessions], from }),
      users: buildSpark(range, { num: [dm.users], from }),
      newU: buildSpark(range, { num: [dm.newUsers], from }),
      engaged: buildSpark(range, { num: [dm.engaged], from }),
      engRate: buildSpark(range, { num: [dm.engaged], den: [dm.sessions], scale: 100, from }),
    };
  }, [dm, range]);

  // Eventi chiave per piattaforma
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
        <KpiTile label="Sessioni" value={integer(sess)} delta={sessP != null ? calcDelta(sess, sessP) : null} {...spark(sp.sess, integer)} />
        <KpiTile label="Utenti" value={integer(users)} delta={usersP != null ? calcDelta(users, usersP) : null} {...spark(sp.users, integer)} />
        <KpiTile label="Nuovi utenti" value={integer(newU)} delta={newUP != null ? calcDelta(newU, newUP) : null} {...spark(sp.newU, integer)} />
        <KpiTile label="Sessioni coinvolte" value={integer(engaged)} delta={engagedP != null ? calcDelta(engaged, engagedP) : null} {...spark(sp.engaged, integer)} />
        <KpiTile label="Tasso di coinvolgimento" value={pctStr(engRate, 1)} delta={engRateP != null ? calcDelta(engRate, engRateP) : null} {...spark(sp.engRate, (v) => pctStr(v, 1))} />
      </div>

      {/* Eventi chiave per piattaforma */}
      <Card>
        <CardHeader title="Eventi chiave per piattaforma"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>Click_CTA_Download → first_open → sign_up</span>} />
        <EventsTable rows={eventsPerPlatform} palette={palette} />
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
          <SimpleTable rows={canaliTable.map((c) => [c.canale, c.sess, c.users])} labelHead="Canale" cols={["Sessioni", "Utenti"]} palette={palette} />
        )}
      </Card>

      {/* Demo / geo / devices */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Dispositivi · w30" />
          {devices.length === 0 ? <EmptyState /> : <SimpleTable rows={devices} labelHead="Dispositivo" cols={["Sessioni", "Utenti"]} palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Età · w30" />
          {age.length === 0 ? <EmptyState label="Demografica non ancora popolata da GA4" /> : <SimpleTable rows={age} labelHead="Fascia" cols={["Utenti"]} palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Genere · w30" />
          {gender.length === 0 ? <EmptyState label="Demografica non ancora popolata da GA4" /> : <SimpleTable rows={gender} labelHead="Genere" cols={["Utenti"]} palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Paesi · w30" />
          {country.length === 0 ? <EmptyState /> : <SimpleTable rows={country} labelHead="Paese" cols={["Utenti", "Sessioni"]} palette={palette} />}
        </Card>
        <Card>
          <CardHeader title="Regioni · w30" />
          {region.length === 0 ? <EmptyState /> : <SimpleTable rows={region} labelHead="Regione" cols={["Utenti", "Sessioni"]} palette={palette} />}
        </Card>
      </div>
    </div>
  );
}

type EvRow = { platform: string; Click_CTA_Download: number; first_open: number; sign_up: number };

function EventsTable({ rows, palette }: { rows: EvRow[]; palette: import("./shared").Palette }) {
  const ts = tableStyles(palette);
  const isApp = (p: string) => p === "iOS" || p === "Android";
  const { sorted, sort, toggle } = useTableSort<EvRow>(rows, (r, key) => {
    switch (key) {
      case "platform": return r.platform;
      case "cta": return r.Click_CTA_Download;
      case "open": return r.first_open;
      case "signup": return r.sign_up;
      case "rate": return isApp(r.platform) && r.first_open > 0 ? (r.sign_up / r.first_open) * 100 : null;
      default: return null;
    }
  });
  const th = { sort, onSort: toggle };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead><tr>
          <SortTh label="Piattaforma" sortKey="platform" {...th} />
          <SortTh label="Click CTA Download" sortKey="cta" align="right" {...th} />
          <SortTh label="First open" sortKey="open" align="right" {...th} />
          <SortTh label="Sign up" sortKey="signup" align="right" {...th} />
          <SortTh label="Tasso first_open → sign_up" sortKey="rate" align="right" {...th} />
        </tr></thead>
        <tbody>
          {sorted.map((p) => {
            const app = isApp(p.platform);
            const rate = p.first_open > 0 ? (p.sign_up / p.first_open) * 100 : 0;
            return (
              <tr key={p.platform}>
                <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{p.platform}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.Click_CTA_Download)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.first_open)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: p.sign_up > 0 ? 600 : 400 }}>{integer(p.sign_up)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: app ? palette.text : palette.textDim, fontWeight: app ? 600 : 400 }}>
                  {app ? (p.first_open > 0 ? pctStr(rate, 1) : "—") : "n.a."}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ rows, labelHead, cols, palette }: {
  rows: (string | number)[][]; labelHead: string;
  /** Intestazioni delle colonne numeriche, nell'ordine in cui arrivano nel JSON */
  cols: string[];
  palette: import("./shared").Palette;
}) {
  const ts = tableStyles(palette);
  const { sorted, sort, toggle } = useTableSort<(string | number)[]>(rows, (r, key) =>
    key === "label" ? String(r[0]) : Number(r[Number(key)]) || 0);
  const th = { sort, onSort: toggle };
  return (
    <div style={{ overflowX: "auto", maxHeight: 300 }}>
      <table style={ts.table}>
        <thead><tr>
          <SortTh label={labelHead} sortKey="label" {...th} />
          {cols.map((c, i) => <SortTh key={c} label={c} sortKey={String(i + 1)} align="right" {...th} />)}
        </tr></thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={String(r[0])}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
              {cols.map((c, i) => (
                <td key={c} style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: i === 0 ? 600 : 400 }}>{integer(Number(r[i + 1]) || 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
