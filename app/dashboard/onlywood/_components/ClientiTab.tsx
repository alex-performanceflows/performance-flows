"use client";

import { useMemo } from "react";
import type { StoreData } from "@/lib/onlywood-store";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from "recharts";
import {
  useDateRange, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate, fromISO,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  tableStyles,
} from "./shared";
import { StoreSection } from "./StoreSection";
import { kicker, kpiGrid, tooltipBox } from "./PanoramicaTab";
import { ACCENT, WOOD, CHART_PALETTE } from "../config";

const STATO_LABEL: Record<string, string> = {
  completed: "Completato", processing: "In lavorazione", "on-hold": "In attesa",
  pending: "In attesa di pagamento", cancelled: "Annullato", refunded: "Rimborsato",
  failed: "Non riuscito", "checkout-draft": "Carrello aperto",
};

const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export function ClientiTab() {
  const { range } = useDateRange();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · ordini e clienti letti da WooCommerce`}>
        Clienti e ordini
      </SectionTitle>
      <StoreSection height={420}>{(s) => <Contenuto store={s} />}</StoreSection>
    </div>
  );
}

function Contenuto({ store }: { store: StoreData }) {
  const { palette } = useTheme();
  const c = store.clienti;
  const letti = c.nuovi + c.ricorrenti;
  const quotaNuovi = letti > 0 ? (c.nuovi / letti) * 100 : null;

  const perGiorno = useMemo(() => {
    const acc = GIORNI.map((nome) => ({ nome, ordini: 0, fatturato: 0, giorni: 0 }));
    for (const g of store.giorni) {
      const idx = (fromISO(g.data).getDay() + 6) % 7;   // lunedì = 0
      acc[idx].ordini += g.ordini;
      acc[idx].fatturato += g.fatturato;
      acc[idx].giorni += 1;
    }
    return acc.map((a) => ({
      ...a,
      mediaOrdini: a.giorni > 0 ? a.ordini / a.giorni : 0,
      breve: a.nome.slice(0, 3),
    }));
  }, [store.giorni]);

  const miglior = useMemo(
    () => [...perGiorno].sort((a, b) => b.mediaOrdini - a.mediaOrdini)[0],
    [perGiorno],
  );

  const totStati = store.stati.reduce((s, x) => s + x.ordini, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={kicker(palette.textDim)}>Chi compra</p>
        <div style={kpiGrid}>
          <KpiTile label="Clienti del periodo" accent={WOOD}
            value={integer(store.totals.clienti)}
            delta={calcDelta(store.totals.clienti, store.prev?.clienti)}
            info="Clienti distinti che hanno ordinato nel periodo, secondo WooCommerce." />
          <KpiTile label="Primo acquisto"
            value={quotaNuovi != null ? pctStr(quotaNuovi, 0) : "—"}
            sub={`${integer(c.nuovi)} nuovi · ${integer(c.ricorrenti)} di ritorno`}
            info="Quota di ordini fatti da clienti che comprano per la prima volta. La lettura è sui primi 100 ordini del periodo restituiti dal report." />
          <KpiTile label="Ordini per cliente"
            value={num(c.ordini_per_cliente, 2)}
            info="Ordini divisi per clienti distinti: sopra 1 significa che qualcuno ha ordinato più volte nel periodo." />
          <KpiTile label="Scontrino medio"
            value={eur(store.totals.scontrino_medio)}
            delta={calcDelta(store.totals.scontrino_medio, store.prev?.scontrino_medio)}
            info="Valore medio dell'ordine nel periodo." />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 16 }}>
        <Card>
          <CardHeader title="Nuovi e di ritorno"
            right={<span style={{ fontSize: 11, color: palette.textDim }}>sugli ordini letti</span>} />
          {letti === 0 ? <EmptyState /> : (
            <>
              <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", border: `1px solid ${palette.cardBorder}` }}>
                <div style={{ width: `${(c.nuovi / letti) * 100}%`, background: ACCENT }} />
                <div style={{ width: `${(c.ricorrenti / letti) * 100}%`, background: WOOD }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: palette.textMuted }}>
                <span><span style={dot(ACCENT)} /> Primo acquisto: <strong style={{ color: palette.text }}>{integer(c.nuovi)}</strong></span>
                <span><span style={dot(WOOD)} /> Già clienti: <strong style={{ color: palette.text }}>{integer(c.ricorrenti)}</strong></span>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 11, color: palette.textDim, lineHeight: 1.55 }}>
                Su un catalogo di legno da esterno la quota di primi acquisti resta alta per natura: sono
                acquisti legati a un progetto, non a un consumo che si ripete. Il dato interessante è come
                si muove nel tempo, più che il valore assoluto.
              </p>
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Stato degli ordini"
            right={<span style={{ fontSize: 11, color: palette.textDim }}>al momento della lettura</span>} />
          {store.stati.length === 0 ? <EmptyState /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {store.stati.map((s, i) => (
                <div key={s.stato}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: palette.text }}>{STATO_LABEL[s.stato] ?? s.stato}</span>
                    <span style={{ color: palette.textMuted }}>
                      {integer(s.ordini)} · {totStati > 0 ? pctStr((s.ordini / totStati) * 100, 0) : "—"}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: palette.buttonHover, overflow: "hidden" }}>
                    <div style={{
                      width: `${totStati > 0 ? (s.ordini / totStati) * 100 : 0}%`, height: "100%",
                      background: s.stato === "refunded" || s.stato === "cancelled" || s.stato === "failed"
                        ? palette.negative : CHART_PALETTE[i % CHART_PALETTE.length],
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="In quali giorni si ordina"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>media ordini per giorno della settimana</span>} />
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={perGiorno} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="breve" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
              <YAxis tick={{ fill: palette.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                cursor={{ fill: palette.buttonHover }}
                content={({ active, payload }) => {
                  const p = active && payload?.[0]?.payload as (typeof perGiorno)[number] | undefined;
                  if (!p) return null;
                  return (
                    <div style={tooltipBox(palette)}>
                      <div style={{ fontWeight: 700, marginBottom: 3 }}>{p.nome}</div>
                      <div>Media: <strong>{num(p.mediaOrdini, 1)} ordini</strong></div>
                      <div style={{ color: palette.textDim }}>{integer(p.ordini)} ordini su {p.giorni} giornate · {eur0(p.fatturato)}</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="mediaOrdini" radius={[4, 4, 0, 0]} maxBarSize={46} isAnimationActive={false}>
                {perGiorno.map((g) => (
                  <Cell key={g.nome} fill={ACCENT} fillOpacity={miglior && g.nome === miglior.nome ? 1 : 0.55} />
                ))}
                <LabelList dataKey="mediaOrdini" position="top" formatter={(v: unknown) => num(Number(v), 1)}
                  style={{ fill: palette.textMuted, fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {miglior && miglior.mediaOrdini > 0 && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: palette.textMuted }}>
            Nel periodo il giorno più attivo è <strong style={{ color: palette.text }}>{miglior.nome}</strong>,
            con una media di {num(miglior.mediaOrdini, 1)} ordini.
          </p>
        )}
      </Card>

      <CouponCard coupon={store.coupon} totale={store.totals.coupon} />
    </div>
  );
}

function CouponCard({ coupon, totale }: { coupon: StoreData["coupon"]; totale: number }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <Card>
      <CardHeader title="Codici sconto usati"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>sconto totale {eur0(totale)}</span>} />
      {coupon.length === 0 ? (
        <EmptyState label="Nessun codice sconto usato nel periodo" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Codice</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Ordini</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Sconto concesso</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Sconto medio</th>
              </tr>
            </thead>
            <tbody>
              {coupon.map((c) => (
                <tr key={c.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 600 }}>{c.nome}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.ordini)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(c.fatturato)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.ordini > 0 ? eur(c.fatturato / c.ordini) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function dot(color: string): React.CSSProperties {
  return {
    display: "inline-block", width: 8, height: 8, borderRadius: "50%",
    background: color, marginRight: 6,
  };
}
