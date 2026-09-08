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
} from "./shared";

type SubTab = "riepilogo" | "obiettivo" | "piattaforma" | "campagne" | "search" | "creative";
type CreativesWindow = "w7" | "w30" | "w90";

const SUB: { key: SubTab; label: string }[] = [
  { key: "riepilogo", label: "Riepilogo" },
  { key: "obiettivo", label: "Per obiettivo" },
  { key: "piattaforma", label: "Per piattaforma" },
  { key: "campagne", label: "Campagne" },
  { key: "search", label: "Search terms Google" },
  { key: "creative", label: "Creatività Meta" },
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

  const rows = useMemo(() => {
    const grouped = new Map<string, { plat: string; obj: string; tipo: string; spesa: number; imp: number; click: number; conv: number; valore: number }>();
    for (const r of data.adv?.daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const key = String(r[3] ?? "");
      const g = grouped.get(key) ?? { plat: String(r[1] ?? ""), obj: String(r[2] ?? ""), tipo: String(r[4] ?? ""), spesa: 0, imp: 0, click: 0, conv: 0, valore: 0 };
      g.spesa += Number(r[5]) || 0;
      g.imp += Number(r[6]) || 0;
      g.click += Number(r[7]) || 0;
      g.conv += Number(r[8]) || 0;
      g.valore += Number(r[9]) || 0;
      grouped.set(key, g);
    }
    let arr = Array.from(grouped.entries()).map(([campagna, v]) => ({ campagna, ...v }));
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
  }, [data.adv?.daily, range, platFilter, objFilter, search, sortBy, sortDir]);

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
                {sortHdr("click", "Click", true)}
                {sortHdr("conv", "Conv.", true)}
                {sortHdr("valore", "Valore", true)}
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ctr = r.imp > 0 ? (r.click / r.imp) * 100 : 0;
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
                      <td style={{ ...ts.tdBase, ...ts.tdRight }} title={`CTR ${pctStr(ctr, 2)}`}>{integer(r.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.conv > 0 ? 600 : 400 }}>{num(r.conv, 1)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.valore)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: bad ? NEGATIVE : roas >= AD_CFG.ROAS_GOOD ? POSITIVE : ts.tdBase.color, fontWeight: 700 }}>{num(roas, 2)}</td>
                    </tr>
                    {isOpen && <CampaignExpanded data={data} campagna={r.campagna} palette={palette} />}
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

function CampaignExpanded({ data, campagna, palette }: { data: GondolinaData; campagna: string; palette: import("./shared").Palette }) {
  const { range } = useDateRange();
  const daily = useMemo(() => {
    return (data.adv?.daily ?? [])
      .filter((r) => String(r[3]) === campagna && String(r[0]) >= range.start && String(r[0]) <= range.end)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map((r) => ({ label: fmtDate(String(r[0])), spesa: Number(r[5]) || 0, valore: Number(r[9]) || 0 }));
  }, [data.adv?.daily, campagna, range]);
  return (
    <tr>
      <td colSpan={10} style={{ padding: "12px 16px", background: palette.divider }}>
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

// ═══ 2f Creatività Meta ═══════════════════════════════════════════

type Verdict = "scala" | "fatigue" | "spegni" | "osserva" | "mantieni";

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; desc: string }> = {
  scala: { label: "Scala", color: "#22c55e", bg: "rgba(34,197,94,0.15)", desc: "ROAS solido e pubblico non saturo: alza il budget" },
  fatigue: { label: "Fatigue in arrivo", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", desc: "Funziona ma inizia a saturare: prepara ricambio" },
  spegni: { label: "Spegni", color: "#ef4444", bg: "rgba(239,68,68,0.15)", desc: "Spreco: costa e non produce" },
  osserva: { label: "Osserva", color: "#94a3b8", bg: "rgba(148,163,184,0.18)", desc: "Dati insufficienti" },
  mantieni: { label: "Mantieni", color: "#0ea5e9", bg: "rgba(14,165,233,0.15)", desc: "Nella norma" },
};

type CreativeMetrics = {
  name: string; stato: string; obiettivo: string;
  spesa: number; imp: number; reach: number; freq: number;
  click: number; ctr: number; cpm: number; cpc: number;
  acquisti: number; valore: number; roas: number; lpv: number; atc: number;
};

function toMetrics(r: (string | number)[]): CreativeMetrics {
  return {
    name: String(r[0] ?? ""), stato: String(r[1] ?? ""), obiettivo: String(r[2] ?? ""),
    spesa: Number(r[3]) || 0, imp: Number(r[4]) || 0, reach: Number(r[5]) || 0, freq: Number(r[6]) || 0,
    click: Number(r[7]) || 0, ctr: Number(r[8]) || 0, cpm: Number(r[9]) || 0, cpc: Number(r[10]) || 0,
    acquisti: Number(r[11]) || 0, valore: Number(r[12]) || 0, roas: Number(r[13]) || 0,
    lpv: Number(r[14]) || 0, atc: Number(r[15]) || 0,
  };
}

// Meta espone la stessa inserzione una volta per adset/campagna: aggreghiamo per nome
// per non contare più volte la stessa creatività. Reach viene sommato (sovrastima
// se una persona è raggiunta da più adset), ma è il compromesso standard di Meta stessa.
function aggregateCreatives(rows: (string | number)[][]): CreativeMetrics[] {
  const byName = new Map<string, CreativeMetrics[]>();
  for (const r of rows) {
    const m = toMetrics(r);
    const key = m.name.toLowerCase().trim();
    if (!key) continue;
    const arr = byName.get(key);
    if (arr) arr.push(m); else byName.set(key, [m]);
  }
  const out: CreativeMetrics[] = [];
  for (const parts of byName.values()) {
    if (parts.length === 1) { out.push(parts[0]); continue; }
    // metriche additive
    let spesa = 0, imp = 0, reach = 0, click = 0, acquisti = 0, valore = 0, lpv = 0, atc = 0;
    // stato: ACTIVE vince su PAUSED che vince su CAMPAIGN_PAUSED
    let stato = parts[0].stato;
    // obiettivo: quello con più spesa
    let bestObj = parts[0].obiettivo, bestObjSpend = -1;
    for (const p of parts) {
      spesa += p.spesa; imp += p.imp; reach += p.reach; click += p.click;
      acquisti += p.acquisti; valore += p.valore; lpv += p.lpv; atc += p.atc;
      if (p.stato === "ACTIVE") stato = "ACTIVE";
      else if (p.stato === "PAUSED" && stato !== "ACTIVE") stato = "PAUSED";
      if (p.spesa > bestObjSpend) { bestObjSpend = p.spesa; bestObj = p.obiettivo; }
    }
    out.push({
      name: parts[0].name, stato, obiettivo: bestObj,
      spesa, imp, reach, click, acquisti, valore, lpv, atc,
      freq: reach > 0 ? imp / reach : 0,
      ctr: imp > 0 ? (click / imp) * 100 : 0,
      cpm: imp > 0 ? (spesa / imp) * 1000 : 0,
      cpc: click > 0 ? spesa / click : 0,
      roas: spesa > 0 ? valore / spesa : 0,
    });
  }
  return out;
}

function computeVerdict(w30: CreativeMetrics, w7: CreativeMetrics | undefined): { verdict: Verdict; reason: string } {
  const roas = w30.roas;
  const spesa = w30.spesa;
  const acquisti = w30.acquisti;
  const freqW7 = w7?.freq ?? 0;
  const ctrW7 = w7?.ctr ?? 0;
  const ctrW30 = w30.ctr;
  const ctrDropRatio = ctrW30 > 0 ? ctrW7 / ctrW30 : 1;
  const isSales = SALES_OBJECTIVES.has(w30.obiettivo.toUpperCase());

  if (spesa >= AD_CFG.MIN_SPEND && acquisti === 0 && isSales) return { verdict: "spegni", reason: `Spesa ${eur(spesa)} con 0 acquisti` };
  if (roas > 0 && roas < 1 && isSales) return { verdict: "spegni", reason: `ROAS ${num(roas, 2)} sotto 1,0` };
  if (spesa < AD_CFG.MIN_SPEND) return { verdict: "osserva", reason: `Spesa ${eur(spesa)} sotto ${eur(AD_CFG.MIN_SPEND)}: dati insufficienti` };

  if (isSales && roas >= AD_CFG.ROAS_GOOD) {
    if (freqW7 >= AD_CFG.FREQ_HIGH) return { verdict: "fatigue", reason: `Frequenza w7 ${num(freqW7, 2)} sopra ${num(AD_CFG.FREQ_HIGH, 1)}` };
    if (w7 && ctrW30 > 0 && ctrDropRatio < 1 - AD_CFG.CTR_DROP) {
      const drop = (1 - ctrDropRatio) * 100;
      return { verdict: "fatigue", reason: `CTR w7 −${num(drop, 0)}% vs 30g` };
    }
    if (w7 && freqW7 < AD_CFG.FREQ_HIGH && ctrW7 >= ctrW30) {
      return { verdict: "scala", reason: `ROAS ${num(roas, 2)} · freq w7 ${num(freqW7, 2)} · CTR stabile o crescente` };
    }
  }
  return { verdict: "mantieni", reason: `ROAS ${num(roas, 2)} · nella norma` };
}

function CreativitaMetaView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const [scatterWindow, setScatterWindow] = useState<CreativesWindow>("w30");
  const [filter, setFilter] = useState<"all" | Verdict>("all");
  const [includePaused, setIncludePaused] = useState(false);

  const w30rows = data.meta?.creatives?.w30?.rows ?? [];
  const w7rows = data.meta?.creatives?.w7?.rows ?? [];

  const enriched = useMemo(() => {
    const w7agg = aggregateCreatives(w7rows);
    const w7map = new Map<string, CreativeMetrics>();
    for (const m of w7agg) w7map.set(m.name.toLowerCase().trim(), m);
    return aggregateCreatives(w30rows).map((w30m) => {
      const w7m = w7map.get(w30m.name.toLowerCase().trim());
      const v = computeVerdict(w30m, w7m);
      return { w30: w30m, w7: w7m, verdict: v.verdict, reason: v.reason };
    }).sort((a, b) => b.w30.spesa - a.w30.spesa);
  }, [w30rows, w7rows]);

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = { scala: 0, fatigue: 0, spegni: 0, osserva: 0, mantieni: 0 };
    for (const r of enriched) {
      if (!includePaused && r.w30.stato !== "ACTIVE") continue;
      c[r.verdict]++;
    }
    return c;
  }, [enriched, includePaused]);

  const visible = useMemo(() => enriched.filter((r) => {
    if (!includePaused && r.w30.stato !== "ACTIVE") return false;
    if (filter !== "all" && r.verdict !== filter) return false;
    return true;
  }), [enriched, filter, includePaused]);

  const scatterSrc = data.meta?.creatives?.[scatterWindow];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title="Matrice creatività · ROAS × Frequenza"
          right={<div style={{ display: "flex", gap: 6 }}>
            <Pill active={scatterWindow === "w7"} onClick={() => setScatterWindow("w7")}>7g</Pill>
            <Pill active={scatterWindow === "w30"} onClick={() => setScatterWindow("w30")}>30g</Pill>
            <Pill active={scatterWindow === "w90"} onClick={() => setScatterWindow("w90")}>90g</Pill>
          </div>}
        />
        {!scatterSrc || scatterSrc.rows.length === 0 ? <EmptyState /> : <RoasScatter rows={aggregateCreatives(scatterSrc.rows)} />}
      </Card>

      <Card>
        <CardHeader title="Verdetti operativi"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>
            soglie ROAS ≥ {num(AD_CFG.ROAS_GOOD, 1)} · freq ≥ {num(AD_CFG.FREQ_HIGH, 1)} · spesa min {eur(AD_CFG.MIN_SPEND)}
          </span>}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
          <VerdictCard verdict="scala" label="Da scalare" count={counts.scala} active={filter === "scala"} onClick={() => setFilter(filter === "scala" ? "all" : "scala")} />
          <VerdictCard verdict="fatigue" label="Fatigue in arrivo" count={counts.fatigue} active={filter === "fatigue"} onClick={() => setFilter(filter === "fatigue" ? "all" : "fatigue")} />
          <VerdictCard verdict="spegni" label="Da spegnere" count={counts.spegni} active={filter === "spegni"} onClick={() => setFilter(filter === "spegni" ? "all" : "spegni")} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: palette.textDim, fontWeight: 600 }}>Filtra:</span>
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>Tutti</Pill>
          <Pill active={filter === "scala"} onClick={() => setFilter("scala")}>Scala</Pill>
          <Pill active={filter === "fatigue"} onClick={() => setFilter("fatigue")}>Fatigue</Pill>
          <Pill active={filter === "spegni"} onClick={() => setFilter("spegni")}>Spegni</Pill>
          <Pill active={filter === "mantieni"} onClick={() => setFilter("mantieni")}>Mantieni</Pill>
          <Pill active={filter === "osserva"} onClick={() => setFilter("osserva")}>Osserva</Pill>
          <div style={{ flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={includePaused} onChange={(e) => setIncludePaused(e.target.checked)} style={{ accentColor: GOLD }} />
            <span style={{ color: palette.textMuted }}>Includi PAUSED</span>
          </label>
        </div>
        {visible.length === 0 ? <EmptyState label="Nessuna creatività coi filtri" /> : <VerdictTable rows={visible} />}
      </Card>
    </div>
  );
}

function VerdictCard({ verdict, label, count, active, onClick }: {
  verdict: Verdict; label: string; count: number; active: boolean; onClick: () => void;
}) {
  const { palette } = useTheme();
  const m = VERDICT_META[verdict];
  return (
    <button onClick={onClick} style={{
      textAlign: "left", cursor: "pointer",
      padding: "0.9rem 1rem", borderRadius: 12,
      border: `1px solid ${active ? m.color : palette.cardBorder}`,
      background: active ? m.bg : palette.divider,
      color: palette.text, fontFamily: "inherit",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: m.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{integer(count)}</p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.textDim }}>{m.desc}</p>
    </button>
  );
}

function VerdictTable({ rows }: { rows: { w30: CreativeMetrics; w7: CreativeMetrics | undefined; verdict: Verdict; reason: string }[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Creatività</th><th style={ts.th}>Obiettivo</th><th style={ts.th}>Stato</th><th style={ts.th}>Verdetto</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Spesa 30g</th><th style={{ ...ts.th, ...ts.thRight }}>Freq 7g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR 30g</th><th style={{ ...ts.th, ...ts.thRight }}>Acquisti</th>
            <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const m = VERDICT_META[r.verdict];
            const active = r.w30.stato === "ACTIVE";
            return (
              <tr key={i}>
                <td style={{ ...ts.tdBase, maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: palette.text, fontWeight: 500 }} title={r.w30.name}>{r.w30.name}</td>
                <td style={{ ...ts.tdBase, fontSize: 10 }}>
                  <span style={{ padding: "1px 7px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontWeight: 600 }}>{r.w30.obiettivo}</span>
                </td>
                <td style={ts.tdBase}>
                  <span style={{ padding: "1px 8px", borderRadius: 20, background: active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.20)", color: active ? "#22c55e" : palette.textDim, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>{r.w30.stato}</span>
                </td>
                <td style={ts.tdBase}>
                  <span title={r.reason} style={{ padding: "2px 10px", borderRadius: 20, background: m.bg, color: m.color, fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "help", border: `1px solid ${m.color}30` }}>{m.label}</span>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.w30.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.w7 && r.w7.freq >= AD_CFG.FREQ_HIGH ? "#f59e0b" : ts.tdBase.color, fontWeight: 500 }}>{r.w7 ? num(r.w7.freq, 2) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.w30.ctr * 100, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.w30.acquisti > 0 ? 600 : 400 }}>{integer(r.w30.acquisti)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.w30.roas >= AD_CFG.ROAS_GOOD ? POSITIVE : r.w30.roas > 0 && r.w30.roas < 1 ? NEGATIVE : ts.tdBase.color, fontWeight: 700 }}>{num(r.w30.roas, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RoasScatter({ rows }: { rows: CreativeMetrics[] }) {
  const { palette } = useTheme();
  const points = rows.filter((r) => r.freq > 0 && r.roas >= 0 && SALES_OBJECTIVES.has(r.obiettivo.toUpperCase()));
  if (points.length === 0) return <EmptyState label="Nessuna creatività con obiettivo vendite" />;
  const maxFreq = Math.max(AD_CFG.FREQ_HIGH * 1.6, ...points.map((p) => p.freq));
  const maxRoas = Math.max(AD_CFG.ROAS_GOOD * 1.6, ...points.map((p) => p.roas));
  const maxSpesa = Math.max(1, ...points.map((p) => p.spesa));
  return (
    <div style={{ width: "100%", height: 380 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 24, bottom: 40, left: 24 }}>
          <CartesianGrid stroke={palette.grid} />
          <ReferenceArea x1={0} x2={AD_CFG.FREQ_HIGH} y1={AD_CFG.ROAS_GOOD} y2={maxRoas} fill="#22c55e" fillOpacity={0.06} strokeOpacity={0} />
          <ReferenceArea x1={AD_CFG.FREQ_HIGH} x2={maxFreq} y1={AD_CFG.ROAS_GOOD} y2={maxRoas} fill="#0ea5e9" fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceArea x1={0} x2={AD_CFG.FREQ_HIGH} y1={0} y2={AD_CFG.ROAS_GOOD} fill={GOLD} fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceArea x1={AD_CFG.FREQ_HIGH} x2={maxFreq} y1={0} y2={AD_CFG.ROAS_GOOD} fill="#ef4444" fillOpacity={0.08} strokeOpacity={0} />
          <XAxis type="number" dataKey="freq" name="Frequenza" domain={[0, maxFreq]}
            tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => num(Number(v), 1)}
            label={{ value: "Frequenza →", position: "insideBottom", offset: -8, fill: palette.textDim, fontSize: 11 }} />
          <YAxis type="number" dataKey="roas" name="ROAS" domain={[0, maxRoas]}
            tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => num(Number(v), 1)}
            label={{ value: "ROAS ↑", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }} />
          <ZAxis type="number" dataKey="spesa" range={[40, Math.max(600, maxSpesa)]} />
          <ReferenceLine y={AD_CFG.ROAS_GOOD} stroke={palette.textFaint} strokeDasharray="4 4" label={{ value: `ROAS ${num(AD_CFG.ROAS_GOOD, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideBottomRight" }} />
          <ReferenceLine x={AD_CFG.FREQ_HIGH} stroke={palette.textFaint} strokeDasharray="4 4" label={{ value: `Freq ${num(AD_CFG.FREQ_HIGH, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideTopLeft" }} />
          <Tooltip cursor={{ strokeDasharray: "3 3", stroke: palette.textFaint }} content={<ScatterTooltip />} />
          <Scatter data={points} fill={ACCENT} fillOpacity={0.7} stroke={ACCENT} strokeWidth={1.5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltip({ active, payload }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as CreativeMetrics;
  return (
    <div style={{
      background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.7rem 0.85rem", fontSize: 12, color: palette.text, maxWidth: 260,
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    }}>
      <p style={{ margin: 0, fontWeight: 700, marginBottom: 4, wordBreak: "break-word" }}>{p.name}</p>
      <p style={{ margin: 0, fontSize: 10, color: p.stato === "ACTIVE" ? "#22c55e" : palette.textDim, textTransform: "uppercase" }}>{p.stato}</p>
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>ROAS</span><span style={{ textAlign: "right" }}>{num(p.roas, 2)}</span>
        <span style={{ color: palette.textDim }}>Frequenza</span><span style={{ textAlign: "right" }}>{num(p.freq, 2)}</span>
        <span style={{ color: palette.textDim }}>Spesa</span><span style={{ textAlign: "right" }}>{eur(p.spesa)}</span>
        <span style={{ color: palette.textDim }}>Acquisti</span><span style={{ textAlign: "right" }}>{integer(p.acquisti)}</span>
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
