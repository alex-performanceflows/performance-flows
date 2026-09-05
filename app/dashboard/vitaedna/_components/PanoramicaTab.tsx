"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import {
  DashboardData, BlendedWindow,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  KITS, kitOf, KIT_COLORS, CHART_PALETTE,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, tableStyles, useTheme,
  useRange, useNav, RANGE_DAYS, RANGE_LABEL, RangeKey, TabKey,
  lastNDays,
} from "./shared";

const ROAS_GOOD = 2.0;

export function PanoramicaTab({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const { range } = useRange();
  const { setTab } = useNav();

  const rangeDays = RANGE_DAYS[range];

  // KPIs: usa woo.totals[range] dove disponibile, altrimenti compute da daily
  const wooCur = data.woo?.totals?.[range];
  const wooPrev = range === "w30" ? data.woo?.totals?.p30 : null;
  const b30 = data.blended?.w30;
  const bP30 = data.blended?.p30;
  const ga430 = data.ga4?.totals?.w30;
  const ga4P30 = data.ga4?.totals?.p30;

  // Sessioni: per range diverso da w30 aggreghiamo da ga4.daily
  const sessAgg = useMemo(() => aggregateDaily(data.ga4?.daily ?? [], rangeDays, 1), [data.ga4?.daily, rangeDays]);

  // Sparkline series (ultimi 30 giorni per contesto trend)
  const wooSpark = useMemo(() => lastNDays(data.woo?.daily as (string | number)[][], 30).map((r) => Number(r[1]) || 0), [data.woo?.daily]);
  const ordersSpark = useMemo(() => lastNDays(data.woo?.daily as (string | number)[][], 30).map((r) => Number(r[2]) || 0), [data.woo?.daily]);
  const sessSpark = useMemo(() => lastNDays(data.ga4?.daily as (string | number)[][], 30).map((r) => Number(r[1]) || 0), [data.ga4?.daily]);
  const aovSpark = useMemo(() => lastNDays(data.woo?.daily as (string | number)[][], 30).map((r) => {
    const rev = Number(r[1]) || 0; const ord = Number(r[2]) || 0;
    return ord > 0 ? rev / ord : 0;
  }), [data.woo?.daily]);

  const chartData = useMemo(() => buildDailyChartData(data, rangeDays), [data, rangeDays]);
  const adsRollup = useMemo(() => rollupAdsPlatforms(data, bP30), [data, bP30]);
  const gscDaily = useMemo(() => buildGscDailyChart(data.gsc?.daily ?? [], rangeDays), [data.gsc?.daily, rangeDays]);

  // Alert azioni consigliate (contatori verdetti creatività)
  const verdicts = useMemo(() => computeVerdictCounts(data), [data]);
  const hasActions = verdicts.spegni > 0 || verdicts.fatigue > 0 || verdicts.scala > 0;

  const rangeSuffix = range === "w30"
    ? "vs 30 giorni precedenti"
    : `finestra ${RANGE_LABEL[range]} · confronto vs periodo precedente parziale`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`Vista d'insieme · ${rangeSuffix}`}>Panoramica</SectionTitle>

      {/* Alert azioni consigliate */}
      {hasActions && (
        <ActionsBox
          scala={verdicts.scala}
          fatigue={verdicts.fatigue}
          spegni={verdicts.spegni}
          onOpenAds={() => setTab("advertising")}
        />
      )}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile
          label="Fatturato Woo"
          value={eur0(wooCur?.revenue ?? 0)}
          delta={wooPrev ? calcDelta(wooCur?.revenue, wooPrev.revenue) : null}
          info={`Somma dei ricavi lordi WooCommerce negli ultimi ${rangeDays} giorni`}
          sparkline={wooSpark}
          sparklineColor="#64CBFF"
          onClick={() => setTab("ecommerce")}
        />
        <KpiTile
          label="Ordini Woo"
          value={integer(wooCur?.orders ?? 0)}
          delta={wooPrev ? calcDelta(wooCur?.orders, wooPrev.orders) : null}
          info={`Numero di ordini WooCommerce completati negli ultimi ${rangeDays} giorni`}
          sparkline={ordersSpark}
          sparklineColor="#96C228"
          onClick={() => setTab("ecommerce")}
        />
        <KpiTile
          label="AOV Woo"
          value={eur(wooCur?.aov ?? 0)}
          delta={wooPrev ? calcDelta(wooCur?.aov, wooPrev.aov) : null}
          info="Valore medio ordine (Average Order Value): fatturato ÷ numero ordini"
          sparkline={aovSpark}
          sparklineColor="#00978F"
          onClick={() => setTab("ecommerce")}
        />
        <KpiTile
          label="Spesa adv totale"
          value={eur0(b30?.spend_total ?? 0)}
          delta={calcDelta(b30?.spend_total, bP30?.spend_total)}
          info="Investimento totale advertising negli ultimi 30g (dato disponibile solo su finestra 30g): somma di Meta Ads + Google Ads"
          onClick={() => setTab("advertising")}
        />
        <KpiTile
          label="MER"
          value={num(b30?.mer ?? 0, 2)}
          delta={calcDelta(b30?.mer, bP30?.mer)}
          info="Marketing Efficiency Ratio: Fatturato Woo ÷ Spesa adv totale (finestra 30g). Un MER di 2,00 = 2€ di ricavi per ogni 1€ investito"
          onClick={() => setTab("advertising")}
        />
        <KpiTile
          label="Sessioni GA4"
          value={integer(range === "w30" ? (ga430?.sessions ?? 0) : sessAgg.current)}
          delta={range === "w30"
            ? calcDelta(ga430?.sessions, ga4P30?.sessions)
            : calcDelta(sessAgg.current, sessAgg.previous)}
          info={`Numero di sessioni registrate da Google Analytics 4 negli ultimi ${rangeDays} giorni`}
          sparkline={sessSpark}
          sparklineColor="#EB9115"
          onClick={() => setTab("traffico")}
        />
      </div>

      {/* Bar chart · Revenue Woo (finestra selezionata) */}
      <Card>
        <CardHeader title={`Andamento fatturato · Ultimi ${rangeDays} giorni`} />
        {chartData.length === 0 ? (
          <EmptyState label="Nessun dato giornaliero disponibile" />
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 12, bottom: 4, left: 12 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="dateLabel"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={70} />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: palette.buttonHover }} />
                <Bar dataKey="revenue" name="Revenue Woo" fill="#64CBFF" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Ripartizione ads + tracking gap */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Ripartizione advertising" />
          {b30 ? <AdsSplit b30={b30} rollup={adsRollup} /> : <EmptyState />}
        </Card>
        <Card>
          <CardHeader title="Tracking gap · GA4 vs WooCommerce" />
          <TrackingGap b30={b30} />
        </Card>
      </div>

      {/* Kit prodotti bar chart */}
      <Card>
        <CardHeader title="Vendite per kit prodotto" />
        <KitBars data={data} />
      </Card>

      {/* Top canali GA4 + Top prodotti */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Top canali di acquisizione · Ultimi 30g" />
          <TopChannels data={data} />
        </Card>
        <Card>
          <CardHeader title="Top prodotti" />
          <TopProducts data={data} />
        </Card>
      </div>

      {/* Top campagne Meta + Google */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Top campagne Meta · Ultimi 30g" />
          <TopMetaCampaigns data={data} />
        </Card>
        <Card>
          <CardHeader title="Top campagne Google Ads · Ultimi 30g" />
          <TopGadsCampaigns data={data} />
        </Card>
      </div>

      {/* Devices + Top paesi */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Dispositivi" />
          <DevicesMini data={data} />
        </Card>
        <Card>
          <CardHeader title="Top paesi" />
          <TopCountries data={data} />
        </Card>
      </div>

      {/* Click organici giornalieri (GSC) */}
      <Card>
        <CardHeader title={`Click organici giornalieri · Search Console · Ultimi ${rangeDays} giorni`} />
        {gscDaily.length === 0 ? (
          <EmptyState label="In attesa dei primi dati Search Console" />
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={gscDaily} margin={{ top: 10, right: 12, bottom: 4, left: 12 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="dateLabel"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => integer(Number(v))} width={50} />
                <Tooltip content={<GscClicksTooltip />} cursor={{ fill: palette.buttonHover }} />
                <Bar dataKey="clicks" name="Click" fill="#96C228" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function TrackingGap({ b30 }: { b30: BlendedWindow | undefined }) {
  const { palette } = useTheme();
  if (!b30) return <EmptyState label="Dati blended non disponibili" />;
  const woo = b30.revenue_woo ?? 0;
  const ga4 = b30.revenue_ga4 ?? 0;
  const trackedPct = woo > 0 ? Math.min(100, (ga4 / woo) * 100) : 0;
  const gapPct = b30.tracking_gap_pct ?? Math.max(0, 100 - trackedPct);
  const gapColor = gapPct <= 5 ? "#22c55e" : gapPct <= 20 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <p style={{ margin: 0, fontSize: 10, color: palette.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue Woo</p>
        <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 700, color: "#64CBFF", fontVariantNumeric: "tabular-nums" }}>{eur0(woo)}</p>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, color: palette.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Revenue GA4</p>
        <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 700, color: "#EB9115", fontVariantNumeric: "tabular-nums" }}>{eur0(ga4)}</p>
      </div>
      <div style={{ gridColumn: "1 / -1", paddingTop: 6, borderTop: `1px solid ${palette.divider}` }}>
        <p style={{ margin: 0, fontSize: 10, color: palette.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Transazioni non tracciate</p>
        <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, color: gapColor, fontVariantNumeric: "tabular-nums" }}>{pctStr(gapPct, 1)}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.textDim }}>
          Differenza revenue: {eur(Math.max(0, woo - ga4))}
        </p>
      </div>
    </div>
  );
}

type AdsPlatformStat = {
  platform: string;
  color: string;
  spend: number;
  spendPrev: number | null;
  revenue: number;
  roas: number;
};

function rollupAdsPlatforms(data: DashboardData, bP30: BlendedWindow | undefined): AdsPlatformStat[] {
  const metaCampaigns = data.meta?.campaigns?.w30 ?? [];
  let metaSpend = 0, metaRevenue = 0;
  for (const r of metaCampaigns) {
    metaSpend += Number(r[1]) || 0;
    metaRevenue += Number(r[6]) || 0;
  }

  const gads = data.gads ?? [];
  let gadsSpend = 0, gadsRevenue = 0;
  for (const r of gads) {
    gadsSpend += Number(r[4]) || 0;
    gadsRevenue += Number(r[6]) || 0;
  }

  return [
    {
      platform: "Meta",
      color: "#4267B2",
      spend: metaSpend,
      spendPrev: bP30?.spend_meta ?? null,
      revenue: metaRevenue,
      roas: metaSpend > 0 ? metaRevenue / metaSpend : 0,
    },
    {
      platform: "Google Ads",
      color: "#DB4437",
      spend: gadsSpend,
      spendPrev: bP30?.spend_gads ?? null,
      revenue: gadsRevenue,
      roas: gadsSpend > 0 ? gadsRevenue / gadsSpend : 0,
    },
  ];
}

function AdsSplit({ b30, rollup }: { b30: BlendedWindow; rollup: AdsPlatformStat[] }) {
  const { palette } = useTheme();
  const total = b30.spend_total || 1;

  return (
    <div>
      {/* Progress bar Meta/Google */}
      <div style={{
        display: "flex", height: 10, borderRadius: 6, overflow: "hidden",
        background: palette.divider, marginBottom: 12,
      }}>
        {rollup.map((r) => {
          const pct = total > 0 ? (r.spend / total) * 100 : 0;
          if (pct <= 0) return null;
          return <div key={r.platform} title={`${r.platform} ${pctStr(pct, 1)}`}
            style={{ width: `${pct}%`, background: r.color, transition: "width 0.3s" }} />;
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {rollup.map((r) => {
          const share = total > 0 ? (r.spend / total) * 100 : 0;
          const delta = calcDelta(r.spend, r.spendPrev);
          return (
            <div key={r.platform} style={{
              padding: "10px 12px", borderRadius: 10,
              background: palette.divider,
              border: `1px solid ${palette.cardBorder}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: palette.text }}>{r.platform}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: palette.textDim }}>{pctStr(share, 1)}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 17, fontWeight: 700, color: palette.text, fontVariantNumeric: "tabular-nums" }}>
                {eur0(r.spend)}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: r.roas >= ROAS_GOOD ? "#22c55e" : r.roas > 0 ? palette.textMuted : palette.textDim, fontWeight: 600 }}>
                  ROAS {num(r.roas, 2)}
                </span>
                {delta && (
                  <span style={{ fontSize: 11, color: delta.color, fontWeight: 600 }}>
                    {delta.arrow} {delta.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KitBars({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const kits = useMemo(() => {
    const acc: Record<string, { key: string; label: string; color: string; revenue: number; qty: number }> = {};
    for (const k of KITS) acc[k.key] = { key: k.key, label: k.label, color: k.color, revenue: 0, qty: 0 };
    acc.altri = { key: "altri", label: "Altri", color: KIT_COLORS.altri, revenue: 0, qty: 0 };
    for (const r of data.woo?.by_product ?? []) {
      const kk = kitOf(String(r[0] ?? ""));
      acc[kk].revenue += Number(r[2]) || 0;
      acc[kk].qty += Number(r[1]) || 0;
    }
    return Object.values(acc).filter((r) => r.revenue > 0 || r.qty > 0);
  }, [data]);

  if (kits.length === 0) return <EmptyState label="Nessuna vendita categorizzata per kit" />;

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={kits} margin={{ top: 6, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={palette.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: palette.textMuted, fontSize: 12 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
          <YAxis tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => eur0(Number(v))} width={70} />
          <Tooltip
            cursor={{ fill: palette.buttonHover }}
            contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
            formatter={(_v: unknown, _n: unknown, p: unknown) => {
              const payload = (p as { payload?: { revenue?: number; qty?: number } })?.payload ?? {};
              return [`${eur(payload.revenue ?? 0)} · ${integer(payload.qty ?? 0)} pz`, "Vendite"];
            }}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {kits.map((k) => <Cell key={k.key} fill={k.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopChannels({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const rows = (data.ga4?.channels?.w30 ?? [])
    .filter((r) => (Number(r[3]) || 0) > 0)
    .sort((a, b) => (Number(b[4]) || 0) - (Number(a[4]) || 0))
    .slice(0, 5);
  if (rows.length === 0) return <EmptyState label="Nessun canale con transazioni" />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Canale</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Trans.</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...ts.tdBase, color: "#96C228", fontWeight: 600 }}>{String(r[0] ?? "—")}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(Number(r[3]))}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(Number(r[4]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopProducts({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const rows = [...(data.woo?.by_product ?? [])]
    .sort((a, b) => (Number(b[2]) || 0) - (Number(a[2]) || 0))
    .slice(0, 5);
  if (rows.length === 0) return <EmptyState label="Nessun prodotto nel periodo" />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Prodotto</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Qty</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const kitKey = kitOf(String(r[0] ?? ""));
            const kitColor = KIT_COLORS[kitKey];
            return (
              <tr key={i}>
                <td style={ts.tdBase}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: kitColor, flexShrink: 0 }} />
                    <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(r[0])}>
                      {String(r[0] ?? "—")}
                    </span>
                  </div>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(Number(r[2]))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopMetaCampaigns({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const rows = [...(data.meta?.campaigns?.w30 ?? [])]
    .sort((a, b) => (Number(b[7]) || 0) - (Number(a[7]) || 0))
    .slice(0, 3);
  if (rows.length === 0) return <EmptyState label="Nessuna campagna Meta" />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Campagna</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
            <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const roas = Number(r[7]) || 0;
            return (
              <tr key={i}>
                <td style={{ ...ts.tdBase, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(r[0])}>
                  {String(r[0] ?? "—")}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(Number(r[1]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(Number(r[6]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: roas >= ROAS_GOOD ? "#22c55e" : roas < 1 ? "#ef4444" : ts.tdBase.color, fontWeight: 700 }}>
                  {num(roas, 2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopGadsCampaigns({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const rows = [...(data.gads ?? [])]
    .sort((a, b) => (Number(b[8]) || 0) - (Number(a[8]) || 0))
    .slice(0, 3);
  if (rows.length === 0) return <EmptyState label="Nessuna campagna Google Ads" />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Campagna</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Costo 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Valore 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const roas = Number(r[8]) || 0;
            return (
              <tr key={i}>
                <td style={{ ...ts.tdBase, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(r[0])}>
                  {String(r[0] ?? "—")}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(Number(r[4]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(Number(r[6]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: roas >= ROAS_GOOD ? "#22c55e" : roas < 1 ? "#ef4444" : ts.tdBase.color, fontWeight: 700 }}>
                  {num(roas, 2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DevicesMini({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const devices = (data.ga4?.devices ?? []).map((r, i) => ({
    name: labelize(String(r[0] ?? "")),
    sessions: Number(r[1]) || 0,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));
  const total = devices.reduce((a, r) => a + r.sessions, 0);
  if (devices.length === 0 || total === 0) return <EmptyState label="Nessun dato device" />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "center" }}>
      <div style={{ width: 160, height: 160 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={devices} dataKey="sessions" nameKey="name"
              cx="50%" cy="50%" innerRadius={40} outerRadius={70}
              paddingAngle={2} stroke="none">
              {devices.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {devices.map((d) => {
          const pct = (d.sessions / total) * 100;
          return (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: palette.text, flex: 1 }}>{d.name}</span>
              <span style={{ fontSize: 12, color: palette.textDim, fontVariantNumeric: "tabular-nums" }}>
                {integer(d.sessions)}
              </span>
              <span style={{ fontSize: 11, color: palette.textDim, fontVariantNumeric: "tabular-nums", minWidth: 50, textAlign: "right" }}>
                {pctStr(pct, 1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopCountries({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const rows = [...(data.ga4?.geo?.country ?? [])]
    .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
    .slice(0, 5);
  if (rows.length === 0) return <EmptyState label="Nessun dato paese" />;
  const max = Math.max(...rows.map((r) => Number(r[1]) || 0));
  return (
    <div>
      {rows.map((r, i) => {
        const users = Number(r[1]) || 0;
        const barWidth = max > 0 ? (users / max) * 100 : 0;
        return (
          <div key={i} style={{ padding: "6px 0", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${palette.cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: palette.text }}>{String(r[0] ?? "—")}</span>
              <span style={{ color: palette.textDim, fontVariantNumeric: "tabular-nums" }}>
                {integer(users)}
              </span>
            </div>
            <div style={{ height: 4, background: palette.divider, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${barWidth}%`, height: "100%", background: "#64CBFF", transition: "width 0.3s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

type Row = { date: string; dateLabel: string; revenue: number; sessions: number };

function buildDailyChartData(data: DashboardData, days = 90): Row[] {
  const wooDaily = data.woo?.daily ?? [];
  const ga4Daily = data.ga4?.daily ?? [];
  const map = new Map<string, Row>();

  for (const r of wooDaily) {
    const date = String(r[0] ?? "");
    if (!date) continue;
    map.set(date, { date, dateLabel: fmtDate(date), revenue: Number(r[1]) || 0, sessions: 0 });
  }
  for (const r of ga4Daily) {
    const date = String(r[0] ?? "");
    if (!date) continue;
    const sessions = Number(r[1]) || 0;
    const existing = map.get(date);
    if (existing) existing.sessions = sessions;
    else map.set(date, { date, dateLabel: fmtDate(date), revenue: 0, sessions });
  }

  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RevenueTooltip({ active, payload, label }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{
      background: palette.tooltipBg,
      border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.6rem 0.75rem",
      fontSize: 12, color: palette.text,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    }}>
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, color: p.color, fontVariantNumeric: "tabular-nums" }}>
        Revenue Woo: {eur(Number(p.value ?? 0))}
      </p>
    </div>
  );
}

function labelize(s: string): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Ultimi N giorni di click organici da gsc.daily, ordinati asc
function buildGscDailyChart(daily: (string | number)[][], days = 90): { date: string; dateLabel: string; clicks: number }[] {
  if (!daily || daily.length === 0) return [];
  return [...daily]
    .filter((r) => r && r.length >= 2)
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .slice(-days)
    .map((r) => {
      const date = String(r[0] ?? "");
      return { date, dateLabel: fmtDate(date), clicks: Number(r[1]) || 0 };
    });
}

// Aggrega ultimi N giorni + N giorni precedenti da una serie daily [data, val, ...]
function aggregateDaily(daily: (string | number)[][], days: number, valueIdx: number): { current: number; previous: number | null } {
  if (!daily || daily.length === 0) return { current: 0, previous: null };
  const sorted = [...daily]
    .filter((r) => r && r.length > valueIdx)
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const end = sorted.length;
  const currStart = Math.max(0, end - days);
  const prevEnd = currStart;
  const prevStart = Math.max(0, prevEnd - days);
  const curr = sorted.slice(currStart, end);
  const prev = sorted.slice(prevStart, prevEnd);
  let cSum = 0, pSum = 0;
  for (const r of curr) cSum += Number(r[valueIdx]) || 0;
  if (prev.length === 0) return { current: cSum, previous: null };
  for (const r of prev) pSum += Number(r[valueIdx]) || 0;
  return { current: cSum, previous: pSum };
}

// Verdetti creatività (stessa logica di AdvertisingTab, semplificata per contatori)
function computeVerdictCounts(data: DashboardData): { scala: number; fatigue: number; spegni: number } {
  const w30rows = data.meta?.creatives?.w30?.rows ?? [];
  const w7rows = data.meta?.creatives?.w7?.rows ?? [];
  const w7Map = new Map<string, (string | number)[]>();
  for (const r of w7rows) w7Map.set(String(r[0] ?? "").toLowerCase().trim(), r);

  let scala = 0, fatigue = 0, spegni = 0;
  const MIN_SPEND = 100, ROAS_GOOD_V = 2.0, FREQ_HIGH = 2.6, CTR_DROP = 0.20;

  for (const r30 of w30rows) {
    if (String(r30[1] ?? "") !== "ACTIVE") continue;
    const spesa = Number(r30[2]) || 0;
    const acquisti = Number(r30[10]) || 0;
    const roas = Number(r30[13]) || 0;

    // SPEGNI
    if ((spesa >= MIN_SPEND && acquisti === 0) || (roas > 0 && roas < 1)) { spegni++; continue; }
    // OSSERVA (skip counter)
    if (spesa < MIN_SPEND) continue;

    if (roas >= ROAS_GOOD_V) {
      const w7 = w7Map.get(String(r30[0] ?? "").toLowerCase().trim());
      const freqW7 = w7 ? Number(w7[5]) || 0 : 0;
      const ctrW7 = w7 ? Number(w7[7]) || 0 : 0;
      const ctrW30 = Number(r30[7]) || 0;

      if (freqW7 >= FREQ_HIGH) { fatigue++; continue; }
      if (w7 && ctrW30 > 0 && (ctrW7 / ctrW30) < 1 - CTR_DROP) { fatigue++; continue; }
      if (w7 && freqW7 < FREQ_HIGH && ctrW7 >= ctrW30) { scala++; continue; }
    }
  }
  return { scala, fatigue, spegni };
}

// ─── AlertBox ─────────────────────────────────────────────────────

function ActionsBox({
  scala, fatigue, spegni, onOpenAds,
}: {
  scala: number; fatigue: number; spegni: number; onOpenAds: () => void;
}) {
  const { palette } = useTheme();
  const items: { count: number; label: string; color: string }[] = [];
  if (spegni > 0) items.push({ count: spegni, label: spegni === 1 ? "creatività da spegnere" : "creatività da spegnere", color: "#ef4444" });
  if (fatigue > 0) items.push({ count: fatigue, label: fatigue === 1 ? "in fatigue in arrivo" : "in fatigue in arrivo", color: "#f59e0b" });
  if (scala > 0) items.push({ count: scala, label: scala === 1 ? "da scalare" : "da scalare", color: "#22c55e" });

  return (
    <button
      onClick={onOpenAds}
      className="pf-noprint"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
        padding: "0.9rem 1.15rem", borderRadius: 12,
        background: palette.cardBg,
        border: `1px solid ${palette.cardBorder}`,
        color: palette.text, fontFamily: "inherit", textAlign: "left",
        cursor: "pointer", width: "100%",
        boxShadow: palette.cardShadow,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: palette.textDim,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          Azioni consigliate
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {items.map((it) => (
            <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 22, height: 22, padding: "0 6px", borderRadius: 11,
                background: it.color, color: "#ffffff",
                fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums",
              }}>{it.count}</span>
              <span style={{ fontSize: 13, color: palette.text }}>{it.label}</span>
            </span>
          ))}
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: palette.textMuted, whiteSpace: "nowrap" }}>
        Vai ad Advertising →
      </span>
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GscClicksTooltip({ active, payload, label }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const v = Number(payload[0].value ?? 0);
  return (
    <div style={{
      background: palette.tooltipBg,
      border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.5rem 0.7rem",
      fontSize: 12, color: palette.text,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    }}>
      <p style={{ margin: 0, fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ margin: 0, color: "#96C228", fontVariantNumeric: "tabular-nums" }}>
        Click organici: {integer(v)}
      </p>
    </div>
  );
}
