"use client";

import { useMemo, useState } from "react";
import {
  GondolinaData, useTheme,
  eur, eur0, integer, pctStr,
  Card, CardHeader, EmptyState, KpiTile, Pill, tableStyles,
  useTableSort, SortTh,
  GOLD, ACCENT, POSITIVE,
} from "./shared";
import { WorldMap, isoDaNome, paeseLabel, type MapRow } from "../../vitaedna/_components/WorldMap";

/**
 * Il paese non è nella serie giornaliera di nessuna piattaforma: Meta, GA4 e
 * Search Console lo mandano solo come classifica sugli ultimi 30 giorni. Questa
 * sezione quindi non segue il selettore date, e lo dice.
 */
const FINESTRA = "ultimi 30 giorni";

type Riga = {
  iso: string;
  nome: string;
  // Meta
  spesa: number; imp: number; click: number; atc: number; acquisti: number; valoreAcq: number;
  ctr: number; cpm: number; cpc: number; costoAtc: number;
  // GA4
  sess: number; utenti: number; trans: number; revenue: number;
  // Search Console
  clickOrganici: number; impOrganiche: number;
};

type Metrica = { key: keyof Riga; label: string; colore: string; format: (v: number) => string };

const METRICHE: Metrica[] = [
  { key: "spesa", label: "Spesa Meta", colore: ACCENT, format: (v) => eur0(v) },
  { key: "atc", label: "Carrelli Meta", colore: GOLD, format: (v) => integer(v) },
  { key: "sess", label: "Sessioni GA4", colore: "#4a7c7e", format: (v) => integer(v) },
  { key: "revenue", label: "Revenue GA4", colore: POSITIVE, format: (v) => eur0(v) },
  { key: "clickOrganici", label: "Click organici", colore: "#6366f1", format: (v) => integer(v) },
];

export function PaesiView({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const [metricaKey, setMetricaKey] = useState<string>("spesa");
  const metrica = METRICHE.find((m) => m.key === metricaKey) ?? METRICHE[0];

  const righe = useMemo(() => uniscePaesi(data), [data]);

  const tot = useMemo(() => righe.reduce((a, r) => ({
    spesa: a.spesa + r.spesa, imp: a.imp + r.imp, click: a.click + r.click,
    atc: a.atc + r.atc, sess: a.sess + r.sess, trans: a.trans + r.trans,
    revenue: a.revenue + r.revenue, clickOrganici: a.clickOrganici + r.clickOrganici,
  }), { spesa: 0, imp: 0, click: 0, atc: 0, sess: 0, trans: 0, revenue: 0, clickOrganici: 0 }), [righe]);

  const { sorted, sort, toggle } = useTableSort<Riga>(
    righe,
    (r, k) => (k === "nome" ? r.nome : (r[k as keyof Riga] as number)),
    { key: "spesa", dir: "desc" },
  );

  const mapRows: MapRow[] = useMemo(() => righe.map((r) => ({
    iso: r.iso,
    value: Number(r[metrica.key]) || 0,
    detail: [
      { label: "Spesa Meta", value: r.spesa > 0 ? eur(r.spesa) : "—" },
      { label: "Carrelli", value: r.atc > 0 ? integer(r.atc) : "—" },
      { label: "Sessioni GA4", value: r.sess > 0 ? integer(r.sess) : "—" },
      { label: "Revenue GA4", value: r.revenue > 0 ? eur(r.revenue) : "—" },
      { label: "Click organici", value: r.clickOrganici > 0 ? integer(r.clickOrganici) : "—" },
    ],
  })), [righe, metrica.key]);

  const paesiConSpesa = righe.filter((r) => r.spesa > 0).length;
  const primo = [...righe].sort((a, b) => b.spesa - a.spesa)[0];
  const concentrazione = tot.spesa > 0 && primo ? (primo.spesa / tot.spesa) * 100 : 0;

  if (righe.length === 0) {
    return (
      <Card>
        <CardHeader title="Paesi" />
        <EmptyState label="Nessun dato per paese nel payload" />
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Nota palette={palette} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <KpiTile label="Spesa Meta" value={eur0(tot.spesa)} sub={`${paesiConSpesa} paesi · ${FINESTRA}`} />
        <KpiTile label="Carrelli Meta" value={integer(tot.atc)} sub={tot.atc > 0 ? `${eur(tot.spesa / tot.atc)} per carrello` : "—"} />
        <KpiTile label="Concentrazione" value={pctStr(concentrazione, 0)} sub={primo ? `della spesa su ${primo.nome}` : "—"} />
        <KpiTile label="Sessioni GA4" value={integer(tot.sess)} sub={`${righe.filter((r) => r.sess > 0).length} paesi`} />
        <KpiTile label="Revenue GA4" value={eur0(tot.revenue)} sub={`${integer(tot.trans)} transazioni`} />
      </div>

      <Card>
        <CardHeader title={`Mappa · ${metrica.label} · ${FINESTRA}`} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {METRICHE.map((m) => (
            <Pill key={m.key} active={metricaKey === m.key} onClick={() => setMetricaKey(String(m.key))}>
              {m.label}
            </Pill>
          ))}
        </div>
        <WorldMap rows={mapRows} color={metrica.colore} format={metrica.format} altezza={400} />
      </Card>

      <Card>
        <CardHeader title={`Dettaglio per paese · ${FINESTRA}`} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...ts.table, minWidth: 1080 }}>
            <thead>
              <tr>
                <SortTh label="Paese" sortKey="nome" sort={sort} onSort={toggle} first="asc" />
                <SortTh label="Spesa" sortKey="spesa" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Imp." sortKey="imp" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Click" sortKey="click" sort={sort} onSort={toggle} align="right" />
                <SortTh label="CTR" sortKey="ctr" sort={sort} onSort={toggle} align="right" />
                <SortTh label="CPC" sortKey="cpc" sort={sort} onSort={toggle} align="right" />
                <SortTh label="CPM" sortKey="cpm" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Carrelli" sortKey="atc" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Costo/carr." sortKey="costoAtc" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Sessioni GA4" sortKey="sess" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Trans." sortKey="trans" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Revenue GA4" sortKey="revenue" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Click organici" sortKey="clickOrganici" sort={sort} onSort={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.iso || r.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {r.nome}
                    {r.iso && <span style={{ color: palette.textFaint, fontWeight: 400, marginLeft: 6, fontSize: 10 }}>{r.iso}</span>}
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{r.spesa > 0 ? eur(r.spesa) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.imp > 0 ? integer(r.imp) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.click > 0 ? integer(r.click) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.imp > 0 ? pctStr(r.ctr, 2) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.click > 0 ? eur(r.cpc) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.imp > 0 ? eur(r.cpm) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.atc > 0 ? GOLD : palette.textFaint, fontWeight: r.atc > 0 ? 700 : 400 }}>
                    {r.atc > 0 ? integer(r.atc) : "—"}
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.atc > 0 ? eur(r.costoAtc) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.sess > 0 ? integer(r.sess) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.trans > 0 ? 700 : 400 }}>{r.trans > 0 ? integer(r.trans) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.revenue > 0 ? POSITIVE : palette.textFaint }}>
                    {r.revenue > 0 ? eur(r.revenue) : "—"}
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, color: palette.textMuted }}>{r.clickOrganici > 0 ? integer(r.clickOrganici) : "—"}</td>
                </tr>
              ))}
              <tr style={{ borderTop: `1px solid ${palette.divider}` }}>
                <td style={{ ...ts.tdBase, color: palette.textDim, fontWeight: 700, fontSize: 11 }}>Totale</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}>{eur(tot.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(tot.imp)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(tot.click)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{tot.imp > 0 ? pctStr((tot.click / tot.imp) * 100, 2) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{tot.click > 0 ? eur(tot.spesa / tot.click) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{tot.imp > 0 ? eur((tot.spesa / tot.imp) * 1000) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}>{integer(tot.atc)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{tot.atc > 0 ? eur(tot.spesa / tot.atc) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(tot.sess)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}>{integer(tot.trans)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(tot.revenue)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(tot.clickOrganici)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Nota({ palette }: { palette: ReturnType<typeof useTheme>["palette"] }) {
  return (
    <div style={{
      background: palette.divider, border: `1px solid ${palette.cardBorder}`,
      borderRadius: 10, padding: "0.7rem 1rem", fontSize: 12, color: palette.textMuted, lineHeight: 1.6,
    }}>
      <strong style={{ color: palette.text }}>Finestra fissa di 30 giorni.</strong>{" "}
      Meta, GA4 e Search Console mandano il paese solo come classifica sugli ultimi 30 giorni,
      non giorno per giorno: questa sezione non segue il selettore date in alto.{" "}
      <strong style={{ color: palette.text }}>Google Ads non è nel conto:</strong>{" "}
      il motore oggi non legge il paese dalle campagne Google, quindi spesa, click e impression
      qui sotto sono solo Meta. Le sessioni e il fatturato GA4 invece comprendono tutto il traffico
      del paese, pagato e non.
    </div>
  );
}

function nomeIgnoto(grezzo: string): string {
  return /^(unknown|\(not set\)|zzz)$/i.test(grezzo.trim()) ? "Paese non rilevato" : grezzo;
}

/** Mette insieme Meta (ISO-2), GA4 (nome inglese) e Search Console (ISO-3) su una riga sola. */
function uniscePaesi(data: GondolinaData): Riga[] {
  const per = new Map<string, Riga>();

  function prendi(chiave: string, nomeGrezzo: string): Riga {
    const iso = isoDaNome(chiave);
    const id = iso || nomeGrezzo.toLowerCase();
    let r = per.get(id);
    if (!r) {
      r = {
        iso, nome: iso ? paeseLabel(iso) : nomeIgnoto(nomeGrezzo),
        spesa: 0, imp: 0, click: 0, atc: 0, acquisti: 0, valoreAcq: 0,
        ctr: 0, cpm: 0, cpc: 0, costoAtc: 0,
        sess: 0, utenti: 0, trans: 0, revenue: 0,
        clickOrganici: 0, impOrganiche: 0,
      };
      per.set(id, r);
    }
    return r;
  }

  // Meta: [paese, spesa, imp, click, ctr, cpm, atc, acquisti, valore acq, roas]
  for (const row of data.meta?.paesi_w30 ?? []) {
    const code = String(row[0] ?? "");
    if (!code) continue;
    const r = prendi(code, code);
    r.spesa += Number(row[1]) || 0;
    r.imp += Number(row[2]) || 0;
    r.click += Number(row[3]) || 0;
    r.atc += Number(row[6]) || 0;
    r.acquisti += Number(row[7]) || 0;
    r.valoreAcq += Number(row[8]) || 0;
  }

  // GA4: [nome, sessioni, utenti, nuovi, transazioni, revenue]
  for (const row of data.ga4?.geo?.paesi ?? []) {
    const nome = String(row[0] ?? "");
    if (!nome || nome === "(not set)") continue;
    const r = prendi(nome, nome);
    r.sess += Number(row[1]) || 0;
    r.utenti += Number(row[2]) || 0;
    r.trans += Number(row[4]) || 0;
    r.revenue += Number(row[5]) || 0;
  }

  // Search Console: [alpha-3, click, impression, ctr, posizione]
  for (const row of data.gsc?.paesi_w30 ?? []) {
    const code = String(row[0] ?? "");
    if (!code) continue;
    const r = prendi(code, code);
    r.clickOrganici += Number(row[1]) || 0;
    r.impOrganiche += Number(row[2]) || 0;
  }

  // I rapporti si calcolano a unione finita, altrimenti sommerebbero medie
  for (const r of per.values()) {
    r.ctr = r.imp > 0 ? (r.click / r.imp) * 100 : 0;
    r.cpc = r.click > 0 ? r.spesa / r.click : 0;
    r.cpm = r.imp > 0 ? (r.spesa / r.imp) * 1000 : 0;
    r.costoAtc = r.atc > 0 ? r.spesa / r.atc : 0;
  }

  // Meta chiude sempre con una riga "unknown": se è vuota non è un paese,
  // se un giorno portasse spesa va invece mostrata com'è.
  return Array.from(per.values())
    .filter((r) => r.spesa > 0 || r.imp > 0 || r.sess > 0 || r.clickOrganici > 0)
    .sort((a, b) => b.spesa - a.spesa || b.sess - a.sess);
}
