"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  GondolinaData, useDateRange, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, tableStyles,
  ACCENT, GOLD, CHART_PALETTE, COMPARE_LABEL,
  sumInRange, dailyInRange, groupInRange,
} from "./shared";

type SubTab = "andamento" | "funnel" | "canali" | "sources" | "landing" | "prodotti" | "pubblico";

const SUB: { key: SubTab; label: string }[] = [
  { key: "andamento", label: "Andamento" },
  { key: "funnel", label: "Funnel" },
  { key: "canali", label: "Canali" },
  { key: "sources", label: "Sorgenti e campagne (30g)" },
  { key: "landing", label: "Landing page (30g)" },
  { key: "prodotti", label: "Prodotti" },
  { key: "pubblico", label: "Pubblico (30g)" },
];

export function TrafficoTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const [sub, setSub] = useState<SubTab>("andamento");
  const { range, compareRange, compare } = useDateRange();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`GA4 · ${range.days} giorni · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Traffico e conversione
      </SectionTitle>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SUB.map((s) => (
          <button key={s.key} onClick={() => setSub(s.key)} style={{
            padding: "0.5rem 0.9rem", borderRadius: 10,
            border: `1px solid ${sub === s.key ? palette.textFaint : palette.cardBorder}`,
            background: sub === s.key ? palette.buttonHover : "transparent",
            color: sub === s.key ? palette.text : palette.textMuted,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>{s.label}</button>
        ))}
      </div>

      {sub === "andamento" && <AndamentoView data={data} />}
      {sub === "funnel" && <FunnelView data={data} />}
      {sub === "canali" && <CanaliView data={data} />}
      {sub === "sources" && <SourcesView data={data} />}
      {sub === "landing" && <LandingView data={data} />}
      {sub === "prodotti" && <ProdottiView data={data} />}
      {sub === "pubblico" && <PubblicoView data={data} />}
    </div>
  );
}

// ── 3a Andamento ─────────────────────────────────────────────────

function AndamentoView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const sess = sumInRange(data.ga4?.daily, range, 1);
  const users = sumInRange(data.ga4?.daily, range, 2);
  const newUsers = sumInRange(data.ga4?.daily, range, 3);
  const sessP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null;
  const usersP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 2) : null;
  const newP = compareRange ? sumInRange(data.ga4?.daily, compareRange, 3) : null;
  const newPct = users > 0 ? (newUsers / users) * 100 : 0;
  const newPctP = usersP && usersP > 0 ? (newP! / usersP) * 100 : null;

  const chart = useMemo(() => {
    const cur = dailyInRange(data.ga4?.daily, range);
    const prev = compareRange ? dailyInRange(data.ga4?.daily, compareRange) : [];
    return cur.map((r, i) => ({
      label: fmtDate(String(r[0])),
      sessioni: Number(r[1]) || 0, utenti: Number(r[2]) || 0,
      prevSessioni: prev[i] ? Number(prev[i][1]) || 0 : null,
      prevUtenti: prev[i] ? Number(prev[i][2]) || 0 : null,
    }));
  }, [data.ga4?.daily, range, compareRange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <KpiTile label="Sessioni" value={integer(sess)} delta={sessP != null ? calcDelta(sess, sessP) : null} />
        <KpiTile label="Utenti" value={integer(users)} delta={usersP != null ? calcDelta(users, usersP) : null} />
        <KpiTile label="Nuovi utenti" value={integer(newUsers)} delta={newP != null ? calcDelta(newUsers, newP) : null} />
        <KpiTile label="Quota nuovi" value={pctStr(newPct, 1)} delta={newPctP != null ? calcDelta(newPct, newPctP) : null} info="Nuovi utenti ÷ Utenti × 100" />
      </div>
      <Card>
        <CardHeader title={`Sessioni e utenti · ${range.days} giorni`} />
        {chart.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                {compareRange && (
                  <>
                    <Line type="monotone" dataKey="prevSessioni" name="Sessioni (prec.)" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.5} dot={false} connectNulls />
                    <Line type="monotone" dataKey="prevUtenti" name="Utenti (prec.)" stroke={GOLD} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.5} dot={false} connectNulls />
                  </>
                )}
                <Line type="monotone" dataKey="sessioni" name="Sessioni" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="utenti" name="Utenti" stroke={GOLD} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 3b Funnel ────────────────────────────────────────────────────

function FunnelView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const sess = sumInRange(data.ga4?.funnel_daily, range, 1);
  const atc = sumInRange(data.ga4?.funnel_daily, range, 3);
  const co = sumInRange(data.ga4?.funnel_daily, range, 4);
  const buy = sumInRange(data.ga4?.funnel_daily, range, 5);

  const steps = [
    { label: "Sessioni", value: sess, from: null as number | null },
    { label: "Aggiunte al carrello", value: atc, from: sess },
    { label: "Checkout", value: co, from: atc },
    { label: "Acquisti", value: buy, from: co },
  ];

  const dailyRates = useMemo(() => {
    return dailyInRange(data.ga4?.funnel_daily, range).map((r) => {
      const s = Number(r[1]) || 0; const at = Number(r[3]) || 0; const ck = Number(r[4]) || 0; const bu = Number(r[5]) || 0;
      return {
        label: fmtDate(String(r[0])),
        carrello: s > 0 ? (at / s) * 100 : 0,
        checkout: at > 0 ? (ck / at) * 100 : 0,
        acquisto: ck > 0 ? (bu / ck) * 100 : 0,
      };
    });
  }, [data.ga4?.funnel_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title={`Funnel · ${range.days} giorni`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => {
            const rate = s.from && s.from > 0 ? (s.value / s.from) * 100 : null;
            const width = steps[0].value > 0 ? Math.max(15, (s.value / steps[0].value) * 100) : 0;
            return (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: palette.text, fontWeight: 500 }}>{s.label}</span>
                  <span style={{ color: palette.textMuted, fontVariantNumeric: "tabular-nums" }}>
                    {integer(s.value)} {rate != null && <span style={{ color: rate >= 20 ? "#22c55e" : rate >= 10 ? GOLD : palette.textDim, marginLeft: 8, fontWeight: 600 }}>({pctStr(rate, 1)})</span>}
                  </span>
                </div>
                <div style={{ height: 24, background: palette.divider, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${width}%`, height: "100%", background: `linear-gradient(90deg, ${ACCENT} 0%, ${GOLD} 100%)`, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardHeader title="Tassi di passaggio nel tempo" />
        {dailyRates.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={dailyRates} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => `${num(Number(v), 0)}%`} width={50} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [pctStr(Number(v ?? 0), 2), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                <Line type="monotone" dataKey="carrello" name="Sessioni → Carrello" stroke={ACCENT} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="checkout" name="Carrello → Checkout" stroke={GOLD} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="acquisto" name="Checkout → Acquisto" stroke="#4a7a8a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 3c Canali ─────────────────────────────────────────────────────

function CanaliView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const ts = tableStyles(palette);

  const rows = useMemo(() => {
    const g = groupInRange(data.ga4?.channels_daily, range, 1, [2, 3, 4, 5, 6]);
    return Array.from(g.entries()).map(([canale, [sess, users, nuovi, trans, rev]]) => {
      const cr = sess > 0 ? (trans / sess) * 100 : 0;
      return { canale, sess, users, nuovi, trans, rev, cr };
    }).sort((a, b) => b.sess - a.sess);
  }, [data.ga4?.channels_daily, range]);

  const prev = useMemo(() => compareRange ? groupInRange(data.ga4?.channels_daily, compareRange, 1, [2]) : null, [data.ga4?.channels_daily, compareRange]);

  // Area chart: canali nel tempo (top 5)
  const topChans = rows.slice(0, 5).map((r) => r.canale);
  const areaData = useMemo(() => {
    const byDate = new Map<string, Record<string, string | number>>();
    for (const r of data.ga4?.channels_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const chan = String(r[1]);
      if (!topChans.includes(chan)) continue;
      const row = byDate.get(d) ?? { date: d, label: fmtDate(d) };
      row[chan] = ((row[chan] as number) ?? 0) + (Number(r[2]) || 0);
      byDate.set(d, row);
    }
    return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [data.ga4?.channels_daily, range, topChans]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title={`Canali di acquisizione · ${range.days} giorni`} />
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Canale</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Sessioni</th>
                {compareRange && <th style={{ ...ts.th, ...ts.thRight }}>Δ sess.</th>}
                <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Nuovi</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Trans. GA4</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Revenue GA4</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CVR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const p = prev?.get(r.canale);
                const d = p != null ? calcDelta(r.sess, p[0]) : null;
                return (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: r.trans > 0 ? GOLD : palette.text, fontWeight: r.trans > 0 ? 600 : 500 }}>{r.canale}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.sess)}</td>
                    {compareRange && <td style={{ ...ts.tdBase, ...ts.tdRight, color: d?.color ?? ts.tdBase.color, fontWeight: 600 }}>{d ? `${d.arrow} ${d.label}` : "—"}</td>}
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.users)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.nuovi)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.trans > 0 ? 700 : 400 }}>{integer(r.trans)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.trans > 0 ? eur(r.rev) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.cr, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHeader title="Evoluzione canali (top 5) · Sessioni" />
        {areaData.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={areaData} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} tickFormatter={(v) => integer(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown, n: unknown) => [integer(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="rect" />
                {topChans.map((c, i) => (
                  <Area key={c} type="monotone" dataKey={c} stackId="1" stroke={CHART_PALETTE[i % CHART_PALETTE.length]} fill={CHART_PALETTE[i % CHART_PALETTE.length]} fillOpacity={0.6} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── 3d Sources & Campaigns (w30 fisso) ────────────────────────────

function SourcesView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const sources = data.ga4?.sources_w30 ?? [];
  const camps = data.ga4?.campaigns_w30 ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Sorgenti / Mezzo · 30g" />
          {sources.length === 0 ? <EmptyState /> : (
            <div style={{ overflowX: "auto", maxHeight: 420 }}>
              <table style={ts.table}>
                <thead><tr>
                  <th style={ts.th}>Sorgente</th><th style={ts.th}>Mezzo</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Sess.</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Trans.</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
                </tr></thead>
                <tbody>
                  {sources.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
                      <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textDim }}>{String(r[1])}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: Number(r[5]) > 0 ? 600 : 400 }}>{integer(Number(r[5]))}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{Number(r[5]) > 0 ? eur(Number(r[6])) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Campagne (UTM da GA4) · 30g" />
          {camps.length === 0 ? <EmptyState /> : (
            <div style={{ overflowX: "auto", maxHeight: 420 }}>
              <table style={ts.table}>
                <thead><tr>
                  <th style={ts.th}>Campagna</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Sess.</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Trans.</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
                </tr></thead>
                <tbody>
                  {camps.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(r[0])}>{String(r[0])}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: Number(r[4]) > 0 ? 600 : 400 }}>{integer(Number(r[4]))}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{Number(r[4]) > 0 ? eur(Number(r[5])) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
        <strong>Nota:</strong> le campagne qui sono quelle viste da GA4 tramite UTM, e possono differire dai nomi in Advertising. Un disallineamento sistematico segnala UTM mancanti o incoerenti.
      </p>
    </div>
  );
}

// ── 3e Landing (w30 fisso) ────────────────────────────────────────

function LandingView({ data }: { data: GondolinaData }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const rows = data.ga4?.landing_w30 ?? [];
  const warnBg = theme === "dark" ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.14)";
  return (
    <Card>
      <CardHeader title="Landing page · 30g" />
      {rows.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <th style={ts.th}>Pagina</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Sess.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Bounce rate</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Trans.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Revenue</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const bounce = Number(r[2]) || 0;
                const sess = Number(r[1]) || 0;
                const warn = bounce > 60 && sess > 100;
                return (
                  <tr key={i} style={{ background: warn ? warnBg : undefined }}>
                    <td style={{ ...ts.tdBase, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(r[0])}>{String(r[0])}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(sess)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: warn ? "#f59e0b" : ts.tdBase.color, fontWeight: warn ? 700 : 400 }}>{pctStr(bounce, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: Number(r[3]) > 0 ? 600 : 400 }}>{integer(Number(r[3]))}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{Number(r[3]) > 0 ? eur(Number(r[4])) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── 3f Prodotti ───────────────────────────────────────────────────

function ProdottiView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const [win, setWin] = useState<"w30" | "w90">("w30");
  const ts = tableStyles(palette);
  const rows = (win === "w30" ? data.ga4?.prodotti_w30 : data.ga4?.prodotti_w90) ?? [];
  const [sortBy, setSortBy] = useState<"rev" | "visti" | "atc" | "acq" | "tasso_atc" | "tasso_buy">("rev");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const enriched = useMemo(() => rows.map((r) => {
    const visti = Number(r[1]) || 0, atc = Number(r[2]) || 0, acq = Number(r[3]) || 0, rev = Number(r[4]) || 0;
    return { prod: String(r[0]), visti, atc, acq, rev, tasso_atc: visti > 0 ? (atc / visti) * 100 : 0, tasso_buy: atc > 0 ? (acq / atc) * 100 : 0 };
  }), [rows]);
  const sorted = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => sortDir === "desc" ? (b[sortBy] - a[sortBy]) : (a[sortBy] - b[sortBy]));
    return arr;
  }, [enriched, sortBy, sortDir]);
  function toggleSort(col: typeof sortBy) { if (sortBy === col) setSortDir(sortDir === "desc" ? "asc" : "desc"); else { setSortBy(col); setSortDir("desc"); } }
  function h(col: typeof sortBy, label: string, right = true) {
    return <th style={{ ...ts.th, ...(right ? ts.thRight : {}), cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(col)}>
      {label} {sortBy === col && <span style={{ color: GOLD }}>{sortDir === "desc" ? "▼" : "▲"}</span>}
    </th>;
  }

  return (
    <Card>
      <CardHeader title="Prodotti (GA4)" right={
        <div style={{ display: "flex", gap: 6 }}>
          <Pill active={win === "w30"} onClick={() => setWin("w30")}>30g</Pill>
          <Pill active={win === "w90"} onClick={() => setWin("w90")}>90g</Pill>
        </div>
      } />
      {rows.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <th style={ts.th}>Prodotto</th>
              {h("visti", "Visti")}
              {h("atc", "Aggiunti")}
              {h("acq", "Acquistati")}
              {h("tasso_atc", "Tasso agg.")}
              {h("tasso_buy", "Tasso acq.")}
              {h("rev", "Revenue")}
            </tr></thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.prod}>{r.prod}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.visti)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.atc)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.acq > 0 ? 600 : 400 }}>{integer(r.acq)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.tasso_atc >= 10 ? GOLD : ts.tdBase.color }}>{pctStr(r.tasso_atc, 1)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.tasso_buy >= 20 ? "#22c55e" : ts.tdBase.color }}>{pctStr(r.tasso_buy, 1)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{r.acq > 0 ? eur(r.rev) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── 3g Pubblico (w30 fisso) ───────────────────────────────────────

function PubblicoView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const eta = data.ga4?.demo?.eta ?? [];
  const genere = data.ga4?.demo?.genere ?? [];
  const paesi = data.ga4?.geo?.paesi ?? [];
  const regioni = data.ga4?.geo?.regioni ?? [];
  const citta = data.ga4?.geo?.citta ?? [];
  const devices = data.ga4?.devices ?? [];
  const nvr = data.ga4?.nuovi_vs_ritorno ?? [];
  const demoAvailable = eta.length > 0 || genere.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!demoAvailable && (
        <div style={{ background: palette.divider, border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: "0.7rem 1rem", fontSize: 12, color: palette.textMuted }}>
          <strong style={{ color: "#f59e0b" }}>Google Signals non attivo:</strong> dati demografici non disponibili.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Età" />
          {eta.length === 0 ? <EmptyState /> : <SimpleBar rows={eta.map((r) => ({ label: String(r[0]), value: Number(r[1]) || 0 })).sort((a, b) => a.label.localeCompare(b.label))} color={ACCENT} />}
        </Card>
        <Card>
          <CardHeader title="Genere" />
          {genere.length === 0 ? <EmptyState /> : <Donut rows={genere.map((r) => ({ name: String(r[0]), value: Number(r[1]) || 0 }))} />}
        </Card>
        <Card>
          <CardHeader title="Dispositivi" />
          {devices.length === 0 ? <EmptyState /> : <Donut rows={devices.map((r) => ({ name: String(r[0]), value: Number(r[1]) || 0 }))} />}
        </Card>
        <Card>
          <CardHeader title="Nuovi vs ritorno" />
          {nvr.length === 0 ? <EmptyState /> : <Donut rows={nvr.map((r) => ({ name: String(r[0]), value: Number(r[1]) || 0 }))} />}
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card><CardHeader title="Top paesi" />{paesi.length === 0 ? <EmptyState /> : <GeoTable rows={paesi} ts={ts} palette={palette} />}</Card>
        <Card><CardHeader title="Top regioni" />{regioni.length === 0 ? <EmptyState /> : <GeoTable rows={regioni} ts={ts} palette={palette} />}</Card>
        <Card><CardHeader title="Top città" />{citta.length === 0 ? <EmptyState /> : <GeoTable rows={citta} ts={ts} palette={palette} />}</Card>
      </div>
    </div>
  );
}

function SimpleBar({ rows, color }: { rows: { label: string; value: number }[]; color: string }) {
  const { palette } = useTheme();
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={palette.grid} horizontal={false} />
          <XAxis type="number" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickFormatter={(v) => integer(Number(v))} />
          <YAxis type="category" dataKey="label" width={70} tick={{ fill: palette.textMuted, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
          <Tooltip cursor={{ fill: palette.buttonHover }} contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown) => integer(Number(v ?? 0))} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Donut({ rows }: { rows: { name: string; value: number }[] }) {
  const { palette } = useTheme();
  const total = rows.reduce((a, r) => a + r.value, 0);
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
            {rows.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
            formatter={(v: unknown, n: unknown) => [`${integer(Number(v ?? 0))} · ${pctStr(total > 0 ? (Number(v ?? 0) / total) * 100 : 0, 1)}`, String(n)]} />
          <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function GeoTable({ rows, ts, palette }: { rows: (string | number)[][]; ts: ReturnType<typeof tableStyles>; palette: import("./shared").Palette }) {
  return (
    <div style={{ overflowX: "auto", maxHeight: 320 }}>
      <table style={ts.table}>
        <thead><tr>
          <th style={ts.th}>Nome</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Utenti</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Sess.</th>
        </tr></thead>
        <tbody>
          {rows.slice(0, 15).map((r, i) => (
            <tr key={i}>
              <td style={{ ...ts.tdBase, color: palette.text }}>{String(r[0])}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[1]))}</td>
              <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// suppress unused imports
void eur0;
