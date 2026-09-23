"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line,
  ScatterChart, Scatter, ReferenceLine, ReferenceArea, ZAxis,
} from "recharts";
import {
  GondolinaData, useDateRange, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, tableStyles,
  ACCENT, GOLD, CHART_PALETTE, POSITIVE, NEGATIVE,
  COMPARE_LABEL, DTS_OBJECTIVE, SALES_OBJECTIVES,
  AD_CFG,
  creativeWindowFor, useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle, useElementWidth,
  type CreativeWindow, type SortValue,
} from "./shared";
import type { MetaValutazione, MetaVerdict, MetaStadio, MetaBenchmark } from "./shared";
import {
  CreativeWindowDetail, AvgTd, WINDOW_LABEL,
  creativeKey, isVideoFormat, useCreativeWindows, valutazioneWindow,
  type CreativeMetricsRaw, type CreativeWindows,
} from "./creatives";
import { PaesiView } from "./PaesiView";

type SubTab = "riepilogo" | "obiettivo" | "piattaforma" | "campagne" | "search" | "creative" | "formati" | "pubblico" | "paesi";

const SUB: { key: SubTab; label: string }[] = [
  { key: "riepilogo", label: "Riepilogo" },
  { key: "obiettivo", label: "Per obiettivo" },
  { key: "piattaforma", label: "Per piattaforma" },
  { key: "campagne", label: "Campagne" },
  { key: "search", label: "Search terms Google" },
  { key: "creative", label: "Creatività Meta" },
  { key: "formati", label: "Cosa vince" },
  { key: "pubblico", label: "Pubblico e placement" },
  { key: "paesi", label: "Paesi" },
];

export function AdvertisingTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const [sub, setSub] = useState<SubTab>("riepilogo");
  const { range, compare, compareRange } = useDateRange();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Advertising
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

      {sub === "riepilogo" && <RiepilogoView data={data} />}
      {sub === "obiettivo" && <PerObiettivoView data={data} />}
      {sub === "piattaforma" && <PerPiattaformaView data={data} />}
      {sub === "campagne" && <CampagneView data={data} />}
      {sub === "search" && <SearchTermsView data={data} />}
      {sub === "creative" && <CreativitaMetaView data={data} />}
      {sub === "formati" && <FormatiSoggettiView data={data} />}
      {sub === "pubblico" && <PubblicoPlacementView data={data} />}
      {sub === "paesi" && <PaesiView data={data} />}
    </div>
  );
}

// ═══ 2a Riepilogo ═══════════════════════════════════════════════════

function RiepilogoView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();

  const agg = useMemo(() => aggregateAdvTotals(data.adv?.daily, range), [data.adv?.daily, range]);
  const prev = useMemo(() => compareRange ? aggregateAdvTotals(data.adv?.daily, compareRange) : null, [data.adv?.daily, compareRange]);

  const ctr = agg.imp > 0 ? (agg.click / agg.imp) * 100 : 0;
  const cpc = agg.click > 0 ? agg.spesa / agg.click : 0;
  const roas = agg.spesa > 0 ? agg.valore / agg.spesa : 0;
  const cpConv = agg.conv > 0 ? agg.spesa / agg.conv : 0;

  // Ripartizione piattaforma + obiettivo
  const byPlat = useMemo(() => groupAdvByField(data.adv?.daily, range, 1, 5), [data.adv?.daily, range]);
  const byObj = useMemo(() => groupAdvByField(data.adv?.daily, range, 2, 5), [data.adv?.daily, range]);

  // Spesa daily per piattaforma
  const dailyPlat = useMemo(() => buildDailyByPlatform(data.adv?.daily, range), [data.adv?.daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <KpiTile label="Spesa totale" value={eur(agg.spesa)} delta={prev ? calcDelta(agg.spesa, prev.spesa) : null} />
        <KpiTile label="Impression" value={integer(agg.imp)} delta={prev ? calcDelta(agg.imp, prev.imp) : null} />
        <KpiTile label="Click" value={integer(agg.click)} delta={prev ? calcDelta(agg.click, prev.click) : null} />
        <KpiTile label="CTR" value={pctStr(ctr, 2)} delta={prev && prev.imp > 0 ? calcDelta(ctr, (prev.click / prev.imp) * 100) : null} info="Click ÷ Impression × 100" />
        <KpiTile label="CPC" value={eur(cpc)} info="Spesa ÷ Click" />
        <KpiTile label="Conversioni" value={num(agg.conv, 1)} delta={prev ? calcDelta(agg.conv, prev.conv) : null} />
        <KpiTile label="Valore" value={eur0(agg.valore)} delta={prev ? calcDelta(agg.valore, prev.valore) : null} />
        <KpiTile label="ROAS" value={num(roas, 2)} delta={prev && prev.spesa > 0 ? calcDelta(roas, prev.valore / prev.spesa) : null} info="Valore ÷ Spesa (tutte le piattaforme, tutti gli obiettivi)" />
        <KpiTile label="Costo/Conversione" value={agg.conv > 0 ? eur(cpConv) : "—"} info="Spesa ÷ Conversioni" />
      </div>

      <FunnelStrip data={data} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Ripartizione spesa per piattaforma" />
          <DonutFromMap map={byPlat} formatter={(v) => eur0(v)} />
        </Card>
        <Card>
          <CardHeader title="Ripartizione spesa per obiettivo" />
          <DonutFromMap map={byObj} formatter={(v) => eur0(v)} />
        </Card>
      </div>

      <Card>
        <CardHeader title={`Spesa daily per piattaforma · ${range.days} giorni`} />
        {dailyPlat.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={dailyPlat} margin={{ top: 10, right: 12, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false}
                  tickFormatter={(v) => eur0(Number(v))} width={60} />
                <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
                  formatter={(v: unknown, n: unknown) => [eur(Number(v ?? 0)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} iconType="line" />
                <Line type="monotone" dataKey="Meta" stroke={ACCENT} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Google" stroke={GOLD} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══ 2b Per obiettivo ═══════════════════════════════════════════════

function PerObiettivoView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  const rows = useMemo(() => aggregateAdvByGroup(data.adv?.daily, range, 2), [data.adv?.daily, range]);
  const totalSpesa = rows.reduce((a, r) => a + r.spesa, 0);

  return (
    <Card>
      <CardHeader title={`Per obiettivo · ${range.days} giorni`} />
      {rows.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Obiettivo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Quota</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Impression</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conv.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo/Conv.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Indicazioni</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Chiamate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const ctr = r.imp > 0 ? (r.click / r.imp) * 100 : 0;
                const roas = r.spesa > 0 ? r.valore / r.spesa : 0;
                const cpConv = r.conv > 0 ? r.spesa / r.conv : 0;
                const quota = totalSpesa > 0 ? (r.spesa / totalSpesa) * 100 : 0;
                const isDts = r.key === DTS_OBJECTIVE;
                return (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{r.key}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(r.spesa)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(quota, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.imp)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.click)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(r.conv, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.valore)}</td>
                    <td style={{
                      ...ts.tdBase, ...ts.tdRight,
                      color: isDts ? palette.textDim : (roas >= AD_CFG.ROAS_GOOD ? POSITIVE : roas > 0 && roas < 1 ? NEGATIVE : ts.tdBase.color),
                      fontWeight: 600, fontStyle: isDts ? "italic" : "normal",
                    }} title={isDts ? "Il ROAS non è il metro di questo obiettivo: le vendite avvengono in boutique." : "Valore ÷ Spesa"}>
                      {num(roas, 2)}{isDts && " ⓘ"}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.conv > 0 ? eur(cpConv) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: isDts ? GOLD : ts.tdBase.color, fontWeight: isDts ? 600 : 400 }}>{integer(r.indicazioni)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: isDts ? GOLD : ts.tdBase.color, fontWeight: isDts ? 600 : 400 }}>{integer(r.chiamate)}</td>
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

// ═══ 2c Per piattaforma ═══════════════════════════════════════════

function PerPiattaformaView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const ts = tableStyles(palette);

  const cur = useMemo(() => aggregateAdvByGroup(data.adv?.daily, range, 1), [data.adv?.daily, range]);
  const prev = useMemo(() => compareRange ? aggregateAdvByGroup(data.adv?.daily, compareRange, 1) : null, [data.adv?.daily, compareRange]);

  return (
    <Card>
      <CardHeader title={`Meta vs Google · ${range.days} giorni${compareRange ? " (con comparazione)" : ""}`} />
      {cur.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Piattaforma</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                {compareRange && <th style={{ ...ts.th, ...ts.thRight }}>Δ Spesa</th>}
                <th style={{ ...ts.th, ...ts.thRight }}>Impression</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conv.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
                {compareRange && <th style={{ ...ts.th, ...ts.thRight }}>Δ ROAS</th>}
              </tr>
            </thead>
            <tbody>
              {cur.map((r, i) => {
                const ctr = r.imp > 0 ? (r.click / r.imp) * 100 : 0;
                const roas = r.spesa > 0 ? r.valore / r.spesa : 0;
                const p = prev?.find((x) => x.key === r.key) ?? null;
                const dSpesa = p ? calcDelta(r.spesa, p.spesa) : null;
                const roasP = p && p.spesa > 0 ? p.valore / p.spesa : null;
                const dRoas = roasP != null ? calcDelta(roas, roasP) : null;
                return (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: r.key === "Meta" ? "#4267B2" : "#DB4437", fontWeight: 700 }}>{r.key}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(r.spesa)}</td>
                    {compareRange && <td style={{ ...ts.tdBase, ...ts.tdRight, color: dSpesa?.color ?? ts.tdBase.color, fontWeight: 600 }}>{dSpesa ? `${dSpesa.arrow} ${dSpesa.label}` : "—"}</td>}
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.imp)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.click)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(r.conv, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.valore)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: roas >= AD_CFG.ROAS_GOOD ? POSITIVE : roas > 0 && roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 700 }}>{num(roas, 2)}</td>
                    {compareRange && <td style={{ ...ts.tdBase, ...ts.tdRight, color: dRoas?.color ?? ts.tdBase.color, fontWeight: 600 }}>{dRoas ? `${dRoas.arrow} ${dRoas.label}` : "—"}</td>}
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

// ═══ 2d Campagne ═══════════════════════════════════════════════════

function CampagneView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  const [platFilter, setPlatFilter] = useState<string>("all");
  const [objFilter, setObjFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("spesa");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const objectives = data.objectives ?? [];

  /**
   * I carrelli non sono ancora in adv.daily. Invece di inventarli, la
   * colonna si accende da sola il giorno in cui il motore li aggiunge:
   * basta che l'intestazione del payload li dichiari.
   */
  const atcIdx = useMemo(() => {
    const head = data.adv?.head ?? [];
    return head.findIndex((h) => /carrell|add.?to.?cart|\batc\b/i.test(String(h)));
  }, [data.adv?.head]);
  const haAtc = atcIdx >= 0;

  const rows = useMemo(() => {
    const grouped = new Map<string, { plat: string; obj: string; tipo: string; spesa: number; imp: number; click: number; conv: number; valore: number; indicazioni: number; chiamate: number; atc: number }>();
    for (const r of data.adv?.daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const key = String(r[3] ?? "");
      const g = grouped.get(key) ?? {
        plat: String(r[1] ?? ""), obj: String(r[2] ?? ""), tipo: String(r[4] ?? ""),
        spesa: 0, imp: 0, click: 0, conv: 0, valore: 0, indicazioni: 0, chiamate: 0, atc: 0,
      };
      g.spesa += Number(r[5]) || 0;
      g.imp += Number(r[6]) || 0;
      g.click += Number(r[7]) || 0;
      g.conv += Number(r[8]) || 0;
      g.valore += Number(r[9]) || 0;
      g.indicazioni += Number(r[10]) || 0;
      g.chiamate += Number(r[11]) || 0;
      if (atcIdx >= 0) g.atc += Number(r[atcIdx]) || 0;
      grouped.set(key, g);
    }
    // I rapporti stanno sulla riga, non nel render: così si possono ordinare
    let arr = Array.from(grouped.entries()).map(([campagna, v]) => ({
      campagna, ...v,
      ctr: v.imp > 0 ? (v.click / v.imp) * 100 : 0,
      cpc: v.click > 0 ? v.spesa / v.click : 0,
      cpm: v.imp > 0 ? (v.spesa / v.imp) * 1000 : 0,
      cpa: v.conv > 0 ? v.spesa / v.conv : 0,
      convRate: v.click > 0 ? (v.conv / v.click) * 100 : 0,
      costoAtc: v.atc > 0 ? v.spesa / v.atc : 0,
    }));
    if (platFilter !== "all") arr = arr.filter((r) => r.plat === platFilter);
    if (objFilter !== "all") arr = arr.filter((r) => r.obj === objFilter);
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((r) => r.campagna.toLowerCase().includes(q));
    }
    arr.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortBy];
      const bv = (b as unknown as Record<string, unknown>)[sortBy];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [data.adv?.daily, range, platFilter, objFilter, search, sortBy, sortDir, atcIdx]);

  // Con zero conversioni, tasso e costo per conversione sarebbero due colonne
  // di trattini: compaiono quando c'e' davvero qualcosa da leggere.
  const haConv = rows.some((r) => r.conv > 0);
  const colonneTabella = 15 + (haAtc ? 2 : 0) + (haConv ? 2 : 0);

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  }
  function sortHdr(col: string, label: string, right = false) {
    return (
      <th style={{ ...ts.th, ...(right ? ts.thRight : {}), cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort(col)}>
        {label} {sortBy === col && <span style={{ color: GOLD }}>{sortDir === "desc" ? "▼" : "▲"}</span>}
      </th>
    );
  }

  return (
    <Card>
      <CardHeader title={`Campagne · ${range.days} giorni`} />
      {/* Filtri */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: palette.textDim, fontWeight: 600 }}>Piattaforma:</span>
        <Pill active={platFilter === "all"} onClick={() => setPlatFilter("all")}>Tutte</Pill>
        <Pill active={platFilter === "Meta"} onClick={() => setPlatFilter("Meta")}>Meta</Pill>
        <Pill active={platFilter === "Google"} onClick={() => setPlatFilter("Google")}>Google</Pill>
        <span style={{ width: 1, height: 20, background: palette.divider, margin: "0 4px" }} />
        <span style={{ fontSize: 11, color: palette.textDim, fontWeight: 600 }}>Obiettivo:</span>
        <Pill active={objFilter === "all"} onClick={() => setObjFilter("all")}>Tutti</Pill>
        {objectives.map((o) => <Pill key={o} active={objFilter === o} onClick={() => setObjFilter(o)}>{o}</Pill>)}
        <div style={{ flex: 1 }} />
        <input
          type="search" placeholder="Cerca nome campagna…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.45rem 0.7rem", borderRadius: 8,
            border: `1px solid ${palette.inputBorder}`, background: palette.input,
            color: palette.text, fontSize: 12, fontFamily: "inherit", minWidth: 200,
          }}
        />
      </div>

      {rows.length === 0 ? <EmptyState label="Nessuna campagna coi filtri applicati" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                {sortHdr("campagna", "Campagna")}
                {sortHdr("plat", "Piatt.")}
                {sortHdr("obj", "Obiettivo")}
                {sortHdr("tipo", "Tipo")}
                {sortHdr("spesa", "Spesa", true)}
                {sortHdr("imp", "Imp.", true)}
                {sortHdr("cpm", "CPM", true)}
                {sortHdr("click", "Click", true)}
                {sortHdr("ctr", "CTR", true)}
                {sortHdr("cpc", "CPC", true)}
                {haAtc && sortHdr("atc", "Carrelli", true)}
                {haAtc && sortHdr("costoAtc", "Costo/carr.", true)}
                {sortHdr("conv", "Conv.", true)}
                {haConv && sortHdr("convRate", "Click → conv.", true)}
                {haConv && sortHdr("cpa", "Costo/conv.", true)}
                {sortHdr("indicazioni", "Indicazioni", true)}
                {sortHdr("chiamate", "Chiamate", true)}
                {sortHdr("valore", "Valore", true)}
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const roas = r.spesa > 0 ? r.valore / r.spesa : 0;
                const isOnline = SALES_OBJECTIVES.has(r.obj.toUpperCase()) || r.obj === "Online";
                const bad = isOnline && roas > 0 && roas < 1;
                const isOpen = expanded === r.campagna;
                return (
                  <React.Fragment key={r.campagna}>
                    <tr style={{ background: bad ? "rgba(239,68,68,0.08)" : undefined, cursor: "pointer" }}
                      onClick={() => setExpanded(isOpen ? null : r.campagna)}>
                      <td style={{ ...ts.tdBase, maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: palette.text, fontWeight: 500 }} title={r.campagna}>
                        <span style={{ marginRight: 6, color: palette.textDim }}>{isOpen ? "▼" : "▶"}</span>
                        {r.campagna}
                      </td>
                      <td style={{ ...ts.tdBase, fontSize: 11, color: r.plat === "Meta" ? "#4267B2" : "#DB4437", fontWeight: 600 }}>{r.plat}</td>
                      <td style={{ ...ts.tdBase, fontSize: 10 }}>
                        <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontWeight: 600 }}>{r.obj}</span>
                      </td>
                      <td style={{ ...ts.tdBase, fontSize: 10, color: palette.textDim }}>{r.tipo}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(r.spesa)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.imp > 0 ? eur(r.cpm) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.imp > 0 ? pctStr(r.ctr, 2) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.click > 0 ? eur(r.cpc) : "—"}</td>
                      {haAtc && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.atc)}</td>}
                      {haAtc && <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.atc > 0 ? 600 : 400 }}>{r.atc > 0 ? eur(r.costoAtc) : "—"}</td>}
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.conv > 0 ? 600 : 400 }}>{num(r.conv, 1)}</td>
                      {haConv && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.click > 0 && r.conv > 0 ? pctStr(r.convRate, 2) : "—"}</td>}
                      {haConv && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.conv > 0 ? eur(r.cpa) : "—"}</td>}
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.indicazioni > 0 ? GOLD : palette.textFaint, fontWeight: r.indicazioni > 0 ? 600 : 400 }}>{integer(r.indicazioni)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.chiamate > 0 ? GOLD : palette.textFaint, fontWeight: r.chiamate > 0 ? 600 : 400 }}>{integer(r.chiamate)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.valore)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: bad ? NEGATIVE : roas >= AD_CFG.ROAS_GOOD ? POSITIVE : ts.tdBase.color, fontWeight: 700 }}>{num(roas, 2)}</td>
                    </tr>
                    {isOpen && <CampaignExpanded data={data} campagna={r.campagna} palette={palette} colonne={colonneTabella} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function CampaignExpanded({ data, campagna, palette, colonne }: { data: GondolinaData; campagna: string; palette: import("./shared").Palette; colonne: number }) {
  const { range } = useDateRange();
  const daily = useMemo(() => {
    return (data.adv?.daily ?? [])
      .filter((r) => String(r[3]) === campagna && String(r[0]) >= range.start && String(r[0]) <= range.end)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map((r) => ({ label: fmtDate(String(r[0])), spesa: Number(r[5]) || 0, valore: Number(r[9]) || 0 }));
  }, [data.adv?.daily, campagna, range]);
  return (
    <tr>
      <td colSpan={colonne} style={{ padding: "12px 16px", background: palette.divider }}>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={daily} margin={{ top: 6, right: 12, bottom: 4, left: 8 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: palette.axis, fontSize: 10 }}
                axisLine={{ stroke: palette.cardBorder }} tickLine={false} interval="preserveStartEnd" minTickGap={30} />
              <YAxis yAxisId="left" tick={{ fill: ACCENT, fontSize: 10 }} axisLine={{ stroke: palette.cardBorder }}
                tickLine={false} tickFormatter={(v) => eur0(Number(v))} width={60} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: GOLD, fontSize: 10 }} axisLine={{ stroke: palette.cardBorder }}
                tickLine={false} tickFormatter={(v) => eur0(Number(v))} width={60} />
              <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }} formatter={(v: unknown) => eur(Number(v ?? 0))} />
              <Line yAxisId="left" type="monotone" dataKey="spesa" name="Spesa" stroke={ACCENT} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="valore" name="Valore" stroke={GOLD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </td>
    </tr>
  );
}

// ═══ 2e Search terms Google ═══════════════════════════════════════

function SearchTermsView({ data }: { data: GondolinaData }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const rows = data.adv?.search_terms_w30 ?? [];
  const [sortBy, setSortBy] = useState<"costo" | "click" | "conv" | "valore">("costo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const badBg = theme === "dark" ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)";

  const enriched = useMemo(() => {
    return rows.map((r) => ({
      termine: String(r[1] ?? ""), campagna: String(r[0] ?? ""), match: String(r[2] ?? ""),
      click: Number(r[3]) || 0, costo: Number(r[4]) || 0, conv: Number(r[5]) || 0, valore: Number(r[6]) || 0,
    }));
  }, [rows]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => (sortDir === "desc" ? (b[sortBy] - a[sortBy]) : (a[sortBy] - b[sortBy])));
    return arr;
  }, [enriched, sortBy, sortDir]);

  const sprecato = enriched.filter((r) => r.conv === 0).reduce((a, r) => a + r.costo, 0);
  const badRows = enriched.filter((r) => r.costo > 5 && r.conv === 0).length;

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader title="Termini di ricerca Google · Ultimi 30g" />
        <EmptyState label="Nessun search term nel payload. Va attivato il report lato Google Ads/GAS." />
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        <KpiTile label="Totale sprecato (0 conv.)" value={eur(sprecato)}
          info="Somma del costo di tutte le righe con 0 conversioni: candidati immediati per keyword esclusa" accent={NEGATIVE} />
        <KpiTile label="Termini da escludere" value={integer(badRows)}
          info="Righe con costo > 5€ e 0 conversioni" />
        <KpiTile label="Termini totali" value={integer(rows.length)} />
      </div>
      <Card>
        <CardHeader title="Termini di ricerca · Ordina cliccando sull'header" />
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Termine</th>
                <th style={ts.th}>Campagna</th>
                <th style={ts.th}>Match</th>
                <SortHdr th={ts.th} thRight={ts.thRight} label="Click" col="click" sortBy={sortBy} sortDir={sortDir} onClick={(c) => { setSortBy(c); setSortDir(sortBy === c && sortDir === "desc" ? "asc" : "desc"); }} />
                <SortHdr th={ts.th} thRight={ts.thRight} label="Costo" col="costo" sortBy={sortBy} sortDir={sortDir} onClick={(c) => { setSortBy(c); setSortDir(sortBy === c && sortDir === "desc" ? "asc" : "desc"); }} />
                <SortHdr th={ts.th} thRight={ts.thRight} label="Conv." col="conv" sortBy={sortBy} sortDir={sortDir} onClick={(c) => { setSortBy(c); setSortDir(sortBy === c && sortDir === "desc" ? "asc" : "desc"); }} />
                <SortHdr th={ts.th} thRight={ts.thRight} label="Valore" col="valore" sortBy={sortBy} sortDir={sortDir} onClick={(c) => { setSortBy(c); setSortDir(sortBy === c && sortDir === "desc" ? "asc" : "desc"); }} />
                <th style={{ ...ts.th, ...ts.thRight }}>Costo/Conv.</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const bad = r.costo > 5 && r.conv === 0;
                const cpConv = r.conv > 0 ? r.costo / r.conv : 0;
                return (
                  <tr key={i} style={{ background: bad ? badBg : undefined }}>
                    <td style={{ ...ts.tdBase, color: bad ? NEGATIVE : palette.text, fontWeight: bad ? 700 : 500 }}>{r.termine}</td>
                    <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textDim, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.campagna}>{r.campagna}</td>
                    <td style={{ ...ts.tdBase, fontSize: 10 }}>
                      <span style={{ padding: "1px 6px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontWeight: 600 }}>{r.match}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.click)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: bad ? 700 : 400, color: bad ? NEGATIVE : ts.tdBase.color }}>{eur(r.costo)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.conv > 0 ? 600 : 400 }}>{num(r.conv, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.valore)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.conv === 0 ? palette.textDim : ts.tdBase.color }}>{r.conv > 0 ? eur(cpConv) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SortHdr({ th, thRight, label, col, sortBy, sortDir, onClick }: {
  th: React.CSSProperties; thRight: React.CSSProperties; label: string; col: "click" | "costo" | "conv" | "valore";
  sortBy: string; sortDir: "asc" | "desc"; onClick: (c: "click" | "costo" | "conv" | "valore") => void;
}) {
  return (
    <th style={{ ...th, ...thRight, cursor: "pointer", userSelect: "none" }} onClick={() => onClick(col)}>
      {label} {sortBy === col && <span style={{ color: GOLD }}>{sortDir === "desc" ? "▼" : "▲"}</span>}
    </th>
  );
}

// ═══ 2f Creatività Meta (dal motore: meta.valutazione + meta.benchmark) ═══

const VERDICT_UI: Record<MetaVerdict, { color: string; bg: string; desc: string }> = {
  "SCALA":        { color: POSITIVE,   bg: "rgba(34,197,94,0.18)",  desc: "ROAS solido e pubblico non saturo" },
  "PROMETTE":     { color: "#5FCF7A",  bg: "rgba(34,197,94,0.10)",  desc: "Segnali di traffico buoni, ROAS ancora in raccolta" },
  "RINNOVA":      { color: "#f59e0b",  bg: "rgba(245,158,11,0.15)", desc: "Segnali di fatigue: rendimento in calo con l'esposizione" },
  "MANTIENI":     { color: "#0ea5e9",  bg: "rgba(14,165,233,0.15)", desc: "Nella norma rispetto all'account" },
  "OSSERVA":      { color: "#94a3b8",  bg: "rgba(148,163,184,0.18)",desc: "Volume ancora limitato per un giudizio" },
  "DA RIVEDERE":  { color: "#ef4444",  bg: "rgba(239,68,68,0.10)",  desc: "Segnali contrastanti fra le metriche" },
  "SPEGNI":       { color: NEGATIVE,   bg: "rgba(239,68,68,0.20)",  desc: "Spesa senza risultati proporzionati" },
  "IN RACCOLTA":  { color: "#94a3b8",  bg: "rgba(148,163,184,0.14)",desc: "Dati ancora insufficienti" },
};

const STADIO_HINT: Record<MetaStadio, string> = {
  "In raccolta": "Spesa ancora bassa per una lettura affidabile",
  "Attenzione":  "Hook e CTR sul link leggibili in 2-3 giorni",
  "Intento":     "Add to cart e checkout leggibili in 4-7 giorni",
  "Risultato":   "ROAS sulla singola creatività leggibile in 2-4 settimane",
};

/** Ordine dei verdetti: prima quelli più "caldi". */
const VERDICT_RANK: Record<MetaVerdict, number> = {
  "SCALA": 0, "PROMETTE": 1, "RINNOVA": 2, "DA RIVEDERE": 3,
  "SPEGNI": 4, "MANTIENI": 5, "OSSERVA": 6, "IN RACCOLTA": 7,
};

/** Avanzamento della lettura: dalla raccolta dati al risultato. */
const STADIO_RANK: Record<MetaStadio, number> = { "In raccolta": 0, "Attenzione": 1, "Intento": 2, "Risultato": 3 };

function CreativitaMetaView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const [filter, setFilter] = useState<"all" | "da-scalare" | "da-rinnovare" | "da-rivedere" | "da-spegnere">("all");
  // Aggreghiamo per nome + formato: Meta espone la stessa creatività su più
  // adset/placement, qui la sommiamo in un'unica riga.
  const valutazione = useMemo(() => aggregateValutazione(data.meta?.valutazione ?? []), [data.meta?.valutazione]);
  const benchmark = data.meta?.benchmark;
  const windows = useCreativeWindows(data);
  const valWindow = useMemo(() => valutazioneWindow(data), [data]);

  const counts = useMemo(() => {
    const c = { scalare: 0, rinnovare: 0, rivedere: 0, spegnere: 0 };
    for (const v of valutazione) {
      if (v.verdetto === "SCALA" || v.verdetto === "PROMETTE") c.scalare++;
      else if (v.verdetto === "RINNOVA") c.rinnovare++;
      else if (v.verdetto === "DA RIVEDERE") c.rivedere++;
      else if (v.verdetto === "SPEGNI") c.spegnere++;
    }
    return c;
  }, [valutazione]);

  const visible = useMemo(() => valutazione.filter((v) => {
    if (filter === "all") return true;
    if (filter === "da-scalare") return v.verdetto === "SCALA" || v.verdetto === "PROMETTE";
    if (filter === "da-rinnovare") return v.verdetto === "RINNOVA";
    if (filter === "da-rivedere") return v.verdetto === "DA RIVEDERE";
    if (filter === "da-spegnere") return v.verdetto === "SPEGNI";
    return true;
  }), [valutazione, filter]);

  if (valutazione.length === 0) {
    return <Card><CardHeader title="Creatività Meta" /><EmptyState label="Nessuna valutazione nel payload." /></Card>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {benchmark && !benchmark.affidabile && (
        <div style={{
          background: palette.divider, border: `1px solid ${palette.cardBorder}`,
          padding: "0.7rem 1rem", borderRadius: 10, fontSize: 12, color: palette.textMuted,
        }}>
          <strong style={{ color: palette.text }}>Benchmark non affidabile:</strong> meno di 4 creatività con volume sufficiente ({benchmark.n}). Le soglie usate sono valori assoluti di riserva, non la mediana dell&apos;account.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <FiltroCard label="Da scalare"    count={counts.scalare}   color={POSITIVE} active={filter === "da-scalare"}   onClick={() => setFilter(filter === "da-scalare" ? "all" : "da-scalare")} desc="SCALA + PROMETTE" />
        <FiltroCard label="Da rinnovare"  count={counts.rinnovare} color="#f59e0b"  active={filter === "da-rinnovare"} onClick={() => setFilter(filter === "da-rinnovare" ? "all" : "da-rinnovare")} desc="Segnali di fatigue" />
        <FiltroCard label="Da rivedere"   count={counts.rivedere}  color="#ef4444"  active={filter === "da-rivedere"}  onClick={() => setFilter(filter === "da-rivedere" ? "all" : "da-rivedere")} desc="Segnali contrastanti" />
        <FiltroCard label="Da spegnere"   count={counts.spegnere}  color={NEGATIVE} active={filter === "da-spegnere"}  onClick={() => setFilter(filter === "da-spegnere" ? "all" : "da-spegnere")} desc="Spesa senza risultati proporzionati" />
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardHeader title="Creatività · 0 inserzioni" right={<Pill active={false} onClick={() => setFilter("all")}>× rimuovi filtro</Pill>} />
          <EmptyState label="Nessuna creatività coi filtri" />
        </Card>
      ) : (
        <ValutazioneTable rows={visible} windows={windows} valWindow={valWindow} benchmark={benchmark}
          filterActive={filter !== "all"} onClearFilter={() => setFilter("all")} />
      )}

      <Card>
        <CardHeader title="Dove si rompe · Hook rate × CTR sul link"
          right={benchmark?.affidabile ? <span style={{ fontSize: 11, color: palette.textDim }}>linee: mediane dell&apos;account</span> : null} />
        {valutazione.length === 0 ? <EmptyState /> : <HookCtrScatter rows={valutazione} benchmark={benchmark} />}
      </Card>
    </div>
  );
}

function FiltroCard({ label, count, color, active, onClick, desc }: {
  label: string; count: number; color: string; active: boolean; onClick: () => void; desc: string;
}) {
  const { palette } = useTheme();
  return (
    <button onClick={onClick} style={{
      textAlign: "left", cursor: "pointer", padding: "0.9rem 1rem", borderRadius: 12,
      border: `1px solid ${active ? color : palette.cardBorder}`,
      background: active ? `${color}18` : palette.divider,
      color: palette.text, fontFamily: "inherit",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{integer(count)}</p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.textDim }}>{desc}</p>
    </button>
  );
}

function VerdictBadge({ verdict }: { verdict: MetaVerdict }) {
  const m = VERDICT_UI[verdict];
  return (
    <span title={m.desc} style={{
      padding: "2px 9px", borderRadius: 20, background: m.bg, color: m.color,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", cursor: "help",
      border: `1px solid ${m.color}45`, whiteSpace: "nowrap",
    }}>{verdict}</span>
  );
}

function IndiceBar({ indice }: { indice: number }) {
  const { palette } = useTheme();
  const clamped = Math.max(0, Math.min(100, indice));
  const color = clamped >= 65 ? POSITIVE : clamped >= 35 ? "#0ea5e9" : NEGATIVE;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 100 }}>
      <div style={{ position: "relative", width: "100%", height: 6, background: palette.divider, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${clamped}%`, height: "100%", background: color, transition: "width 0.3s" }} />
        {/* tacca fissa a 50 = mediana account */}
        <div style={{ position: "absolute", left: "50%", top: -2, width: 1, height: 10, background: palette.textDim }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: palette.textMuted, fontVariantNumeric: "tabular-nums" }}>{integer(clamped)}</span>
    </div>
  );
}

function ValutazioneTable({ rows, windows, valWindow, benchmark, filterActive, onClearFilter }: {
  rows: MetaValutazione[]; windows: CreativeWindows; valWindow: CreativeWindow | null;
  benchmark: MetaBenchmark | undefined; filterActive: boolean; onClearFilter: () => void;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Il pannello di dettaglio resta a vista anche con la tabella scrollata in orizzontale
  const { ref: wrapRef, width: wrapWidth } = useElementWidth<HTMLDivElement>();

  const { sorted, sort, toggle, reset } = useTableSort<MetaValutazione>(rows, (v, key): SortValue => {
    switch (key) {
      case "nome": return v.nome;
      case "formato": return v.formato;
      case "soggetto": return v.soggetto;
      case "stadio": return STADIO_RANK[v.stadio] ?? null;
      case "indice": return v.indice;
      case "verdetto": return VERDICT_RANK[v.verdetto] ?? null;
      case "spesa": return v.spesa;
      case "hook": return isVideoFormat(v.formato) && v.impr > 0 ? v.hook : null;
      case "ctr": return v.impr > 0 ? v.ctr_link : null;
      case "costoAtc": return v.atc > 0 ? v.costo_atc : null;
      case "acquisti": return v.acquisti;
      case "roas": return v.roas > 0 ? v.roas : null;
      default: return null;
    }
  });

  // Media sulle righe visibili: costi e tassi dai totali, volumi per riga
  const avg = useMemo(() => {
    const t = { spesa: 0, impr: 0, atc: 0, valore: 0, ctr: 0, hook: 0, imprVideo: 0 };
    for (const v of rows) {
      t.spesa += v.spesa; t.impr += v.impr; t.atc += v.atc;
      t.valore += (v.roas ?? 0) * v.spesa;
      t.ctr += (v.ctr_link ?? 0) * v.impr;
      if (isVideoFormat(v.formato)) { t.hook += (v.hook ?? 0) * v.impr; t.imprVideo += v.impr; }
    }
    return {
      spesa: mean(rows.map((v) => v.spesa)),
      hook: ratio(t.hook, t.imprVideo),
      ctr: ratio(t.ctr, t.impr),
      costoAtc: ratio(t.spesa, t.atc),
      acquisti: mean(rows.map((v) => v.acquisti)),
      roas: t.valore > 0 ? ratio(t.valore, t.spesa) : null,
    };
  }, [rows]);

  const th = { sort, onSort: toggle };
  const dash = "—";
  const fmt = (x: number | null, f: (n: number) => string) => (x == null ? dash : f(x));

  return (
    <Card>
      <CardHeader title={`Creatività · ${rows.length} inserzioni`}
        right={<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {valWindow && <span style={{ fontSize: 11, color: palette.textDim }}>valori sugli {WINDOW_LABEL[valWindow]}</span>}
          {sort && <Pill active={false} onClick={reset}>Ordine predefinito</Pill>}
          {filterActive && <Pill active={false} onClick={onClearFilter}>× rimuovi filtro</Pill>}
        </div>} />
      <div ref={wrapRef} style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead><tr>
            <SortTh label="Creatività" sortKey="nome" {...th} />
            <SortTh label="Formato" sortKey="formato" {...th} />
            <SortTh label="Soggetto" sortKey="soggetto" {...th} />
            <SortTh label="Stadio" sortKey="stadio" first="desc" title="Dalla raccolta dati al risultato" {...th} />
            <SortTh label="Indice" sortKey="indice" first="desc" style={{ minWidth: 110 }} {...th} />
            <SortTh label="Verdetto" sortKey="verdetto" {...th} />
            <SortTh label="Spesa" sortKey="spesa" align="right" {...th} />
            <SortTh label="Hook" sortKey="hook" align="right" title="Solo video" {...th} />
            <SortTh label="CTR link" sortKey="ctr" align="right" {...th} />
            <SortTh label="Costo/ATC" sortKey="costoAtc" align="right" first="asc" {...th} />
            <SortTh label="Acquisti" sortKey="acquisti" align="right" {...th} />
            <SortTh label="ROAS" sortKey="roas" align="right" {...th} />
          </tr></thead>
          <tbody>
            <tr style={avgRowStyle(palette)}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700, whiteSpace: "nowrap" }} title={AVG_TITLE}>
                Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(rows.length)} creatività</span>
              </td>
              <td style={ts.tdBase} />
              <td style={ts.tdBase} />
              <td style={ts.tdBase} />
              <td style={ts.tdBase} />
              <td style={ts.tdBase} />
              <AvgTd ts={ts}>{fmt(avg.spesa, eur)}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.hook, (x) => pctStr(x, 1))}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.ctr, (x) => pctStr(x, 2))}</AvgTd>
              <AvgTd ts={ts} strong>{fmt(avg.costoAtc, eur)}</AvgTd>
              <AvgTd ts={ts}>{fmt(avg.acquisti, (x) => num(x, 1))}</AvgTd>
              <AvgTd ts={ts} strong>{fmt(avg.roas, (x) => num(x, 2))}</AvgTd>
            </tr>

            {sorted.map((v) => {
              const key = creativeKey(v.nome, v.formato);
              const isOpen = openKey === key;
              const video = isVideoFormat(v.formato);
              const toggleOpen = () => setOpenKey(isOpen ? null : key);
              return (
                <React.Fragment key={key}>
                  <tr
                    onClick={toggleOpen}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOpen(); } }}
                    tabIndex={0}
                    aria-expanded={isOpen}
                    style={{ cursor: "pointer", background: isOpen ? palette.buttonHover : undefined }}
                  >
                    <td style={{ ...ts.tdBase, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: palette.text, fontWeight: 500 }} title={v.nome}>
                      <span style={{ display: "inline-block", width: 12, color: palette.textDim, fontSize: 9 }}>{isOpen ? "▾" : "▸"}</span>{v.nome}
                    </td>
                    <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textMuted }}>{v.formato}</td>
                    <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textMuted }}>{v.soggetto}</td>
                    <td style={{ ...ts.tdBase, fontSize: 10 }}>
                      <span title={STADIO_HINT[v.stadio] ?? ""} style={{ color: palette.textDim, cursor: "help", whiteSpace: "nowrap" }}>{v.stadio}</span>
                    </td>
                    <td style={ts.tdBase}><IndiceBar indice={v.indice} /></td>
                    <td style={ts.tdBase}><VerdictBadge verdict={v.verdetto} /></td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(v.spesa)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{video && v.impr > 0 ? pctStr(v.hook, 1) : dash}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{v.impr > 0 ? pctStr(v.ctr_link, 2) : dash}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{v.atc > 0 ? eur(v.costo_atc) : dash}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: v.acquisti > 0 ? 600 : 400 }}>{integer(v.acquisti)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: v.roas >= AD_CFG.ROAS_GOOD ? POSITIVE : v.roas > 0 && v.roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 700 }}>{v.roas > 0 ? num(v.roas, 2) : dash}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={12} style={{ padding: 0, borderBottom: `1px solid ${palette.cardBorder}`, background: palette.divider }}>
                        <div style={{ position: "sticky", left: 0, width: wrapWidth || "100%", boxSizing: "border-box", padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                          {v.segnali.length > 0 && (
                            <div>
                              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: palette.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Diagnostica</p>
                              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
                                {v.segnali.map((sg, si) => <li key={si}>{sg}</li>)}
                              </ul>
                            </div>
                          )}
                          <CreativeWindowDetail nome={v.nome} formato={v.formato} windows={windows} highlight={valWindow} benchmark={benchmark} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HookCtrScatter({ rows, benchmark }: { rows: MetaValutazione[]; benchmark: MetaBenchmark | undefined }) {
  const { palette } = useTheme();
  const points = rows.filter((r) => r.hook > 0 || r.ctr_link > 0);
  if (points.length === 0) return <EmptyState label="Dati insufficienti per lo scatter" />;
  // Hook e CTR sul link arrivano dal motore già in percentuale
  const maxHook = Math.max(...points.map((p) => p.hook), 5);
  const maxCtr = Math.max(...points.map((p) => p.ctr_link), 1);
  const maxSpesa = Math.max(1, ...points.map((p) => p.spesa));
  const bx = benchmark?.affidabile ? benchmark.hook : null;
  const by = benchmark?.affidabile ? benchmark.ctr_link : null;
  return (
    <div style={{ width: "100%", height: 380 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 24, bottom: 40, left: 24 }}>
          <CartesianGrid stroke={palette.grid} />
          <XAxis type="number" dataKey="hook" name="Hook" domain={[0, maxHook * 1.1]}
            tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => pctStr(Number(v), 0)}
            label={{ value: "Hook rate →", position: "insideBottom", offset: -8, fill: palette.textDim, fontSize: 11 }} />
          <YAxis type="number" dataKey="ctr_link" name="CTR link" domain={[0, maxCtr * 1.1]}
            tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => pctStr(Number(v), 1)}
            label={{ value: "CTR sul link ↑", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }} />
          <ZAxis type="number" dataKey="spesa" range={[40, Math.max(600, maxSpesa)]} />
          {bx != null && <ReferenceLine x={bx} stroke={palette.textFaint} strokeDasharray="4 4" label={{ value: `Hook mediana ${pctStr(bx, 0)}`, fill: palette.textDim, fontSize: 10, position: "insideTopLeft" }} />}
          {by != null && <ReferenceLine y={by} stroke={palette.textFaint} strokeDasharray="4 4" label={{ value: `CTR mediana ${pctStr(by, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideBottomRight" }} />}
          <Tooltip cursor={{ strokeDasharray: "3 3", stroke: palette.textFaint }} content={<HookScatterTooltip />} />
          <Scatter data={points.filter((p) => p.verdetto === "SCALA" || p.verdetto === "PROMETTE")} fill={POSITIVE} fillOpacity={0.75} name="Scala/Promette" />
          <Scatter data={points.filter((p) => p.verdetto === "RINNOVA")} fill="#f59e0b" fillOpacity={0.75} name="Rinnova" />
          <Scatter data={points.filter((p) => p.verdetto === "MANTIENI")} fill="#0ea5e9" fillOpacity={0.75} name="Mantieni" />
          <Scatter data={points.filter((p) => p.verdetto === "SPEGNI" || p.verdetto === "DA RIVEDERE")} fill={NEGATIVE} fillOpacity={0.75} name="Spegni/Rivedi" />
          <Scatter data={points.filter((p) => p.verdetto === "OSSERVA" || p.verdetto === "IN RACCOLTA")} fill="#94a3b8" fillOpacity={0.6} name="Osserva/Raccolta" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HookScatterTooltip({ active, payload }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as MetaValutazione;
  return (
    <div style={{
      background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.7rem 0.85rem", fontSize: 12, color: palette.text, maxWidth: 280,
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    }}>
      <p style={{ margin: 0, fontWeight: 700, marginBottom: 4, wordBreak: "break-word" }}>{p.nome}</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
        <VerdictBadge verdict={p.verdetto} />
        <span style={{ fontSize: 10, color: palette.textDim }}>{p.stadio}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>Hook</span><span style={{ textAlign: "right" }}>{pctStr(p.hook, 1)}</span>
        <span style={{ color: palette.textDim }}>CTR link</span><span style={{ textAlign: "right" }}>{pctStr(p.ctr_link, 2)}</span>
        <span style={{ color: palette.textDim }}>Spesa</span><span style={{ textAlign: "right" }}>{eur(p.spesa)}</span>
        <span style={{ color: palette.textDim }}>ROAS</span><span style={{ textAlign: "right" }}>{num(p.roas, 2)}</span>
      </div>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────

type PlainAgg = { imp: number; click: number; spesa: number; conv: number; valore: number; indicazioni: number; chiamate: number };

function aggregateAdvTotals(daily: (string | number)[][] | undefined, range: { start: string; end: string }): PlainAgg {
  const a: PlainAgg = { imp: 0, click: 0, spesa: 0, conv: 0, valore: 0, indicazioni: 0, chiamate: 0 };
  if (!daily) return a;
  for (const r of daily) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    a.spesa += Number(r[5]) || 0; a.imp += Number(r[6]) || 0; a.click += Number(r[7]) || 0;
    a.conv += Number(r[8]) || 0; a.valore += Number(r[9]) || 0;
    a.indicazioni += Number(r[10]) || 0; a.chiamate += Number(r[11]) || 0;
  }
  return a;
}

function aggregateAdvByGroup(daily: (string | number)[][] | undefined, range: { start: string; end: string }, keyIdx: number) {
  const map = new Map<string, PlainAgg & { key: string }>();
  if (!daily) return [];
  for (const r of daily) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    const key = String(r[keyIdx] ?? "");
    const g = map.get(key) ?? { key, imp: 0, click: 0, spesa: 0, conv: 0, valore: 0, indicazioni: 0, chiamate: 0 };
    g.spesa += Number(r[5]) || 0; g.imp += Number(r[6]) || 0; g.click += Number(r[7]) || 0;
    g.conv += Number(r[8]) || 0; g.valore += Number(r[9]) || 0;
    g.indicazioni += Number(r[10]) || 0; g.chiamate += Number(r[11]) || 0;
    map.set(key, g);
  }
  return Array.from(map.values()).sort((a, b) => b.spesa - a.spesa);
}

function groupAdvByField(daily: (string | number)[][] | undefined, range: { start: string; end: string }, keyIdx: number, valueIdx: number): Map<string, number> {
  const out = new Map<string, number>();
  if (!daily) return out;
  for (const r of daily) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    const k = String(r[keyIdx] ?? "");
    out.set(k, (out.get(k) ?? 0) + (Number(r[valueIdx]) || 0));
  }
  return out;
}

function buildDailyByPlatform(daily: (string | number)[][] | undefined, range: { start: string; end: string }) {
  if (!daily) return [];
  const byDate = new Map<string, { date: string; label: string; Meta: number; Google: number }>();
  for (const r of daily) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    const row = byDate.get(d) ?? { date: d, label: fmtDate(d), Meta: 0, Google: 0 };
    const plat = String(r[1]) as "Meta" | "Google";
    if (plat === "Meta" || plat === "Google") row[plat] += Number(r[5]) || 0;
    byDate.set(d, row);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function DonutFromMap({ map, formatter }: { map: Map<string, number>; formatter?: (v: number) => string }) {
  const { palette } = useTheme();
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return <EmptyState />;
  const chart = entries.map(([name, value]) => ({ name, value }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} stroke="none">
              {chart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, color: palette.text }}
              formatter={(v: unknown, n: unknown) => [`${formatter ? formatter(Number(v ?? 0)) : integer(Number(v ?? 0))} · ${pctStr(total ? (Number(v ?? 0) / total) * 100 : 0, 1)}`, String(n)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
        {chart.map((c, i) => {
          const pct = total > 0 ? (c.value / total) * 100 : 0;
          return (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: CHART_PALETTE[i % CHART_PALETTE.length], flexShrink: 0 }} />
              <span style={{ color: palette.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ color: palette.textMuted, fontVariantNumeric: "tabular-nums" }}>{formatter ? formatter(c.value) : integer(c.value)}</span>
              <span style={{ color: palette.textDim, fontVariantNumeric: "tabular-nums", minWidth: 44, textAlign: "right" }}>{pctStr(pct, 1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ Funnel strip (2a) ═══════════════════════════════════════════

function FunnelStrip({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const s = data.summary?.w30;
  if (!s) return null;
  const steps = [
    { label: "Add to Cart",       val: s.add_to_cart, rate: s.tasso_carrello_pct,  color: ACCENT },
    { label: "Initiate Checkout", val: s.checkout,     rate: s.tasso_checkout_pct,  color: GOLD },
    { label: "Purchase",          val: s.transazioni_ga4, rate: s.tasso_acquisto_pct, color: POSITIVE },
  ];
  const maxV = Math.max(...steps.map((x) => x.val), 1);
  return (
    <Card>
      <CardHeader title="Funnel · 30 giorni (da summary GA4)"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ATC · Checkout · Purchase, con tasso di passaggio</span>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((st, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ minWidth: 160, fontSize: 12, color: palette.text, fontWeight: 500 }}>{st.label}</span>
            <div style={{ flex: 1, height: 22, background: palette.divider, borderRadius: 4, overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${(st.val / maxV) * 100}%`, height: "100%", background: st.color, transition: "width 0.3s" }} />
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: palette.text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{integer(st.val)}</span>
            </div>
            <span style={{ minWidth: 100, textAlign: "right", fontSize: 11, color: palette.textMuted, fontVariantNumeric: "tabular-nums" }}>
              {pctStr(st.rate, 2)} pass.
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ═══ 2g Cosa vince: formato e soggetto ══════════════════════════

type GroupRow = {
  nome: string; n: number;
  spesa: number; impression: number; clickLink: number; atc: number; acquisti: number; valore: number;
  hookNum: number; imprVideo: number;
};

/** Somma le creatività della finestra per un taglio (formato o soggetto). */
function groupCreatives(creatives: CreativeMetricsRaw[], keyOf: (c: CreativeMetricsRaw) => string): GroupRow[] {
  const m = new Map<string, GroupRow>();
  for (const c of creatives) {
    const k = keyOf(c) || "—";
    const g = m.get(k) ?? { nome: k, n: 0, spesa: 0, impression: 0, clickLink: 0, atc: 0, acquisti: 0, valore: 0, hookNum: 0, imprVideo: 0 };
    g.n++; g.spesa += c.spesa; g.impression += c.impression; g.clickLink += c.clickLink;
    g.atc += c.atc; g.acquisti += c.acquisti; g.valore += c.valore;
    if (isVideoFormat(c.formato)) { g.hookNum += c.hookRate * c.impression; g.imprVideo += c.impression; }
    m.set(k, g);
  }
  return [...m.values()];
}

function FormatiSoggettiView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const { preset, range } = useDateRange();
  // Il periodo lo decide il selettore in alto: ricondotto alla finestra del motore più vicina
  const { win, exact } = creativeWindowFor(preset, range.days);
  const windows = useCreativeWindows(data);
  const creatives = useMemo(() => [...windows[win].values()], [windows, win]);
  const perFormato = useMemo(() => groupCreatives(creatives, (c) => c.formato), [creatives]);
  const perSoggetto = useMemo(() => groupCreatives(creatives, (c) => c.soggetto), [creatives]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {!exact && (
        <p style={{ margin: 0, fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
          Periodo: <strong style={{ color: palette.textMuted }}>{WINDOW_LABEL[win]}</strong>, la finestra più vicina al periodo selezionato in alto: le creatività sono calcolate su 7, 30 e 90 giorni.
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title={`Per formato · ${WINDOW_LABEL[win]}`}
            right={<span style={{ fontSize: 11, color: palette.textDim }}>convenzione naming: Formato - Soggetto - Numero</span>} />
          <AggTable rows={perFormato} noun="formati" nameLabel="Formato" />
        </Card>
        <Card>
          <CardHeader title={`Per soggetto · ${WINDOW_LABEL[win]}`} />
          <AggTable rows={perSoggetto} noun="soggetti" nameLabel="Soggetto" />
        </Card>
      </div>
    </div>
  );
}

function AggTable({ rows, noun, nameLabel }: { rows: GroupRow[]; noun: string; nameLabel: string }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const derived = (g: GroupRow) => ({
    ctrLink: ratio(g.clickLink, g.impression, 100),
    costoAtc: ratio(g.spesa, g.atc),
    roas: g.valore > 0 ? ratio(g.valore, g.spesa) : null,
    hook: ratio(g.hookNum, g.imprVideo),
  });

  const { sorted, sort, toggle } = useTableSort<GroupRow>(rows, (g, key): SortValue => {
    switch (key) {
      case "nome": return g.nome;
      case "spesa": return g.spesa;
      case "impr": return g.impression;
      case "clickLink": return g.clickLink;
      case "ctrLink": return derived(g).ctrLink;
      case "atc": return g.atc;
      case "costoAtc": return derived(g).costoAtc;
      case "acquisti": return g.acquisti;
      case "valore": return g.valore;
      case "roas": return derived(g).roas;
      case "hook": return derived(g).hook;
      default: return null;
    }
  }, { key: "spesa", dir: "desc" });

  // Media sulle righe: costi e tassi dai totali, volumi per riga
  const avg = useMemo(() => {
    const t = rows.reduce((a, g) => ({
      spesa: a.spesa + g.spesa, impression: a.impression + g.impression, clickLink: a.clickLink + g.clickLink,
      atc: a.atc + g.atc, valore: a.valore + g.valore, hookNum: a.hookNum + g.hookNum, imprVideo: a.imprVideo + g.imprVideo,
    }), { spesa: 0, impression: 0, clickLink: 0, atc: 0, valore: 0, hookNum: 0, imprVideo: 0 });
    return {
      spesa: mean(rows.map((g) => g.spesa)),
      impr: mean(rows.map((g) => g.impression)),
      clickLink: mean(rows.map((g) => g.clickLink)),
      ctrLink: ratio(t.clickLink, t.impression, 100),
      atc: mean(rows.map((g) => g.atc)),
      costoAtc: ratio(t.spesa, t.atc),
      acquisti: mean(rows.map((g) => g.acquisti)),
      valore: t.valore > 0 ? mean(rows.map((g) => g.valore)) : null,
      roas: t.valore > 0 ? ratio(t.valore, t.spesa) : null,
      hook: ratio(t.hookNum, t.imprVideo),
    };
  }, [rows]);

  if (rows.length === 0) return <EmptyState label="Nessun dato" />;
  const th = { sort, onSort: toggle };
  const dash = "—";
  const fmt = (v: number | null, f: (n: number) => string) => (v == null ? dash : f(v));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead><tr>
          <SortTh label={nameLabel} sortKey="nome" {...th} />
          <SortTh label="Spesa" sortKey="spesa" align="right" {...th} />
          <SortTh label="Imp." sortKey="impr" align="right" {...th} />
          <SortTh label="Click link" sortKey="clickLink" align="right" {...th} />
          <SortTh label="CTR link" sortKey="ctrLink" align="right" {...th} />
          <SortTh label="ATC" sortKey="atc" align="right" {...th} />
          <SortTh label="Costo/ATC" sortKey="costoAtc" align="right" first="asc" {...th} />
          <SortTh label="Acquisti" sortKey="acquisti" align="right" {...th} />
          <SortTh label="Valore" sortKey="valore" align="right" {...th} />
          <SortTh label="ROAS" sortKey="roas" align="right" {...th} />
          <SortTh label="Hook medio" sortKey="hook" align="right" title="Solo video, ponderato sulle impression" {...th} />
        </tr></thead>
        <tbody>
          <tr style={avgRowStyle(palette)}>
            <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700, whiteSpace: "nowrap" }} title={AVG_TITLE}>
              Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(rows.length)} {noun}</span>
            </td>
            <AvgTd ts={ts}>{fmt(avg.spesa, eur)}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.impr, integer)}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.clickLink, integer)}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.ctrLink, (v) => pctStr(v, 2))}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.atc, (v) => num(v, 1))}</AvgTd>
            <AvgTd ts={ts} strong>{fmt(avg.costoAtc, eur)}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.acquisti, (v) => num(v, 1))}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.valore, eur)}</AvgTd>
            <AvgTd ts={ts} strong>{fmt(avg.roas, (v) => num(v, 2))}</AvgTd>
            <AvgTd ts={ts}>{fmt(avg.hook, (v) => pctStr(v, 1))}</AvgTd>
          </tr>
          {sorted.map((g) => {
            const d = derived(g);
            return (
              <tr key={g.nome}>
                <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 600 }}>{g.nome}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(g.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(g.impression)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(g.clickLink)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{fmt(d.ctrLink, (v) => pctStr(v, 2))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(g.atc)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{fmt(d.costoAtc, eur)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(g.acquisti)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{g.valore > 0 ? eur(g.valore) : dash}</td>
                <td style={{
                  ...ts.tdBase, ...ts.tdRight, fontWeight: 600,
                  color: d.roas == null ? ts.tdBase.color : d.roas >= AD_CFG.ROAS_GOOD ? POSITIVE : d.roas < 1 ? NEGATIVE : ts.tdBase.color,
                }}>{fmt(d.roas, (v) => num(v, 2))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{fmt(d.hook, (v) => pctStr(v, 1))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══ 2h Pubblico, paesi, placement ═══════════════════════════════

function PubblicoPlacementView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title="Adsets Meta · 30 giorni"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>ambra: spesa sopra mediana e 0 acquisti · verde: costo/ATC sotto mediana</span>} />
        <BreakTable rows={data.meta?.adsets_w30 ?? []} head={data.meta?.adset_head ?? []} palette={palette} highlight />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Paesi · 30 giorni" />
          <BreakTable rows={data.meta?.paesi_w30 ?? []} head={data.meta?.break_head ?? []} palette={palette} highlight />
        </Card>
        <Card>
          <CardHeader title="Placement · 30 giorni" />
          <BreakTable rows={data.meta?.placement_w30 ?? []} head={data.meta?.break_head ?? []} palette={palette} highlight />
        </Card>
      </div>
    </div>
  );
}

function BreakTable({ rows, head, palette, highlight }: {
  rows: (string | number | null)[][]; head: string[];
  palette: import("./shared").Palette; highlight?: boolean;
}) {
  const ts = tableStyles(palette);
  if (rows.length === 0) return <EmptyState label="Nessun dato" />;
  // sort per spesa (colonna che dopo il/i nome contiene un numero grosso — di solito col 1 o 2)
  // Individuiamo l'indice colonna 'spesa'/ 'costo' oppure ripieghiamo su col 1
  const spesaIdx = (() => {
    for (let i = 0; i < head.length; i++) {
      const h = String(head[i]).toLowerCase();
      if (h.includes("spesa") || h === "costo") return i;
    }
    return head.length > 2 ? 2 : 1;
  })();
  const atcIdx = head.findIndex((h) => String(h).toLowerCase() === "atc");
  const acqIdx = head.findIndex((h) => String(h).toLowerCase().includes("acquisti"));
  const cpaIdx = head.findIndex((h) => String(h).toLowerCase().includes("costo_atc") || String(h).toLowerCase().includes("costo/atc"));
  const nameCols = head.slice(0, spesaIdx);
  const numCols = head.slice(spesaIdx);

  // mediane per highlighting
  const spesaVals = rows.map((r) => Number(r[spesaIdx]) || 0).filter((n) => n > 0).sort((a, b) => a - b);
  const cpaVals = cpaIdx >= 0 ? rows.map((r) => Number(r[cpaIdx]) || 0).filter((n) => n > 0).sort((a, b) => a - b) : [];
  const median = (arr: number[]) => arr.length === 0 ? 0 : arr.length % 2 === 0 ? (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2 : arr[Math.floor(arr.length / 2)];
  const spesaMed = median(spesaVals);
  const cpaMed = median(cpaVals);

  const sorted = [...rows].sort((a, b) => (Number(b[spesaIdx]) || 0) - (Number(a[spesaIdx]) || 0));

  const LABELS: Record<string, string> = {
    adset: "Adset", campaign: "Campagna", spesa: "Spesa", impression: "Imp.",
    ctr_link: "CTR link", click_link: "Click link", atc: "ATC",
    costo_atc: "Costo/ATC", acquisti: "Acquisti", valore_acq: "Valore",
    roas: "ROAS", hook_medio: "Hook",
  };
  const fmt = (col: string, v: unknown): string => {
    const n = Number(v ?? 0);
    if (v == null || v === "") return "—";
    if (col.includes("spesa") || col === "costo" || col.includes("costo") || col === "valore_acq") return eur(n);
    if (col === "roas") return num(n, 2);
    if (col.includes("ctr") || col === "hook_medio") return pctStr(n, 2);
    if (typeof v === "number") return integer(n);
    return String(v);
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead><tr>
          {nameCols.map((c) => <th key={c} style={ts.th}>{LABELS[c] ?? c}</th>)}
          {numCols.map((c) => <th key={c} style={{ ...ts.th, ...ts.thRight }}>{LABELS[c] ?? c}</th>)}
        </tr></thead>
        <tbody>
          {sorted.map((r, i) => {
            const spesa = Number(r[spesaIdx]) || 0;
            const atc = atcIdx >= 0 ? Number(r[atcIdx]) || 0 : 0;
            const acq = acqIdx >= 0 ? Number(r[acqIdx]) || 0 : 0;
            const cpa = cpaIdx >= 0 ? Number(r[cpaIdx]) || 0 : 0;
            const isProblem = highlight && spesa > spesaMed && acq === 0;
            const isGood = highlight && cpaIdx >= 0 && cpa > 0 && cpa < cpaMed;
            const rowBg = isProblem ? "rgba(245,158,11,0.10)" : isGood ? "rgba(34,197,94,0.08)" : undefined;
            return (
              <tr key={i} style={{ background: rowBg }}>
                {nameCols.map((c, ci) => (
                  <td key={c} style={{
                    ...ts.tdBase, color: palette.text, fontWeight: ci === 0 ? 500 : 400,
                    maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: ci === 0 ? "'JetBrains Mono', ui-monospace, monospace" : "inherit",
                    fontSize: 11,
                  }} title={String(r[ci] ?? "")}>{String(r[ci] ?? "—")}</td>
                ))}
                {numCols.map((c, ci) => {
                  const colGlobal = spesaIdx + ci;
                  const val = r[colGlobal];
                  const n = Number(val) || 0;
                  const color = c === "roas" ? (n >= AD_CFG.ROAS_GOOD ? POSITIVE : n > 0 && n < 1 ? NEGATIVE : undefined)
                    : c === "costo_atc" && highlight && cpaIdx === colGlobal && n > 0 && n < cpaMed ? POSITIVE
                    : undefined;
                  const bold = c.includes("spesa") || c === "acquisti" || c === "roas";
                  return (
                    <td key={c} style={{
                      ...ts.tdBase, ...ts.tdRight,
                      color: color ?? ts.tdBase.color,
                      fontWeight: bold ? 600 : 400,
                    }}>{fmt(c, val)}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Aggregazione valutazione per nome + formato ───────────────────

function aggregateValutazione(rows: MetaValutazione[]): MetaValutazione[] {
  const byKey = new Map<string, MetaValutazione[]>();
  for (const v of rows) {
    const key = v.nome.toLowerCase().trim() + "|" + v.formato.toLowerCase().trim();
    const arr = byKey.get(key);
    if (arr) arr.push(v); else byKey.set(key, [v]);
  }
  const out: MetaValutazione[] = [];
  for (const parts of byKey.values()) {
    if (parts.length === 1) { out.push(parts[0]); continue; }
    // Additive: spesa, impr, acquisti, atc
    let spesa = 0, impr = 0, acquisti = 0, atc = 0;
    // Valore derivato dal ROAS di riga: valore = roas * spesa; sommato → ROAS aggregato
    let valore = 0;
    // Weighted-by-impr: hook, ctr_link
    let hookNumerator = 0, ctrNumerator = 0;
    // Meta scelte dalla riga con più spesa
    let best = parts[0]; let bestSpesa = -1;
    for (const p of parts) {
      spesa += p.spesa; impr += p.impr; acquisti += p.acquisti; atc += p.atc;
      valore += (p.roas ?? 0) * p.spesa;
      hookNumerator += (p.hook ?? 0) * p.impr;
      ctrNumerator += (p.ctr_link ?? 0) * p.impr;
      if (p.spesa > bestSpesa) { bestSpesa = p.spesa; best = p; }
    }
    out.push({
      nome: parts[0].nome,
      formato: parts[0].formato,
      soggetto: parts[0].soggetto,
      stadio: best.stadio,
      verdetto: best.verdetto,
      azione: best.azione,
      segnali: best.segnali,
      fatigue: best.fatigue ?? null,
      // Indice pesato per spesa (media ponderata)
      indice: spesa > 0 ? parts.reduce((s, p) => s + p.indice * p.spesa, 0) / spesa : best.indice,
      spesa,
      impr,
      acquisti,
      atc,
      hook: impr > 0 ? hookNumerator / impr : (best.hook ?? 0),
      ctr_link: impr > 0 ? ctrNumerator / impr : (best.ctr_link ?? 0),
      costo_atc: atc > 0 ? spesa / atc : (best.costo_atc ?? 0),
      roas: spesa > 0 ? valore / spesa : 0,
    });
  }
  // Ripristina l'ordinamento originale del motore: prima quelle con verdetto più "caldo"
  out.sort((a, b) => (VERDICT_RANK[a.verdetto] - VERDICT_RANK[b.verdetto]) || (b.spesa - a.spesa));
  return out;
}
