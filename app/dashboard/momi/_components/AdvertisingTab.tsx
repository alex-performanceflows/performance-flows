"use client";

import { Fragment, useMemo, useState } from "react";
import {
  MomiData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill, tableStyles,
  sumInRange, gadsSignupsInRange, COMPARE_LABEL,
  useDailyMaps, buildSpark, useSparkProps,
  useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle,
} from "./shared";
import { ACCENT, POSITIVE, NEGATIVE, isSignupAction } from "../config";

type SubTab = "meta" | "google";

export function AdvertisingTab({ data }: { data: MomiData }) {
  const [sub, setSub] = useState<SubTab>("meta");
  const { range, compareRange, compare } = useDateRange();

  const spesaMeta = sumInRange(data.meta?.campaigns_daily, range, 4);
  const spesaGads = sumInRange(data.gads_daily, range, 3);
  const spesaTot = spesaMeta + spesaGads;
  const regMeta = sumInRange(data.meta?.campaigns_daily, range, 8);
  const regGads = gadsSignupsInRange(data, range);
  const regAttr = regMeta + regGads;
  const cpr = regAttr > 0 ? spesaTot / regAttr : 0;

  const spesaMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 4) : null;
  const spesaGadsPrev = compareRange ? sumInRange(data.gads_daily, compareRange, 3) : null;
  const spesaTotPrev = spesaMetaPrev != null || spesaGadsPrev != null ? (spesaMetaPrev ?? 0) + (spesaGadsPrev ?? 0) : null;
  const regMetaPrev = compareRange ? sumInRange(data.meta?.campaigns_daily, compareRange, 8) : null;
  const regGadsPrev = compareRange ? gadsSignupsInRange(data, compareRange) : null;
  const regAttrPrev = regMetaPrev != null || regGadsPrev != null ? (regMetaPrev ?? 0) + (regGadsPrev ?? 0) : null;
  const cprPrev = regAttrPrev && regAttrPrev > 0 && spesaTotPrev != null ? spesaTotPrev / regAttrPrev : null;

  const metaShare = spesaTot > 0 ? (spesaMeta / spesaTot) * 100 : 0;

  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => {
    const spend = [dm.metaSpend, dm.gadsSpend];
    const reg = [dm.metaReg, dm.gadsReg];
    return {
      spesa: buildSpark(range, { num: spend }),
      quotaMeta: buildSpark(range, { num: [dm.metaSpend], den: spend, scale: 100 }),
      reg: buildSpark(range, { num: reg }),
      cpr: buildSpark(range, { num: spend, den: reg }),
    };
  }, [dm, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub={`${range.days} giorni (${fmtDate(range.start)} – ${fmtDate(range.end)}) · ${compareRange ? COMPARE_LABEL[compare] : "nessuna comparazione"}`}>
        Advertising
      </SectionTitle>

      {/* Blended */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <KpiTile label="Spesa totale" value={eur0(spesaTot)} delta={spesaTotPrev != null ? calcDelta(spesaTot, spesaTotPrev) : null}
          info={`Meta ${eur0(spesaMeta)} + Google ${eur0(spesaGads)}`} accent={ACCENT}
          {...spark(sp.spesa, eur0)} />
        <KpiTile label="Ripartizione Meta" value={pctStr(metaShare, 1)}
          info={`Meta ${eur0(spesaMeta)} · Google ${eur0(spesaGads)}`}
          {...spark(sp.quotaMeta, (v) => pctStr(v, 1))} />
        <KpiTile label="Registrazioni attribuite" value={integer(regAttr)} delta={regAttrPrev != null ? calcDelta(regAttr, regAttrPrev) : null}
          info={`Meta ${integer(regMeta)} + Google ${integer(regGads)}`}
          {...spark(sp.reg, integer)} />
        <KpiTile label="CPR blended" value={regAttr > 0 ? eur(cpr) : "—"} delta={cprPrev != null ? invertDeltaColor(calcDelta(cpr, cprPrev)) : null}
          info="Spesa totale ÷ registrazioni attribuite. Delta invertito." accent={ACCENT}
          {...spark(sp.cpr, eur)} />
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Pill active={sub === "meta"} onClick={() => setSub("meta")}>Meta</Pill>
        <Pill active={sub === "google"} onClick={() => setSub("google")}>Google Ads</Pill>
      </div>

      {sub === "meta" && <MetaView data={data} />}
      {sub === "google" && <GoogleView data={data} />}
    </div>
  );
}

// ═══ META ═════════════════════════════════════════════════════════

type MetaCampaign = { name: string; obiettivo: string; piattaforma: string; spesa: number; imp: number; click: number; install: number; reg: number; visite: number };

type Adset = {
  adset: string; campagna: string; stato: string;
  spesa: number; imp: number; reach: number; freq: number; ctr: number;
  install: number; reg: number; cpr: number;
};

function MetaView({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const ts = tableStyles(palette);

  const cards = useMemo(() => computeMetaObjCards(data, range, compareRange), [data, range, compareRange]);

  const campaigns = useMemo(() => {
    const byName = new Map<string, MetaCampaign>();
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const name = String(r[1]);
      const cur = byName.get(name) ?? { name, obiettivo: String(r[2]), piattaforma: String(r[3]), spesa: 0, imp: 0, click: 0, install: 0, reg: 0, visite: 0 };
      cur.spesa += Number(r[4]) || 0; cur.imp += Number(r[5]) || 0; cur.click += Number(r[6]) || 0;
      cur.install += Number(r[7]) || 0; cur.reg += Number(r[8]) || 0; cur.visite += Number(r[9]) || 0;
      byName.set(name, cur);
    }
    return [...byName.values()];
  }, [data.meta?.campaigns_daily, range]);

  const camp = useTableSort<MetaCampaign>(campaigns, (c, key) => {
    switch (key) {
      case "name": return c.name;
      case "obiettivo": return c.obiettivo;
      case "piattaforma": return c.piattaforma;
      case "spesa": return c.spesa;
      case "imp": return c.imp;
      case "click": return c.click;
      case "ctr": return ratio(c.click, c.imp, 100);
      case "install": return c.install;
      case "cpi": return ratio(c.spesa, c.install);
      case "reg": return c.reg;
      case "cpr": return ratio(c.spesa, c.reg);
      case "visite": return c.visite;
      default: return null;
    }
  }, { key: "spesa", dir: "desc" });

  const campAvg = useMemo(() => {
    const t = campaigns.reduce((a, c) => ({
      spesa: a.spesa + c.spesa, imp: a.imp + c.imp, click: a.click + c.click, install: a.install + c.install, reg: a.reg + c.reg,
    }), { spesa: 0, imp: 0, click: 0, install: 0, reg: 0 });
    return {
      spesa: mean(campaigns.map((c) => c.spesa)), imp: mean(campaigns.map((c) => c.imp)), click: mean(campaigns.map((c) => c.click)),
      ctr: ratio(t.click, t.imp, 100), install: mean(campaigns.map((c) => c.install)), cpi: ratio(t.spesa, t.install),
      reg: mean(campaigns.map((c) => c.reg)), cpr: ratio(t.spesa, t.reg), visite: mean(campaigns.map((c) => c.visite)),
    };
  }, [campaigns]);

  const adsets = useMemo<Adset[]>(() => (data.meta?.adsets_w30 ?? []).map((r) => ({
    adset: String(r[0]), campagna: String(r[1]), stato: String(r[4]),
    spesa: Number(r[5]) || 0, imp: Number(r[6]) || 0, reach: Number(r[7]) || 0, freq: Number(r[8]) || 0,
    ctr: Number(r[9]) || 0, install: Number(r[10]) || 0, reg: Number(r[11]) || 0, cpr: Number(r[12]) || 0,
  })), [data.meta?.adsets_w30]);

  const ads = useTableSort<Adset>(adsets, (a, key) => {
    switch (key) {
      case "adset": return a.adset;
      case "stato": return a.stato;
      case "spesa": return a.spesa;
      case "imp": return a.imp;
      case "freq": return a.freq;
      case "ctr": return a.ctr;
      case "install": return a.install;
      case "reg": return a.reg;
      case "cpr": return a.cpr > 0 ? a.cpr : null;
      default: return null;
    }
  }, { key: "spesa", dir: "desc" });

  // Gruppi per campagna nell'ordine delle righe ordinate
  const adsetGroups = useMemo(() => {
    const map = new Map<string, Adset[]>();
    for (const a of ads.sorted) {
      const arr = map.get(a.campagna) ?? [];
      arr.push(a); map.set(a.campagna, arr);
    }
    return [...map.entries()];
  }, [ads.sorted]);

  const adsetAvg = useMemo(() => {
    const t = adsets.reduce((acc, a) => ({
      spesa: acc.spesa + a.spesa, imp: acc.imp + a.imp, reach: acc.reach + a.reach,
      click: acc.click + (a.ctr * a.imp) / 100, reg: acc.reg + a.reg,
    }), { spesa: 0, imp: 0, reach: 0, click: 0, reg: 0 });
    return {
      spesa: mean(adsets.map((a) => a.spesa)), imp: mean(adsets.map((a) => a.imp)),
      freq: ratio(t.imp, t.reach), ctr: ratio(t.click, t.imp, 100),
      install: mean(adsets.map((a) => a.install)), reg: mean(adsets.map((a) => a.reg)), cpr: ratio(t.spesa, t.reg),
    };
  }, [adsets]);

  const alerts = useMemo(() => adsets.filter((a) => a.spesa >= 100 && a.freq >= 3.5).map((a) => a.adset), [adsets]);

  const campTh = { sort: camp.sort, onSort: camp.toggle };
  const adsTh = { sort: ads.sort, onSort: ads.toggle };
  const f = (v: number | null, fmt: (n: number) => string) => (v == null ? "—" : fmt(v));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {cards.map((c) => <ObiettivoCard key={c.key} c={c} />)}
      </div>

      <Card>
        <CardHeader title={`Campagne Meta · ${range.days}g`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <SortTh label="Campagna" sortKey="name" {...campTh} />
                <SortTh label="Obiettivo" sortKey="obiettivo" {...campTh} />
                <SortTh label="Piatt." sortKey="piattaforma" {...campTh} />
                <SortTh label="Spesa" sortKey="spesa" align="right" {...campTh} />
                <SortTh label="Imp." sortKey="imp" align="right" {...campTh} />
                <SortTh label="Click" sortKey="click" align="right" {...campTh} />
                <SortTh label="CTR" sortKey="ctr" align="right" {...campTh} />
                <SortTh label="Install" sortKey="install" align="right" {...campTh} />
                <SortTh label="CPI" sortKey="cpi" align="right" first="asc" {...campTh} />
                <SortTh label="Reg." sortKey="reg" align="right" {...campTh} />
                <SortTh label="CPR" sortKey="cpr" align="right" first="asc" {...campTh} />
                <SortTh label="Visite prof." sortKey="visite" align="right" {...campTh} />
              </tr></thead>
              <tbody>
                <tr style={avgRowStyle(palette)}>
                  <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700 }} title={AVG_TITLE}>
                    Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(campaigns.length)} campagne</span>
                  </td>
                  <td style={ts.tdBase} /><td style={ts.tdBase} />
                  <AvgTd ts={ts}>{f(campAvg.spesa, eur0)}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.imp, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.click, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.ctr, (v) => pctStr(v, 2))}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.install, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.cpi, eur)}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.reg, integer)}</AvgTd>
                  <AvgTd ts={ts} strong>{f(campAvg.cpr, eur)}</AvgTd>
                  <AvgTd ts={ts}>{f(campAvg.visite, integer)}</AvgTd>
                </tr>
                {camp.sorted.map((c) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  const cpi = c.install > 0 ? c.spesa / c.install : 0;
                  const cprC = c.reg > 0 ? c.spesa / c.reg : 0;
                  return (
                    <tr key={c.name}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={c.name}>{c.name}</td>
                      <td style={ts.tdBase}>{c.obiettivo}</td>
                      <td style={{ ...ts.tdBase, fontSize: 11 }}>{c.piattaforma}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.spesa)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.install)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.install > 0 ? eur(cpi) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.reg > 0 ? 600 : 400 }}>{integer(c.reg)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: cprC > 0 && cprC < 2 ? POSITIVE : cprC > 3.5 ? NEGATIVE : ts.tdBase.color, fontWeight: 600 }}>{c.reg > 0 ? eur(cprC) : "—"}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.visite)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Ad set (30 giorni fissi)"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>gli ad set non variano col range: sempre 30g</span>} />
        {adsets.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <SortTh label="Ad set" sortKey="adset" {...adsTh} />
                <SortTh label="Stato" sortKey="stato" {...adsTh} />
                <SortTh label="Spesa" sortKey="spesa" align="right" {...adsTh} />
                <SortTh label="Imp." sortKey="imp" align="right" {...adsTh} />
                <SortTh label="Freq" sortKey="freq" align="right" {...adsTh} />
                <SortTh label="CTR" sortKey="ctr" align="right" {...adsTh} />
                <SortTh label="Install" sortKey="install" align="right" {...adsTh} />
                <SortTh label="Reg." sortKey="reg" align="right" {...adsTh} />
                <SortTh label="CPR" sortKey="cpr" align="right" first="asc" {...adsTh} />
              </tr></thead>
              <tbody>
                <tr style={avgRowStyle(palette)}>
                  <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700 }} title={AVG_TITLE}>
                    Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(adsets.length)} ad set</span>
                  </td>
                  <td style={ts.tdBase} />
                  <AvgTd ts={ts}>{f(adsetAvg.spesa, eur0)}</AvgTd>
                  <AvgTd ts={ts}>{f(adsetAvg.imp, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(adsetAvg.freq, (v) => num(v, 2))}</AvgTd>
                  <AvgTd ts={ts}>{f(adsetAvg.ctr, (v) => pctStr(v, 2))}</AvgTd>
                  <AvgTd ts={ts}>{f(adsetAvg.install, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(adsetAvg.reg, integer)}</AvgTd>
                  <AvgTd ts={ts} strong>{f(adsetAvg.cpr, eur)}</AvgTd>
                </tr>
                {adsetGroups.map(([campagna, rows]) => (
                  <Fragment key={campagna}>
                    <tr style={{ background: palette.divider }}>
                      <td colSpan={9} style={{ ...ts.tdBase, fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{campagna}</td>
                    </tr>
                    {rows.map((a) => (
                      <tr key={campagna + a.adset}>
                        <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontSize: 12 }}>{a.adset}</td>
                        <td style={{ ...ts.tdBase, fontSize: 10 }}>
                          <span style={{ padding: "1px 7px", borderRadius: 20, background: a.stato === "ACTIVE" ? `${POSITIVE}25` : palette.divider, color: a.stato === "ACTIVE" ? POSITIVE : palette.textDim, fontWeight: 700 }}>{a.stato}</span>
                        </td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(a.spesa)}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(a.imp)}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight, color: a.freq >= 3.5 ? "#f59e0b" : ts.tdBase.color, fontWeight: a.freq >= 3.5 ? 600 : 400 }}>{num(a.freq, 2)}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(a.ctr, 2)}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(a.install)}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: a.reg > 0 ? 600 : 400 }}>{integer(a.reg)}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{a.cpr > 0 ? eur(a.cpr) : "—"}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {alerts.length > 0 && (
          <div style={{ marginTop: 12, padding: "0.7rem 0.9rem", background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.30)", borderRadius: 8, fontSize: 12, color: palette.textMuted, lineHeight: 1.45 }}>
            {alerts.map((a) => (
              <div key={a} style={{ marginBottom: 3 }}><strong style={{ color: "#f59e0b" }}>{a}:</strong> frequenza alta con spesa sostenuta — la saturazione è dell&apos;audience, non della creatività.</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AvgTd({ ts, strong, children }: { ts: ReturnType<typeof tableStyles>; strong?: boolean; children: React.ReactNode }) {
  return <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: strong ? 700 : 600, fontStyle: "italic" }}>{children}</td>;
}

type ObjCard = {
  key: string; label: string; spesa: number; risultato: number; risultatoLabel: string;
  costo: number; costoLabel: string; install: number; freq: number | null;
  delta: { spesa: number | null; risultato: number | null; costo: number | null };
};

function computeMetaObjCards(data: MomiData, range: { start: string; end: string }, compareRange: { start: string; end: string } | null): ObjCard[] {
  function agg(r: { start: string; end: string }) {
    const g: Record<string, { spesa: number; reg: number; install: number; vis: number }> = {
      "iOS":     { spesa: 0, reg: 0, install: 0, vis: 0 },
      "Android": { spesa: 0, reg: 0, install: 0, vis: 0 },
      "Fan":     { spesa: 0, reg: 0, install: 0, vis: 0 },
    };
    for (const row of data.meta?.campaigns_daily ?? []) {
      const d = String(row[0]); if (d < r.start || d > r.end) continue;
      const obiettivo = String(row[2]); const plat = String(row[3]);
      const k = obiettivo === "Fan Acquisition" ? "Fan" : plat === "iOS" ? "iOS" : plat === "Android" ? "Android" : null;
      if (!k) continue;
      g[k].spesa += Number(row[4]) || 0; g[k].install += Number(row[7]) || 0;
      g[k].reg += Number(row[8]) || 0; g[k].vis += Number(row[9]) || 0;
    }
    return g;
  }
  const cur = agg(range);
  const prev = compareRange ? agg(compareRange) : null;

  // Frequenza da meta.campaigns.w30 (dato fisso 30g): la più alta per obiettivo
  const freqByKey: Record<string, number> = {};
  for (const r of data.meta?.campaigns?.w30 ?? []) {
    const obiettivo = String(r[1]); const plat = String(r[2]);
    const k = obiettivo === "Fan Acquisition" ? "Fan" : plat === "iOS" ? "iOS" : plat === "Android" ? "Android" : null;
    if (!k) continue;
    const freq = Number(r[6]) || 0;
    if ((freqByKey[k] ?? 0) < freq) freqByKey[k] = freq;
  }

  function build(k: string, label: string): ObjCard {
    const c = cur[k]; const p = prev?.[k];
    const isFan = k === "Fan";
    const risultato = isFan ? c.vis : c.reg;
    const risultatoPrev = p ? (isFan ? p.vis : p.reg) : null;
    const costo = risultato > 0 ? c.spesa / risultato : 0;
    const costoPrev = risultatoPrev != null && risultatoPrev > 0 && p ? p.spesa / risultatoPrev : null;
    return {
      key: k, label,
      spesa: c.spesa, risultato,
      risultatoLabel: isFan ? "Visite profilo" : "Registrazioni",
      costo, costoLabel: isFan ? "CPV" : "CPR",
      install: c.install,
      freq: freqByKey[k] ?? null,
      delta: {
        spesa: p ? ((c.spesa - p.spesa) / (p.spesa || 1)) * 100 : null,
        risultato: risultatoPrev != null ? ((risultato - risultatoPrev) / (risultatoPrev || 1)) * 100 : null,
        costo: costoPrev != null ? ((costo - costoPrev) / (costoPrev || 1)) * 100 : null,
      },
    };
  }
  return [build("iOS", "App Install iOS"), build("Android", "App Install Android"), build("Fan", "Fan Acquisition")];
}

function ObiettivoCard({ c }: { c: ObjCard }) {
  const { palette } = useTheme();
  const dArrow = (d: number | null, inverted?: boolean) => {
    if (d == null) return { text: "—", color: palette.textDim };
    const isGood = inverted ? d < 0 : d > 0;
    return {
      text: `${d > 0 ? "+" : ""}${num(d, 1)}%`,
      color: Math.abs(d) < 1 ? palette.textDim : isGood ? POSITIVE : NEGATIVE,
    };
  };
  const dSpesa = dArrow(c.delta.spesa);
  const dRes = dArrow(c.delta.risultato);
  const dCosto = dArrow(c.delta.costo, true);
  return (
    <div style={{
      background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 14,
      padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: 8,
      borderLeft: `3px solid ${ACCENT}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.05em", textTransform: "uppercase" }}>{c.label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>Spesa</span>
        <span style={{ textAlign: "right", color: palette.text, fontWeight: 600 }}>{eur0(c.spesa)} <span style={{ fontSize: 10, color: dSpesa.color }}>{dSpesa.text}</span></span>
        <span style={{ color: palette.textDim }}>{c.risultatoLabel}</span>
        <span style={{ textAlign: "right", color: palette.text, fontWeight: 600 }}>{integer(c.risultato)} <span style={{ fontSize: 10, color: dRes.color }}>{dRes.text}</span></span>
        <span style={{ color: palette.textDim }}>{c.costoLabel}</span>
        <span style={{ textAlign: "right", color: palette.text, fontWeight: 600 }}>{c.risultato > 0 ? eur(c.costo) : "—"} <span style={{ fontSize: 10, color: dCosto.color }}>{dCosto.text}</span></span>
        <span style={{ color: palette.textDim }}>Install</span>
        <span style={{ textAlign: "right", color: palette.text }}>{integer(c.install)}</span>
        <span style={{ color: palette.textDim }}>Freq. max (w30)</span>
        <span style={{ textAlign: "right", color: c.freq != null && c.freq >= 3 ? "#f59e0b" : palette.text }}>{c.freq != null ? num(c.freq, 2) : "—"}</span>
      </div>
    </div>
  );
}

// ═══ GOOGLE ═══════════════════════════════════════════════════════

type GadsCampaign = { name: string; tipo: string; costo: number; imp: number; click: number; conv: number };
type GadsAction = { azione: string; categoria: string; conv: number; convTot: number };

function tipoBadgeLabel(tipo: string): string {
  if (tipo === "MULTI_CHANNEL") return "APP";
  return tipo;
}

function GoogleView({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  const campaigns = useMemo(() => {
    const byName = new Map<string, GadsCampaign>();
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const name = String(r[1]);
      const cur = byName.get(name) ?? { name, tipo: String(r[2]), costo: 0, imp: 0, click: 0, conv: 0 };
      cur.costo += Number(r[3]) || 0; cur.imp += Number(r[4]) || 0; cur.click += Number(r[5]) || 0; cur.conv += Number(r[6]) || 0;
      byName.set(name, cur);
    }
    return [...byName.values()];
  }, [data.gads_daily, range]);

  const conversioni = useMemo(() => {
    const byKey = new Map<string, GadsAction>();
    for (const r of data.gads_conv_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const az = String(r[2]); const cat = String(r[3]);
      const key = az + "|" + cat;
      const cur = byKey.get(key) ?? { azione: az, categoria: cat, conv: 0, convTot: 0 };
      cur.conv += Number(r[4]) || 0; cur.convTot += Number(r[5]) || 0;
      byKey.set(key, cur);
    }
    return [...byKey.values()];
  }, [data.gads_conv_daily, range]);

  const camp = useTableSort<GadsCampaign>(campaigns, (c, key) => {
    switch (key) {
      case "name": return c.name;
      case "tipo": return tipoBadgeLabel(c.tipo);
      case "costo": return c.costo;
      case "imp": return c.imp;
      case "click": return c.click;
      case "ctr": return ratio(c.click, c.imp, 100);
      case "conv": return c.conv;
      case "cpa": return ratio(c.costo, c.conv);
      default: return null;
    }
  }, { key: "costo", dir: "desc" });

  const conv = useTableSort<GadsAction>(conversioni, (c, key) => {
    switch (key) {
      case "azione": return c.azione;
      case "categoria": return c.categoria;
      case "conv": return c.conv;
      case "convTot": return c.convTot;
      default: return null;
    }
  }, { key: "convTot", dir: "desc" });

  const avg = useMemo(() => {
    const t = campaigns.reduce((a, c) => ({ costo: a.costo + c.costo, imp: a.imp + c.imp, click: a.click + c.click, conv: a.conv + c.conv }),
      { costo: 0, imp: 0, click: 0, conv: 0 });
    return {
      costo: mean(campaigns.map((c) => c.costo)), imp: mean(campaigns.map((c) => c.imp)), click: mean(campaigns.map((c) => c.click)),
      ctr: ratio(t.click, t.imp, 100), conv: mean(campaigns.map((c) => c.conv)), cpa: ratio(t.costo, t.conv),
    };
  }, [campaigns]);

  const campTh = { sort: camp.sort, onSort: camp.toggle };
  const convTh = { sort: conv.sort, onSort: conv.toggle };
  const f = (v: number | null, fmt: (n: number) => string) => (v == null ? "—" : fmt(v));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader title={`Campagne Google Ads · ${range.days}g`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <SortTh label="Campagna" sortKey="name" {...campTh} />
                <SortTh label="Tipo" sortKey="tipo" {...campTh} />
                <SortTh label="Costo" sortKey="costo" align="right" {...campTh} />
                <SortTh label="Imp." sortKey="imp" align="right" {...campTh} />
                <SortTh label="Click" sortKey="click" align="right" {...campTh} />
                <SortTh label="CTR" sortKey="ctr" align="right" {...campTh} />
                <SortTh label="Conv." sortKey="conv" align="right" {...campTh} />
                <SortTh label="Costo/Conv." sortKey="cpa" align="right" first="asc" {...campTh} />
              </tr></thead>
              <tbody>
                <tr style={avgRowStyle(palette)}>
                  <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700 }} title={AVG_TITLE}>
                    Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(campaigns.length)} campagne</span>
                  </td>
                  <td style={ts.tdBase} />
                  <AvgTd ts={ts}>{f(avg.costo, eur0)}</AvgTd>
                  <AvgTd ts={ts}>{f(avg.imp, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(avg.click, integer)}</AvgTd>
                  <AvgTd ts={ts}>{f(avg.ctr, (v) => pctStr(v, 2))}</AvgTd>
                  <AvgTd ts={ts}>{f(avg.conv, (v) => num(v, 2))}</AvgTd>
                  <AvgTd ts={ts} strong>{f(avg.cpa, eur)}</AvgTd>
                </tr>
                {camp.sorted.map((c) => {
                  const ctr = c.imp > 0 ? (c.click / c.imp) * 100 : 0;
                  return (
                    <tr key={c.name}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={c.name}>{c.name}</td>
                      <td style={ts.tdBase}>
                        <span style={{ padding: "1px 7px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>{tipoBadgeLabel(c.tipo)}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(c.costo)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.imp)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: c.conv > 0 ? 600 : 400 }}>{num(c.conv, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.conv > 0 ? eur(c.costo / c.conv) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Conversioni per azione · range corrente" />
        {conversioni.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <SortTh label="Azione" sortKey="azione" {...convTh} />
                <SortTh label="Categoria" sortKey="categoria" {...convTh} />
                <SortTh label="Conv." sortKey="conv" align="right" {...convTh} />
                <SortTh label="Conv. totali" sortKey="convTot" align="right" {...convTh} />
              </tr></thead>
              <tbody>
                {conv.sorted.map((c) => {
                  const isReg = isSignupAction(c.azione);
                  return (
                    <tr key={c.azione + "|" + c.categoria} style={{ background: isReg ? `${POSITIVE}12` : undefined }}>
                      <td style={{ ...ts.tdBase, color: isReg ? POSITIVE : palette.text, fontWeight: isReg ? 600 : 500 }}>{c.azione}</td>
                      <td style={ts.tdBase}>
                        <span style={{ padding: "1px 7px", borderRadius: 20, background: isReg ? `${POSITIVE}25` : palette.divider, color: isReg ? POSITIVE : palette.textDim, fontSize: 10, fontWeight: 700 }}>{c.categoria}</span>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(c.conv, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{integer(c.convTot)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
