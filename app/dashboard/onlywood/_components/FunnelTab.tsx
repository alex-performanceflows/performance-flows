"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  OnlywoodData, useDateRange, useStore, useTheme,
  calcDelta, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  sumInRange, isRangeBeforeFirstData, useDailyMaps, buildSpark, useSparkProps,
  tableStyles, useTableSort, SortTh,
  type DateRange,
} from "./shared";
import { kicker, kpiGrid, tooltipBox } from "./PanoramicaTab";
import { ACCENT, WOOD, CHART_PALETTE } from "../config";

type FunnelTotals = { sessioni: number; viste: number; atc: number; checkout: number; acquisti: number; revenue: number };

function funnelInRange(data: OnlywoodData, range: DateRange): FunnelTotals {
  return {
    sessioni: sumInRange(data.ga4?.funnel_daily, range, 1),
    viste: sumInRange(data.ga4?.funnel_daily, range, 2),
    atc: sumInRange(data.ga4?.funnel_daily, range, 3),
    checkout: sumInRange(data.ga4?.funnel_daily, range, 4),
    acquisti: sumInRange(data.ga4?.funnel_daily, range, 5),
    revenue: sumInRange(data.ga4?.funnel_daily, range, 6),
  };
}

export function FunnelTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const { store } = useStore();

  const ga4First = data.health?.ga4_prima_data ?? data.ga4?.first_date;
  const rangeTooEarly = isRangeBeforeFirstData(range, ga4First);

  const f = useMemo(() => funnelInRange(data, range), [data, range]);
  const fPrev = useMemo(() => compareRange ? funnelInRange(data, compareRange) : null, [data, compareRange]);

  const ordiniWoo = store?.totals.ordini ?? null;
  const copertura = ordiniWoo && ordiniWoo > 0 ? (f.acquisti / ordiniWoo) * 100 : null;
  const coperturaPrev = store?.prev && store.prev.ordini > 0 && fPrev ? (fPrev.acquisti / store.prev.ordini) * 100 : null;

  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => ({
    sessioni: buildSpark(range, { num: [dm.sessions], from: dm.ga4First }),
    atcRate: buildSpark(range, { num: [dm.atc], den: [dm.sessions], scale: 100, from: dm.ga4First }),
    checkoutRate: buildSpark(range, { num: [dm.checkout], den: [dm.atc], scale: 100, from: dm.ga4First }),
    chiusura: buildSpark(range, { num: [dm.ga4Purch], den: [dm.checkout], scale: 100, from: dm.ga4First }),
  }), [dm, range]);

  // Passaggi del percorso, con l'ultimo gradino preso da WooCommerce.
  // Le schede viste restano fuori: contano pezzi, non visite, e non sono
  // confrontabili con i passaggi che le stanno intorno.
  const steps = useMemo(() => {
    const base: { label: string; value: number; fonte: string; nota?: string }[] = [
      { label: "Sessioni sul sito", value: f.sessioni, fonte: "Analytics" },
      { label: "Aggiunte al carrello", value: f.atc, fonte: "Analytics" },
      { label: "Checkout avviati", value: f.checkout, fonte: "Analytics" },
      { label: "Acquisti tracciati", value: f.acquisti, fonte: "Analytics" },
    ];
    if (ordiniWoo != null) {
      base.push({ label: "Ordini registrati", value: ordiniWoo, fonte: "WooCommerce", nota: "il dato di cassa" });
    }
    return base;
  }, [f, ordiniWoo]);

  // Dove si perde di più una volta che il carrello è pieno: prima di quel punto
  // il confronto è sempre schiacciato dal numero di visite
  const collo = useMemo(() => {
    const coppie: { da: string; a: string; tasso: number }[] = [];
    if (f.atc > 0) coppie.push({ da: "carrello", a: "checkout", tasso: f.checkout / f.atc });
    if (f.checkout > 0) coppie.push({ da: "checkout", a: "acquisto", tasso: f.acquisti / f.checkout });
    if (coppie.length === 0) return null;
    return coppie.reduce((min, c) => (c.tasso < min.tasso ? c : min));
  }, [f]);

  const grafico = useMemo(() => {
    const out: { data: string; atcRate: number | null; checkoutRate: number | null; acquistiRate: number | null; sessioni: number }[] = [];
    for (const r of data.ga4?.funnel_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const sess = Number(r[1]) || 0, atc = Number(r[3]) || 0, checkout = Number(r[4]) || 0, acq = Number(r[5]) || 0;
      out.push({
        data: d, sessioni: sess,
        atcRate: sess > 0 ? (atc / sess) * 100 : null,
        checkoutRate: atc > 0 ? (checkout / atc) * 100 : null,
        acquistiRate: checkout > 0 ? (acq / checkout) * 100 : null,
      });
    }
    return out.sort((a, b) => a.data.localeCompare(b.data));
  }, [data.ga4?.funnel_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · percorso da Google Analytics, ordini da WooCommerce`}>
        Percorso d&apos;acquisto
      </SectionTitle>

      {rangeTooEarly && ga4First && (
        <Card padding={14} style={{ borderColor: `${WOOD}55` }}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted }}>
            Google Analytics ha dati dal <strong>{fmtDate(ga4First)}</strong>: i passaggi del percorso
            partono da quella data anche se il periodo scelto inizia prima.
          </p>
        </Card>
      )}

      <div>
        <p style={kicker(palette.textDim)}>I passaggi chiave</p>
        <div style={kpiGrid}>
          <KpiTile label="Sessioni" value={integer(f.sessioni)}
            delta={calcDelta(f.sessioni, fPrev?.sessioni)}
            info="Visite al sito registrate da Analytics nel periodo."
            {...spark(sp.sessioni, integer)} />
          <KpiTile label="Sessione → carrello" accent={ACCENT}
            value={f.sessioni > 0 ? pctStr((f.atc / f.sessioni) * 100, 2) : "—"}
            delta={calcDelta(f.sessioni > 0 ? f.atc / f.sessioni : null, fPrev && fPrev.sessioni > 0 ? fPrev.atc / fPrev.sessioni : null)}
            sub={`${integer(f.atc)} aggiunte al carrello`}
            info="Quante visite arrivano a mettere qualcosa nel carrello."
            {...spark(sp.atcRate, (v) => pctStr(v, 1))} />
          <KpiTile label="Carrello → checkout"
            value={f.atc > 0 ? pctStr((f.checkout / f.atc) * 100, 1) : "—"}
            delta={calcDelta(f.atc > 0 ? f.checkout / f.atc : null, fPrev && fPrev.atc > 0 ? fPrev.checkout / fPrev.atc : null)}
            sub={`${integer(f.checkout)} checkout avviati`}
            info="Quanti carrelli proseguono verso la cassa."
            {...spark(sp.checkoutRate, (v) => pctStr(v, 1))} />
          <KpiTile label="Checkout → acquisto"
            value={f.checkout > 0 ? pctStr((f.acquisti / f.checkout) * 100, 1) : "—"}
            delta={calcDelta(f.checkout > 0 ? f.acquisti / f.checkout : null, fPrev && fPrev.checkout > 0 ? fPrev.acquisti / fPrev.checkout : null)}
            sub={`${integer(f.acquisti)} acquisti tracciati`}
            info="Quanti checkout avviati si chiudono con un acquisto tracciato da Analytics."
            {...spark(sp.chiusura, (v) => pctStr(v, 1))} />
        </div>
      </div>

      <Card>
        <CardHeader title="Il percorso, gradino per gradino"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>ogni barra è in scala sulle sessioni</span>} />
        <FunnelSteps steps={steps} />
        <p style={{ margin: "14px 0 0", fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
          {collo && (
            <>
              Una volta riempito il carrello, il passaggio più stretto del periodo è da{" "}
              <strong style={{ color: palette.text }}>{collo.da}</strong> a{" "}
              <strong style={{ color: palette.text }}>{collo.a}</strong>: passa il {pctStr(collo.tasso * 100, 1)}.{" "}
            </>
          )}
          {f.viste > 0 && (
            <>Nello stesso periodo Analytics ha registrato {integer(f.viste)} schede prodotto viste: è un
            conteggio di pezzi, non di visite, e per questo non compare come gradino del percorso.</>
          )}
        </p>
      </Card>

      <Card>
        <CardHeader title="Quanto vede Analytics degli ordini reali"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>confronto con WooCommerce</span>} />
        {ordiniWoo == null ? <EmptyState label="In attesa dei dati di WooCommerce" /> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 12 }}>
              <MiniStat label="Ordini WooCommerce" value={integer(ordiniWoo)} color={WOOD} />
              <MiniStat label="Acquisti in Analytics" value={integer(f.acquisti)} color={ACCENT} />
              <MiniStat label="Copertura" value={copertura != null ? pctStr(copertura, 0) : "—"}
                delta={calcDelta(copertura, coperturaPrev)} />
              <MiniStat label="Fatturato WooCommerce" value={eur0(store?.totals.fatturato_lordo ?? 0)} color={WOOD} />
            </div>
            <p style={{ margin: 0, fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
              Analytics vede {copertura != null ? pctStr(copertura, 0) : "—"}{" "}degli ordini registrati dal
              negozio: la differenza è quella fisiologica dovuta al consenso ai cookie, ai blocchi del
              browser e agli ordini che arrivano per telefono o email. Per questo tutti i numeri di
              fatturato in questa dashboard vengono da WooCommerce, mentre Analytics serve a leggere i
              passaggi che precedono l&apos;ordine — dove WooCommerce, per costruzione, non arriva.
            </p>
          </>
        )}
      </Card>

      <Card>
        <CardHeader title="Come si muovono i passaggi giorno per giorno"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>percentuali, scala unica</span>} />
        {grafico.length === 0 ? <EmptyState label="Nessun giorno con dati nel periodo" /> : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={grafico} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="data" tickFormatter={fmtDate} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof grafico)[number];
                    return (
                      <div style={tooltipBox(palette)}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDate(String(label))}</div>
                        <div>Sessione → carrello: <strong>{p.atcRate != null ? pctStr(p.atcRate, 1) : "—"}</strong></div>
                        <div>Carrello → checkout: <strong>{p.checkoutRate != null ? pctStr(p.checkoutRate, 1) : "—"}</strong></div>
                        <div>Checkout → acquisto: <strong>{p.acquistiRate != null ? pctStr(p.acquistiRate, 1) : "—"}</strong></div>
                        <div style={{ color: palette.textDim }}>{integer(p.sessioni)} sessioni</div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: palette.textMuted }} />
                <Line type="monotone" dataKey="atcRate" name="Sessione → carrello" stroke={ACCENT} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="checkoutRate" name="Carrello → checkout" stroke={WOOD} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="acquistiRate" name="Checkout → acquisto" stroke={CHART_PALETTE[2]} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 16 }}>
        <DispositiviCard data={data} />
        <LandingCard data={data} />
      </div>
    </div>
  );
}

function FunnelSteps({ steps }: { steps: { label: string; value: number; fonte: string; nota?: string }[] }) {
  const { palette } = useTheme();
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1] : null;
        const woo = s.fonte === "WooCommerce";
        // Lo scalino fra Analytics e WooCommerce non è un tasso: sono due fonti diverse
        const tasso = prev && prev.fonte === s.fonte && prev.value > 0 ? (s.value / prev.value) * 100 : null;
        return (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: palette.text, fontWeight: woo ? 700 : 500 }}>
                {s.label}
                <span style={{ marginLeft: 8, fontSize: 10, color: palette.textFaint, fontWeight: 500 }}>{s.fonte}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: palette.text, fontVariantNumeric: "tabular-nums" }}>
                {integer(s.value)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 12, borderRadius: 4, background: palette.buttonHover, overflow: "hidden" }}>
                <div style={{
                  width: `${(s.value / max) * 100}%`, height: "100%", borderRadius: 4,
                  background: woo ? WOOD : ACCENT, opacity: woo ? 1 : 1 - i * 0.12,
                }} />
              </div>
              <span style={{ fontSize: 11, color: palette.textDim, width: 96, textAlign: "right" }}>
                {tasso != null ? `${pctStr(tasso, 1)} del passo prima` : s.nota ?? ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value, color, delta }: { label: string; value: string; color?: string; delta?: ReturnType<typeof calcDelta> }) {
  const { palette } = useTheme();
  return (
    <div style={{ border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: "0.7rem 0.8rem" }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "5px 0 0", fontSize: 18, fontWeight: 700, color: color ?? palette.text, fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {delta && (
        <span style={{ fontSize: 11, fontWeight: 600, color: delta.color }}>{delta.arrow} {delta.label}</span>
      )}
    </div>
  );
}

function DispositiviCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const righe = (data.ga4?.devices ?? []).map((r) => ({
    nome: String(r[0] ?? ""),
    sessioni: Number(r[1]) || 0,
    utenti: Number(r[2]) || 0,
    acquisti: Number(r[3]) || 0,
  })).sort((a, b) => b.sessioni - a.sessioni);
  const tot = righe.reduce((s, r) => s + r.sessioni, 0);

  return (
    <Card>
      <CardHeader title="Da quale dispositivo si compra"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>} />
      {righe.length === 0 ? <EmptyState /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {righe.map((r, i) => (
            <div key={r.nome}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: palette.text, textTransform: "capitalize" }}>{r.nome}</span>
                <span style={{ color: palette.textMuted }}>
                  {integer(r.sessioni)} sess. · {integer(r.acquisti)} acq. ·{" "}
                  <strong style={{ color: palette.text }}>
                    {r.sessioni > 0 ? pctStr((r.acquisti / r.sessioni) * 100, 2) : "—"}
                  </strong>
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: palette.buttonHover, overflow: "hidden" }}>
                <div style={{ width: `${tot > 0 ? (r.sessioni / tot) * 100 : 0}%`, height: "100%", background: CHART_PALETTE[i % CHART_PALETTE.length], borderRadius: 4 }} />
              </div>
            </div>
          ))}
          <p style={{ margin: 0, fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
            L&apos;ultima colonna è il tasso di conversione del dispositivo secondo Analytics: nel legno da
            esterno lo scarto fra telefono e desktop è normale, perché l&apos;ordine grande spesso si chiude
            da computer dopo una prima occhiata da telefono.
          </p>
        </div>
      )}
    </Card>
  );
}

function LandingCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const righe = useMemo(() => (data.ga4?.landing_w30 ?? []).map((r) => ({
    pagina: String(r[0] ?? ""),
    sessioni: Number(r[1]) || 0,
    bounce: Number(r[2]) || 0,
    acquisti: Number(r[3]) || 0,
    revenue: Number(r[4]) || 0,
  })), [data.ga4?.landing_w30]);

  const { sorted, sort, toggle } = useTableSort(
    righe,
    (r, k) => {
      switch (k) {
        case "pagina": return r.pagina;
        case "sessioni": return r.sessioni;
        case "bounce": return r.bounce;
        case "acquisti": return r.acquisti;
        case "revenue": return r.revenue;
        default: return null;
      }
    },
    { key: "sessioni", dir: "desc" },
  );

  return (
    <Card>
      <CardHeader title="Pagine di ingresso"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>} />
      {sorted.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label="Pagina" sortKey="pagina" sort={sort} onSort={toggle} />
                <SortTh label="Sessioni" sortKey="sessioni" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Rimbalzo" sortKey="bounce" sort={sort} onSort={toggle} align="right" first="asc"
                  title="Quota di sessioni che si chiudono senza interazione" />
                <SortTh label="Acquisti" sortKey="acquisti" sort={sort} onSort={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 20).map((r) => (
                <tr key={r.pagina}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 240 }}>
                    <span title={r.pagina} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.pagina}</span>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.sessioni)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.bounce * 100, 0)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{num(r.acquisti, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
