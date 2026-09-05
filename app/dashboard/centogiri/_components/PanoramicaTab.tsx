"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ComposedChart, Line,
} from "recharts";
import {
  CentogiriData, useDateRange, useNav, useTheme,
  calcDelta, invertDeltaColor, eur, eur0, integer, num, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  CHART_PALETTE, ACCENT, BRAND_CYAN, COMPARE_LABEL,
  sumInRange,
} from "./shared";

export function PanoramicaTab({ data }: { data: CentogiriData }) {
  const { palette } = useTheme();
  const { range, compareRange, compare } = useDateRange();
  const { setTab } = useNav();

  // ─── Aggregati sul range ─────────────────────────────────────────
  const contattiCur = sumInRange(data.leads?.daily, range, 2);
  const contattiPrev = compareRange ? sumInRange(data.leads?.daily, compareRange, 2) : null;

  const sessCur = sumInRange(data.ga4?.daily, range, 1);
  const sessPrev = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;

  const clicksCur = sumInRange(data.gsc?.daily, range, 1);
  const clicksPrev = compareRange ? sumInRange(data.gsc?.daily, compareRange, 1) : null;

  // Spesa adv (meta.campaigns_daily.spesa[3] + gads_daily.costo[3])
  const spendMetaCur = sumInRange(data.meta?.campaigns_daily, range, 3);
  const spendGadsCur = sumInRange(data.gads_daily, range, 3);
  const spendCur = spendMetaCur + spendGadsCur;
  const spendMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 3) : 0;
  const spendGadsPrev = compareRange ? sumInRange(data.gads_daily, compareRange, 3) : 0;
  const spendPrev = compareRange ? spendMetaPrev + spendGadsPrev : null;

  // Costo per Contatto = spesa / contatti
  const cpcCur = contattiCur > 0 ? spendCur / contattiCur : 0;
  const cpcPrev = compareRange && contattiPrev && contattiPrev > 0 && spendPrev != null && spendPrev > 0
    ? spendPrev / contattiPrev
    : null;

  // ─── Chart giornaliero lead impilati per form + sessioni ────────
  const chartData = useMemo(() => buildStackedLeadsChart(data, range), [data, range]);
  const formsList = useMemo(() => {
    const set = new Set<string>();
    for (const r of data.leads?.daily ?? []) {
      if (String(r[0]) >= range.start && String(r[0]) <= range.end) {
        set.add(String(r[1] ?? "unknown"));
      }
    }
    return Array.from(set);
  }, [data.leads?.daily, range]);

  // ─── Nota storico ────────────────────────────────────────────────
  const leadsFirstDate = data.leads?.first_date;
  const showHistoricNote = leadsFirstDate && range.start < leadsFirstDate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`Vista d'insieme · ${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Panoramica
      </SectionTitle>

      {showHistoricNote && (
        <div style={{
          background: palette.divider,
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: 10, padding: "0.7rem 1rem",
          fontSize: 12, color: palette.textMuted,
        }}>
          <strong style={{ color: palette.text }}>Nota contatti:</strong> lo storico è disponibile dal <strong>{fmtDate(leadsFirstDate)}</strong>. Nel range selezionato le date antecedenti hanno conteggio 0.
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile
          label="Contatti totali"
          value={integer(contattiCur)}
          delta={contattiPrev != null ? calcDelta(contattiCur, contattiPrev) : null}
          info={`Numero di contatti generati (form del sito + WhatsApp) nel periodo (${range.days} giorni)`}
          accent={ACCENT}
          onClick={() => setTab("lead")}
        />
        <KpiTile
          label="Costo per Contatto"
          value={eur(cpcCur)}
          delta={cpcPrev != null ? invertDeltaColor(calcDelta(cpcCur, cpcPrev)) : null}
          info="Costo medio per contatto: (Spesa Meta + Google Ads) ÷ Contatti totali del periodo. Se sale è peggio (rosso), se scende è meglio (verde)"
          onClick={() => setTab("advertising")}
        />
        <KpiTile
          label="Spesa adv totale"
          value={eur0(spendCur)}
          delta={spendPrev != null ? calcDelta(spendCur, spendPrev) : null}
          info={`Investimento advertising nel periodo: Meta ${eur0(spendMetaCur)} + Google Ads ${eur0(spendGadsCur)}`}
          onClick={() => setTab("advertising")}
        />
        <KpiTile
          label="Sessioni sito"
          value={integer(sessCur)}
          delta={sessPrev != null ? calcDelta(sessCur, sessPrev) : null}
          info={`Sessioni sul sito registrate da Google Analytics 4 nel periodo (${range.days} giorni)`}
          onClick={() => setTab("traffico")}
        />
        <KpiTile
          label="Click organici GSC"
          value={integer(clicksCur)}
          delta={clicksPrev != null ? calcDelta(clicksCur, clicksPrev) : null}
          info="Click da risultati organici Google (Search Console). Ritardo ~3 giorni sui dati più recenti"
          onClick={() => setTab("seo")}
        />
      </div>

      {/* Chart giornaliero: contatti impilati per form + sessioni */}
      <Card>
        <CardHeader title={`Andamento contatti e sessioni · ${range.days} giorni`} />
        {chartData.length === 0 ? (
          <EmptyState label="Nessun dato giornaliero nel periodo" />
        ) : (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis yAxisId="left"
                  tick={{ fill: ACCENT, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <YAxis yAxisId="right" orientation="right"
                  tick={{ fill: BRAND_CYAN, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip
                  contentStyle={{
                    background: palette.tooltipBg,
                    border: `1px solid ${palette.tooltipBorder}`,
                    borderRadius: 8, color: palette.text, fontSize: 12,
                  }}
                  formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                {formsList.map((form, i) => (
                  <Bar key={form} yAxisId="left" dataKey={`form_${form}`} name={form}
                    stackId="leads" fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                    radius={i === formsList.length - 1 ? [3, 3, 0, 0] : undefined} />
                ))}
                <Line yAxisId="right" type="monotone" dataKey="sessioni" name="Sessioni sito"
                  stroke={BRAND_CYAN} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

type StackedRow = { date: string; label: string; sessioni: number; [form: string]: string | number };

function buildStackedLeadsChart(data: CentogiriData, range: { start: string; end: string }): StackedRow[] {
  const byDate = new Map<string, StackedRow>();

  // Sessioni GA4
  for (const r of data.ga4?.daily ?? []) {
    const d = String(r[0] ?? "");
    if (d < range.start || d > range.end) continue;
    const row: StackedRow = byDate.get(d) ?? { date: d, label: fmtDate(d), sessioni: 0 };
    row.sessioni = Number(r[1]) || 0;
    byDate.set(d, row);
  }

  // Lead per form
  for (const r of data.leads?.daily ?? []) {
    const d = String(r[0] ?? "");
    if (d < range.start || d > range.end) continue;
    const form = String(r[1] ?? "unknown");
    const count = Number(r[2]) || 0;
    const row: StackedRow = byDate.get(d) ?? { date: d, label: fmtDate(d), sessioni: 0 };
    const key = `form_${form}`;
    row[key] = ((row[key] as number) ?? 0) + count;
    byDate.set(d, row);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

