"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from "recharts";
import {
  CentogiriData, useDateRange, useTheme,
  calcDelta, integer, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles,
  CHART_PALETTE, ACCENT, COMPARE_LABEL,
  groupSumInRange,
} from "./shared";

export function LeadTab({ data }: { data: CentogiriData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();

  const byForm = useMemo(() => {
    const g = groupSumInRange(data.leads?.daily, range, 1, 2);
    return Array.from(g.entries()).map(([form, count]) => ({ form, count }))
      .sort((a, b) => b.count - a.count);
  }, [data.leads?.daily, range]);

  const byFormPrev = useMemo(() => {
    if (!compareRange) return new Map<string, number>();
    return groupSumInRange(data.leads?.daily, compareRange, 1, 2);
  }, [data.leads?.daily, compareRange]);

  const totalContatti = byForm.reduce((a, r) => a + r.count, 0);
  const totalContattiPrev = compareRange
    ? Array.from(byFormPrev.values()).reduce((a, v) => a + v, 0)
    : null;
  const topForm = byForm[0]?.form ?? null;

  const chartData = useMemo(() => buildStacked(data, range), [data, range]);
  const formsList = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.leads?.daily ?? []) {
      if (String(r[0]) >= range.start && String(r[0]) <= range.end) {
        set.add(String(r[1] ?? "unknown"));
      }
    }
    return Array.from(set);
  }, [data.leads?.daily, range]);

  const leadsFirstDate = data.leads?.first_date;
  const showHistoricNote = leadsFirstDate && range.start < leadsFirstDate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`Contatti generati (form del sito + WhatsApp) · ${range.days} giorni · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Contatti
      </SectionTitle>

      {showHistoricNote && (
        <div style={{
          background: palette.divider, border: `1px solid ${palette.cardBorder}`,
          borderRadius: 10, padding: "0.7rem 1rem", fontSize: 12, color: palette.textMuted,
        }}>
          <strong style={{ color: palette.text }}>Nota contatti:</strong> storico importato dal <strong>{fmtDate(leadsFirstDate)}</strong> (prima di quella data i contatori sono 0).
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile
          label="Contatti totali"
          value={integer(totalContatti)}
          delta={totalContattiPrev != null ? calcDelta(totalContatti, totalContattiPrev) : null}
          info={`Somma dei contatti generati da tutti i canali nel periodo (${range.days} giorni)`}
          accent={ACCENT}
        />
        <KpiTile
          label="Sorgente più attiva"
          value={topForm ?? "—"}
          info="Il canale (form o WhatsApp) che ha generato il maggior numero di contatti nel periodo"
          sub={topForm && byForm[0] ? `${integer(byForm[0].count)} contatti (${pctStr(totalContatti > 0 ? (byForm[0].count / totalContatti) * 100 : 0, 1)})` : undefined}
        />
        <KpiTile
          label="Sorgenti attive"
          value={String(byForm.length)}
          info="Numero di sorgenti (form del sito + WhatsApp) che hanno generato almeno un contatto nel periodo"
        />
      </div>

      {/* Chart giornaliero stacked */}
      <Card>
        <CardHeader title={`Andamento contatti per sorgente · ${range.days} giorni`} />
        {chartData.length === 0 ? (
          <EmptyState label="Nessun contatto nel periodo" />
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
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
                {formsList.map((form, i) => (
                  <Bar key={form} dataKey={`form_${form}`} name={form}
                    stackId="a" fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                    radius={i === formsList.length - 1 ? [3, 3, 0, 0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Tabella per sorgente */}
      <Card>
        <CardHeader title="Contatti per sorgente" />
        {byForm.length === 0 ? <EmptyState label="Nessun contatto nel periodo" /> : (
          <FormsTable rows={byForm} totalCur={totalContatti} prevMap={byFormPrev} showCompare={!!compareRange} />
        )}
      </Card>
    </div>
  );
}

function FormsTable({
  rows, totalCur, prevMap, showCompare,
}: {
  rows: { form: string; count: number }[]; totalCur: number;
  prevMap: Map<string, number>; showCompare: boolean;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Sorgente</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Contatti</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Quota</th>
            {showCompare && <th style={{ ...ts.th, ...ts.thRight }}>Δ vs comparazione</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const share = totalCur > 0 ? (r.count / totalCur) * 100 : 0;
            const prev = prevMap.get(r.form) ?? 0;
            const d = showCompare ? calcDelta(r.count, prev > 0 ? prev : null) : null;
            return (
              <tr key={i}>
                <td style={{ ...ts.tdBase, fontWeight: 500, color: palette.text }}>{r.form}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(r.count)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(share, 1)}</td>
                {showCompare && (
                  <td style={{ ...ts.tdBase, ...ts.tdRight, color: d?.color ?? ts.tdBase.color, fontWeight: 600 }}>
                    {d ? `${d.arrow} ${d.label}` : "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type StackedRow = { date: string; label: string; [form: string]: string | number };

function buildStacked(data: CentogiriData, range: { start: string; end: string }): StackedRow[] {
  const byDate = new Map<string, StackedRow>();
  for (const r of data.leads?.daily ?? []) {
    const d = String(r[0] ?? "");
    if (d < range.start || d > range.end) continue;
    const form = String(r[1] ?? "unknown");
    const count = Number(r[2]) || 0;
    const row: StackedRow = byDate.get(d) ?? { date: d, label: fmtDate(d) };
    const key = `form_${form}`;
    row[key] = ((row[key] as number) ?? 0) + count;
    byDate.set(d, row);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
