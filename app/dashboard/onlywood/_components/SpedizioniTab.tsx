"use client";

import { useMemo } from "react";
import type { StoreData } from "@/lib/onlywood-store";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from "recharts";
import {
  useDateRange, useTheme,
  eur, eur0, integer, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  tableStyles, useTableSort, SortTh,
} from "./shared";
import { StoreSection } from "./StoreSection";
import { kicker, kpiGrid, tooltipBox } from "./PanoramicaTab";
import { ACCENT, WOOD, CHART_PALETTE } from "../config";
import { nomeProvincia, nomeRegione } from "./province";

export function SpedizioniTab() {
  const { range } = useDateRange();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · tutto da WooCommerce, ordine per ordine`}>
        Spedizioni e resi
      </SectionTitle>
      <StoreSection height={420}>{(s) => <Contenuto store={s} />}</StoreSection>
    </div>
  );
}

function Contenuto({ store }: { store: StoreData }) {
  const { palette } = useTheme();
  const s = store.spedizioni;
  const parziale = store.ordini_campione < store.ordini_totali;

  const perRegione = useMemo(() => {
    const m = new Map<string, { nome: string; ordini: number; fatturato: number }>();
    for (const r of s.per_regione) {
      const reg = nomeRegione(r.nome);
      const cur = m.get(reg) ?? { nome: reg, ordini: 0, fatturato: 0 };
      cur.ordini += r.ordini;
      cur.fatturato += r.fatturato;
      m.set(reg, cur);
    }
    return [...m.values()].sort((a, b) => b.fatturato - a.fatturato);
  }, [s.per_regione]);

  const province = useMemo(
    () => s.per_regione.map((r) => ({ ...r, nome: nomeProvincia(r.nome) })).sort((a, b) => b.fatturato - a.fatturato),
    [s.per_regione],
  );

  const tassoResi = store.totals.ordini > 0 ? (store.resi.ordini / store.totals.ordini) * 100 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={kicker(palette.textDim)}>Quanto pesa la consegna</p>
        <div style={kpiGrid}>
          <KpiTile label="Ricavo da spedizione" accent={WOOD}
            value={eur0(s.ricavo)}
            sub={`${pctStr(s.incidenza_pct, 1)} del pagato`}
            info="Quanto hanno pagato i clienti per la consegna, tasse comprese. L'incidenza è sul totale degli ordini letti." />
          <KpiTile label="Media per ordine"
            value={eur(s.media_per_ordine)}
            info="Spesa media di spedizione per ordine con consegna a pagamento." />
          <KpiTile label="Ordini senza spesa"
            value={integer(s.ordini_senza_spesa)}
            sub={store.ordini_campione > 0 ? `${pctStr((s.ordini_senza_spesa / store.ordini_campione) * 100, 0)} degli ordini` : undefined}
            info="Ordini con spedizione gratuita o inclusa nel prezzo." />
          <KpiTile label="Ordini con reso"
            value={integer(store.resi.ordini)}
            sub={tassoResi != null ? `${pctStr(tassoResi, 1)} degli ordini · ${eur0(store.resi.totale)}` : undefined}
            info="Ordini su cui è stato registrato almeno un rimborso, parziale o totale." />
        </div>
      </div>

      {parziale && (
        <Card padding={14}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted }}>
            Spedizioni, metodi di pagamento e resi sono letti sui primi{" "}
            <strong style={{ color: palette.text }}>{integer(store.ordini_campione)}</strong> ordini del
            periodo su {integer(store.ordini_totali)}: le proporzioni sono affidabili, i totali assoluti
            vanno letti come riferimento.
          </p>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Metodi di consegna"
            right={<span style={{ fontSize: 11, color: palette.textDim }}>per ordini</span>} />
          <Breakdown righe={s.per_metodo.map((m) => ({ nome: m.nome, ordini: m.ordini, valore: m.fatturato }))}
            unit="spedizione incassata" color={WOOD} />
        </Card>

        <Card>
          <CardHeader title="Come pagano i clienti"
            right={<span style={{ fontSize: 11, color: palette.textDim }}>per ordini</span>} />
          <Breakdown righe={store.pagamenti.map((p) => ({ nome: p.nome, ordini: p.ordini, valore: p.fatturato }))}
            unit="valore ordini" color={ACCENT} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Dove si spedisce"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>valore degli ordini per regione</span>} />
        {perRegione.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: Math.max(200, perRegione.length * 30) }}>
            <ResponsiveContainer>
              <BarChart data={perRegione.slice(0, 14)} layout="vertical" margin={{ top: 4, right: 62, bottom: 4, left: 4 }}>
                <CartesianGrid stroke={palette.grid} horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => eur0(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nome" width={150} tick={{ fill: palette.axis, fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: palette.buttonHover }}
                  content={({ active, payload }) => {
                    const p = active && payload?.[0]?.payload as (typeof perRegione)[number] | undefined;
                    if (!p) return null;
                    return (
                      <div style={tooltipBox(palette)}>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>{p.nome}</div>
                        <div>{eur0(p.fatturato)} su {integer(p.ordini)} ordini</div>
                        <div style={{ color: palette.textDim }}>media {eur(p.fatturato / Math.max(1, p.ordini))} per ordine</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="fatturato" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
                  {perRegione.slice(0, 14).map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                  <LabelList dataKey="fatturato" position="right" formatter={(v: unknown) => eur0(Number(v))}
                    style={{ fill: palette.textMuted, fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <ProvinceTable righe={province} />

      {store.resi.elenco.length > 0 && <ResiTable resi={store.resi} />}
    </div>
  );
}

function Breakdown({ righe, unit, color }: {
  righe: { nome: string; ordini: number; valore: number }[]; unit: string; color: string;
}) {
  const { palette } = useTheme();
  if (righe.length === 0) return <EmptyState label="Nessun ordine letto nel periodo" />;
  const totOrdini = righe.reduce((s, r) => s + r.ordini, 0);
  const max = Math.max(...righe.map((r) => r.ordini));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {righe.slice(0, 8).map((r) => (
        <div key={r.nome}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: palette.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.nome}>
              {r.nome}
            </span>
            <span style={{ fontSize: 12, color: palette.textMuted, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {integer(r.ordini)} ordini · {totOrdini > 0 ? pctStr((r.ordini / totOrdini) * 100, 0) : "—"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: palette.buttonHover, overflow: "hidden" }}>
              <div style={{ width: `${(r.ordini / max) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, color: palette.textDim, whiteSpace: "nowrap" }} title={unit}>{eur0(r.valore)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProvinceTable({ righe }: { righe: { nome: string; ordini: number; fatturato: number }[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const { sorted, sort, toggle } = useTableSort(
    righe,
    (r, k) => {
      switch (k) {
        case "nome": return r.nome;
        case "ordini": return r.ordini;
        case "fatturato": return r.fatturato;
        case "medio": return r.ordini > 0 ? r.fatturato / r.ordini : null;
        default: return null;
      }
    },
    { key: "fatturato", dir: "desc" },
  );

  return (
    <Card>
      <CardHeader title="Province di consegna"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>indirizzo di spedizione dell&apos;ordine</span>} />
      {sorted.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label="Provincia" sortKey="nome" sort={sort} onSort={toggle} />
                <SortTh label="Ordini" sortKey="ordini" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Valore" sortKey="fatturato" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Ordine medio" sortKey="medio" sort={sort} onSort={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text }}>{r.nome}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.ordini)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.fatturato)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.ordini > 0 ? eur(r.fatturato / r.ordini) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ResiTable({ resi }: { resi: StoreData["resi"] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <Card>
      <CardHeader title="Rimborsi del periodo"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>{integer(resi.ordini)} ordini · {eur0(resi.totale)}</span>} />
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Ordine</th>
              <th style={ts.th}>Data</th>
              <th style={ts.th}>Motivo indicato</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Importo</th>
            </tr>
          </thead>
          <tbody>
            {resi.elenco.slice(0, 20).map((r) => (
              <tr key={`${r.ordine}-${r.data}`}>
                <td style={{ ...ts.tdBase, color: palette.text }}>#{r.ordine}</td>
                <td style={{ ...ts.tdBase }}>{fmtDate(r.data)}</td>
                <td style={{ ...ts.tdBase, maxWidth: 320 }}>
                  <span title={r.motivo} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.motivo || "—"}
                  </span>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur(r.totale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 10, color: palette.textFaint, lineHeight: 1.5 }}>
        Il motivo è quello scritto a mano in WooCommerce al momento del rimborso: quando manca, la riga
        resta senza spiegazione. Su {integer(resi.ordini)} ordini rimborsati l&apos;importo medio è{" "}
        {resi.ordini > 0 ? eur(resi.totale / resi.ordini) : "—"}.
      </p>
    </Card>
  );
}
