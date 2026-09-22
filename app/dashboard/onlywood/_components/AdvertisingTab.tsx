"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  OnlywoodData, useDateRange, useStore, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill,
  sumInRange, groupInRange, gadsPurchasesInRange,
  tableStyles, useTableSort, SortTh, avgRowStyle, AVG_TITLE, ratio,
  useDailyMaps, buildSpark, useSparkProps,
} from "./shared";
import { kicker, kpiGrid, tooltipBox } from "./PanoramicaTab";
import { ACCENT, WOOD, AD_CFG } from "../config";

type MetaCamp = {
  nome: string; obiettivo: string; spesa: number; impression: number;
  click: number; atc: number; acquisti: number; valore: number;
};
type GadsCamp = {
  nome: string; tipo: string; costo: number; impression: number;
  click: number; conv: number; valore: number;
};

export function AdvertisingTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const { store } = useStore();

  // ─── Totali sul periodo ─────────────────────────────────────────
  const spesaMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 3), [data.meta?.campaigns_daily, range]);
  const spesaGads = useMemo(() => sumInRange(data.gads_daily, range, 3), [data.gads_daily, range]);
  const spesaTot = spesaMeta + spesaGads;
  const spesaTotPrev = useMemo(() => compareRange
    ? sumInRange(data.meta?.campaigns_daily, compareRange, 3) + sumInRange(data.gads_daily, compareRange, 3)
    : null, [data.meta?.campaigns_daily, data.gads_daily, compareRange]);

  const acqMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 7), [data.meta?.campaigns_daily, range]);
  const valMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 8), [data.meta?.campaigns_daily, range]);
  const gads = useMemo(() => gadsPurchasesInRange(data, range), [data, range]);
  const acqPrev = useMemo(() => {
    if (!compareRange) return null;
    return sumInRange(data.meta?.campaigns_daily, compareRange, 7) + gadsPurchasesInRange(data, compareRange).conv;
  }, [data, compareRange]);

  const acqTot = acqMeta + gads.conv;
  const valTot = valMeta + gads.valore;
  const roasAttr = spesaTot > 0 ? valTot / spesaTot : null;
  const cpaBlended = acqTot > 0 ? spesaTot / acqTot : null;
  const mer = store && spesaTot > 0 ? store.totals.fatturato_lordo / spesaTot : null;

  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => {
    const spesa = [dm.metaSpend, dm.gadsSpend];
    const acquisti = [dm.metaPurch, dm.gadsPurch];
    const valore = [dm.metaValue, dm.gadsValue];
    return {
      spesa: buildSpark(range, { num: spesa }),
      acquisti: buildSpark(range, { num: acquisti }),
      roas: buildSpark(range, { num: valore, den: spesa }),
      cpa: buildSpark(range, { num: spesa, den: acquisti }),
    };
  }, [dm, range]);

  // ─── Spesa giornaliera per piattaforma ──────────────────────────
  const grafico = useMemo(() => {
    const m = new Map<string, { data: string; meta: number; google: number }>();
    const get = (d: string) => {
      const cur = m.get(d) ?? { data: d, meta: 0, google: 0 };
      m.set(d, cur); return cur;
    };
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      get(d).meta += Number(r[3]) || 0;
    }
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      get(d).google += Number(r[3]) || 0;
    }
    return [...m.values()].sort((a, b) => a.data.localeCompare(b.data));
  }, [data.meta?.campaigns_daily, data.gads_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · Meta Ads e Google Ads`}>
        Advertising
      </SectionTitle>

      <div>
        <p style={kicker(palette.textDim)}>Il quadro d&apos;insieme</p>
        <div style={kpiGrid}>
          <KpiTile label="Spesa totale" value={eur0(spesaTot)}
            delta={calcDelta(spesaTot, spesaTotPrev)}
            sub={`Meta ${pctStr(spesaTot > 0 ? (spesaMeta / spesaTot) * 100 : 0, 0)} · Google ${pctStr(spesaTot > 0 ? (spesaGads / spesaTot) * 100 : 0, 0)}`}
            info="Somma della spesa delle due piattaforme nel periodo."
            {...spark(sp.spesa, eur0)} />
          <KpiTile label="Acquisti attribuiti" value={num(acqTot, 0)}
            delta={calcDelta(acqTot, acqPrev)}
            sub={`Meta ${integer(acqMeta)} · Google ${num(gads.conv, 1)}`}
            info="Acquisti che le due piattaforme si attribuiscono. Le finestre di attribuzione si sovrappongono, quindi la somma può superare gli ordini reali."
            {...spark(sp.acquisti, (v) => num(v, 1))} />
          <KpiTile label="ROAS dichiarato" accent={ACCENT}
            value={roasAttr != null ? num(roasAttr, 2) : "—"}
            sub={`${eur0(valTot)} di valore attribuito`}
            info={`Valore degli acquisti attribuiti diviso per la spesa. Sopra ${num(AD_CFG.ROAS_SCALA, 1)} le creatività vengono considerate da spingere; è comunque una misura di piattaforma, non di cassa.`}
            {...spark(sp.roas, (v) => num(v, 1))} />
          <KpiTile label="MER" accent={WOOD}
            value={mer != null ? num(mer, 2) : "…"}
            sub="fatturato negozio su spesa"
            info="Rapporto fra il fatturato registrato da WooCommerce e tutta la spesa pubblicitaria: non dipende dall'attribuzione e non conta due volte lo stesso ordine." />
        </div>
      </div>

      <Card>
        <CardHeader title="Come si divide la spesa, giorno per giorno"
          right={
            <span style={{ fontSize: 11, color: palette.textDim }}>
              {cpaBlended != null ? `costo medio per acquisto attribuito ${eur(cpaBlended)}` : ""}
            </span>
          } />
        {grafico.length === 0 ? <EmptyState label="Nessuna spesa nel periodo" /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={grafico} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="data" tickFormatter={fmtDate} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => eur0(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={false} tickLine={false} width={58} />
                <Tooltip
                  cursor={{ fill: palette.buttonHover }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof grafico)[number];
                    return (
                      <div style={tooltipBox(palette)}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDate(String(label))}</div>
                        <div>Meta: <strong>{eur0(p.meta)}</strong></div>
                        <div>Google: <strong>{eur0(p.google)}</strong></div>
                        <div style={{ color: palette.textDim }}>totale {eur0(p.meta + p.google)}</div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} />
                <Bar dataKey="meta" name="Meta Ads" stackId="s" fill={ACCENT} maxBarSize={24} isAnimationActive={false} />
                <Bar dataKey="google" name="Google Ads" stackId="s" fill={WOOD} radius={[3, 3, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <MetaBlocco data={data} />
      <GoogleBlocco data={data} />

      <Card padding={16}>
        <p style={{ margin: 0, fontSize: 12, color: palette.textMuted, lineHeight: 1.65 }}>
          <strong style={{ color: palette.text }}>Come leggere questi numeri.</strong> Meta e Google contano
          un acquisto ciascuno quando entrambi hanno toccato lo stesso cliente, e lo attribuiscono al giorno
          del clic, non a quello dell&apos;ordine. Sommati, i loro acquisti possono superare gli ordini veri.
          Per capire quanto rende l&apos;investimento nel suo insieme il riferimento è il MER, che mette il
          fatturato di WooCommerce sopra tutta la spesa; il ROAS di piattaforma serve invece a confrontare
          campagne e creatività fra loro.
        </p>
      </Card>
    </div>
  );
}

// ─── Meta ───────────────────────────────────────────────────────

function MetaBlocco({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);
  const [vista, setVista] = useState<"campagne" | "obiettivi">("campagne");

  const campagne: MetaCamp[] = useMemo(() => {
    const rows = groupInRange(data.meta?.campaigns_daily, range, 1, [3, 4, 5, 6, 7, 8]);
    const obiettivoDi = new Map<string, string>();
    for (const r of data.meta?.campaigns_daily ?? []) obiettivoDi.set(String(r[1]), String(r[2]));
    return rows.map(({ key, values }) => ({
      nome: key, obiettivo: obiettivoDi.get(key) ?? "Altro",
      spesa: values[0], impression: values[1], click: values[2],
      atc: values[3], acquisti: values[4], valore: values[5],
    })).filter((c) => c.spesa > 0);
  }, [data.meta?.campaigns_daily, range]);

  const obiettivi: MetaCamp[] = useMemo(() => {
    const rows = groupInRange(data.meta?.campaigns_daily, range, 2, [3, 4, 5, 6, 7, 8]);
    return rows.map(({ key, values }) => ({
      nome: key, obiettivo: key,
      spesa: values[0], impression: values[1], click: values[2],
      atc: values[3], acquisti: values[4], valore: values[5],
    })).filter((c) => c.spesa > 0);
  }, [data.meta?.campaigns_daily, range]);

  const righe = vista === "campagne" ? campagne : obiettivi;

  const { sorted, sort, toggle } = useTableSort<MetaCamp>(
    righe,
    (c, k) => {
      switch (k) {
        case "nome": return c.nome;
        case "obiettivo": return c.obiettivo;
        case "spesa": return c.spesa;
        case "ctr": return c.impression > 0 ? (c.click / c.impression) * 100 : null;
        case "atc": return c.atc;
        case "costoAtc": return c.atc > 0 ? c.spesa / c.atc : null;
        case "acquisti": return c.acquisti;
        case "roas": return c.spesa > 0 && c.valore > 0 ? c.valore / c.spesa : null;
        case "cpa": return c.acquisti > 0 ? c.spesa / c.acquisti : null;
        default: return null;
      }
    },
    { key: "spesa", dir: "desc" },
  );

  const tot = {
    spesa: sorted.reduce((s, c) => s + c.spesa, 0),
    impression: sorted.reduce((s, c) => s + c.impression, 0),
    click: sorted.reduce((s, c) => s + c.click, 0),
    atc: sorted.reduce((s, c) => s + c.atc, 0),
    acquisti: sorted.reduce((s, c) => s + c.acquisti, 0),
    valore: sorted.reduce((s, c) => s + c.valore, 0),
  };

  return (
    <Card>
      <CardHeader
        title="Meta Ads"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <Pill active={vista === "campagne"} onClick={() => setVista("campagne")}>Per campagna</Pill>
            <Pill active={vista === "obiettivi"} onClick={() => setVista("obiettivi")}>Per obiettivo</Pill>
          </div>
        }
      />
      {sorted.length === 0 ? <EmptyState label="Nessuna spesa Meta nel periodo" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label={vista === "campagne" ? "Campagna" : "Obiettivo"} sortKey="nome" sort={sort} onSort={toggle} />
                {vista === "campagne" && <SortTh label="Obiettivo" sortKey="obiettivo" sort={sort} onSort={toggle} />}
                <SortTh label="Spesa" sortKey="spesa" sort={sort} onSort={toggle} align="right" />
                <SortTh label="CTR" sortKey="ctr" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Carrelli" sortKey="atc" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Costo/carrello" sortKey="costoAtc" sort={sort} onSort={toggle} align="right" first="asc" />
                <SortTh label="Acquisti" sortKey="acquisti" sort={sort} onSort={toggle} align="right" />
                <SortTh label="ROAS" sortKey="roas" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Costo/acquisto" sortKey="cpa" sort={sort} onSort={toggle} align="right" first="asc" />
              </tr>
            </thead>
            <tbody>
              <tr style={avgRowStyle(palette)} title={AVG_TITLE}>
                <td style={{ ...ts.tdBase, fontWeight: 700, fontStyle: "italic", color: palette.text }}>Totale</td>
                {vista === "campagne" && <td style={ts.tdBase} />}
                <Td strong>{eur0(tot.spesa)}</Td>
                <Td>{ratio(tot.click, tot.impression, 100) != null ? pctStr(ratio(tot.click, tot.impression, 100)!, 2) : "—"}</Td>
                <Td>{integer(tot.atc)}</Td>
                <Td>{tot.atc > 0 ? eur(tot.spesa / tot.atc) : "—"}</Td>
                <Td>{integer(tot.acquisti)}</Td>
                <Td strong>{tot.spesa > 0 && tot.valore > 0 ? num(tot.valore / tot.spesa, 2) : "—"}</Td>
                <Td>{tot.acquisti > 0 ? eur(tot.spesa / tot.acquisti) : "—"}</Td>
              </tr>
              {sorted.map((c) => {
                const roas = c.spesa > 0 && c.valore > 0 ? c.valore / c.spesa : null;
                return (
                  <tr key={c.nome}>
                    <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 300 }}>
                      <span title={c.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                    </td>
                    {vista === "campagne" && (
                      <td style={{ ...ts.tdBase, fontSize: 11 }}>{c.obiettivo}</td>
                    )}
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(c.spesa)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.impression > 0 ? pctStr((c.click / c.impression) * 100, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.atc)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.atc > 0 ? eur(c.spesa / c.atc) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.acquisti)}</td>
                    <td style={{
                      ...ts.tdBase, ...ts.tdRight, fontWeight: 700,
                      color: roas == null ? palette.textDim : roas >= AD_CFG.ROAS_SCALA ? palette.positive : roas < AD_CFG.ROAS_SPEGNI ? palette.negative : palette.text,
                    }}>{roas != null ? num(roas, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.acquisti > 0 ? eur(c.spesa / c.acquisti) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16, marginTop: 18 }}>
        <BreakCard titolo="Pubblici Meta" righe={data.meta?.adsets_w30} nomeIdx={0} spesaIdx={2} acquistiIdx={10} roasIdx={11} />
        <BreakCard titolo="Dove compaiono gli annunci" righe={data.meta?.placement_w30} nomeIdx={0} spesaIdx={1} acquistiIdx={7} roasIdx={9} />
      </div>
    </Card>
  );
}

function BreakCard({ titolo, righe, nomeIdx, spesaIdx, acquistiIdx, roasIdx }: {
  titolo: string; righe: (string | number)[][] | undefined;
  nomeIdx: number; spesaIdx: number; acquistiIdx: number; roasIdx: number;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const dati = (righe ?? []).map((r) => ({
    nome: String(r[nomeIdx] ?? ""),
    spesa: Number(r[spesaIdx]) || 0,
    acquisti: Number(r[acquistiIdx]) || 0,
    roas: Number(r[roasIdx]) || 0,
  })).filter((r) => r.spesa > 0).sort((a, b) => b.spesa - a.spesa).slice(0, 8);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: palette.text }}>{titolo}</h4>
        <span style={{ fontSize: 10, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>
      </div>
      {dati.length === 0 ? <EmptyState label="Nessun dato" /> : (
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Nome</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Acq.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {dati.map((r, i) => (
              <tr key={`${r.nome}-${i}`}>
                <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 180 }}>
                  <span title={r.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "capitalize" }}>{r.nome}</span>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur0(r.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.acquisti)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{r.roas > 0 ? num(r.roas, 2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Google ─────────────────────────────────────────────────────

function GoogleBlocco({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const ts = tableStyles(palette);

  const campagne: GadsCamp[] = useMemo(() => {
    const rows = groupInRange(data.gads_daily, range, 1, [3, 4, 5, 6, 7]);
    const tipoDi = new Map<string, string>();
    for (const r of data.gads_daily ?? []) tipoDi.set(String(r[1]), String(r[2]));
    return rows.map(({ key, values }) => ({
      nome: key, tipo: tipoDi.get(key) ?? "",
      costo: values[0], impression: values[1], click: values[2],
      conv: values[3], valore: values[4],
    })).filter((c) => c.costo > 0);
  }, [data.gads_daily, range]);

  const { sorted, sort, toggle } = useTableSort<GadsCamp>(
    campagne,
    (c, k) => {
      switch (k) {
        case "nome": return c.nome;
        case "tipo": return c.tipo;
        case "costo": return c.costo;
        case "click": return c.click;
        case "ctr": return c.impression > 0 ? (c.click / c.impression) * 100 : null;
        case "conv": return c.conv;
        case "cpa": return c.conv > 0 ? c.costo / c.conv : null;
        case "roas": return c.costo > 0 && c.valore > 0 ? c.valore / c.costo : null;
        default: return null;
      }
    },
    { key: "costo", dir: "desc" },
  );

  const tot = {
    costo: sorted.reduce((s, c) => s + c.costo, 0),
    click: sorted.reduce((s, c) => s + c.click, 0),
    impression: sorted.reduce((s, c) => s + c.impression, 0),
    conv: sorted.reduce((s, c) => s + c.conv, 0),
    valore: sorted.reduce((s, c) => s + c.valore, 0),
  };

  return (
    <Card>
      <CardHeader title="Google Ads"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>conversioni dichiarate da Google</span>} />
      {sorted.length === 0 ? <EmptyState label="Nessuna spesa Google nel periodo" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label="Campagna" sortKey="nome" sort={sort} onSort={toggle} />
                <SortTh label="Tipo" sortKey="tipo" sort={sort} onSort={toggle} />
                <SortTh label="Costo" sortKey="costo" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Click" sortKey="click" sort={sort} onSort={toggle} align="right" />
                <SortTh label="CTR" sortKey="ctr" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Conversioni" sortKey="conv" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Costo/conv." sortKey="cpa" sort={sort} onSort={toggle} align="right" first="asc" />
                <SortTh label="ROAS" sortKey="roas" sort={sort} onSort={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              <tr style={avgRowStyle(palette)} title={AVG_TITLE}>
                <td style={{ ...ts.tdBase, fontWeight: 700, fontStyle: "italic", color: palette.text }}>Totale</td>
                <td style={ts.tdBase} />
                <Td strong>{eur0(tot.costo)}</Td>
                <Td>{integer(tot.click)}</Td>
                <Td>{ratio(tot.click, tot.impression, 100) != null ? pctStr(ratio(tot.click, tot.impression, 100)!, 2) : "—"}</Td>
                <Td>{num(tot.conv, 1)}</Td>
                <Td>{tot.conv > 0 ? eur(tot.costo / tot.conv) : "—"}</Td>
                <Td strong>{tot.costo > 0 && tot.valore > 0 ? num(tot.valore / tot.costo, 2) : "—"}</Td>
              </tr>
              {sorted.map((c) => {
                const roas = c.costo > 0 && c.valore > 0 ? c.valore / c.costo : null;
                return (
                  <tr key={c.nome}>
                    <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 280 }}>
                      <span title={c.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                    </td>
                    <td style={{ ...ts.tdBase, fontSize: 10, color: palette.textDim }}>{c.tipo}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(c.costo)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.click)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.impression > 0 ? pctStr((c.click / c.impression) * 100, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(c.conv, 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.conv > 0 ? eur(c.costo / c.conv) : "—"}</td>
                    <td style={{
                      ...ts.tdBase, ...ts.tdRight, fontWeight: 700,
                      color: roas == null ? palette.textDim : roas >= AD_CFG.ROAS_SCALA ? palette.positive : roas < AD_CFG.ROAS_SPEGNI ? palette.negative : palette.text,
                    }}>{roas != null ? num(roas, 2) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TerminiCard data={data} />
    </Card>
  );
}

function TerminiCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const righe = useMemo(() => {
    const m = new Map<string, { termine: string; campagna: string; click: number; costo: number; conv: number }>();
    for (const r of data.gads_search_terms_w30 ?? []) {
      const t = String(r[1] ?? "");
      const cur = m.get(t) ?? { termine: t, campagna: String(r[2] ?? ""), click: 0, costo: 0, conv: 0 };
      cur.click += Number(r[4]) || 0;
      cur.costo += Number(r[5]) || 0;
      cur.conv += Number(r[6]) || 0;
      m.set(t, cur);
    }
    return [...m.values()].sort((a, b) => b.costo - a.costo);
  }, [data.gads_search_terms_w30]);

  const { sorted, sort, toggle } = useTableSort(
    righe,
    (r, k) => {
      switch (k) {
        case "termine": return r.termine;
        case "campagna": return r.campagna;
        case "click": return r.click;
        case "costo": return r.costo;
        case "conv": return r.conv;
        case "cpa": return r.conv > 0 ? r.costo / r.conv : null;
        default: return null;
      }
    },
    { key: "costo", dir: "desc" },
  );

  const senzaConv = righe.filter((r) => r.conv === 0);
  const spesaSenza = senzaConv.reduce((s, r) => s + r.costo, 0);
  const spesaTot = righe.reduce((s, r) => s + r.costo, 0);

  if (righe.length === 0) return null;

  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: palette.text }}>Cosa cerca chi clicca</h4>
        <span style={{ fontSize: 10, color: palette.textDim }}>ultimi 30 giorni, finestra fissa · primi 500 termini per costo</span>
      </div>
      {spesaTot > 0 && (
        <p style={{ margin: "0 0 10px", fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
          {eur0(spesaSenza)} su {eur0(spesaTot)} ({pctStr((spesaSenza / spesaTot) * 100, 0)}) sono andati su
          ricerche che in questa finestra non hanno portato conversioni. Una quota fisiologica c&apos;è sempre,
          perché molte ricerche generiche servono a farsi trovare prima dell&apos;acquisto.
        </p>
      )}
      <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <SortTh label="Ricerca" sortKey="termine" sort={sort} onSort={toggle} />
              <SortTh label="Campagna" sortKey="campagna" sort={sort} onSort={toggle} />
              <SortTh label="Click" sortKey="click" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Costo" sortKey="costo" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Conv." sortKey="conv" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Costo/conv." sortKey="cpa" sort={sort} onSort={toggle} align="right" first="asc" />
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 40).map((r) => (
              <tr key={r.termine}>
                <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 280 }}>
                  <span title={r.termine} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.termine}</span>
                </td>
                <td style={{ ...ts.tdBase, fontSize: 10, color: palette.textDim, maxWidth: 200 }}>
                  <span title={r.campagna} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.campagna}</span>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.click)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.costo)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.conv === 0 ? palette.textDim : palette.textMuted }}>{num(r.conv, 1)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.conv > 0 ? eur(r.costo / r.conv) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Td({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: strong ? 700 : 600, fontStyle: "italic" }}>{children}</td>;
}
