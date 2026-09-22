"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, Line, Bar,
} from "recharts";
import {
  OnlywoodData, useDateRange, useNav, useStore, useTheme,
  calcDelta, eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  sumInRange, gadsPurchasesInRange, isRangeBeforeFirstData,
  useDailyMaps, buildSpark, useSparkProps, storeDayMap,
  type DayMap,
} from "./shared";
import { StoreSection } from "./StoreSection";
import { ACCENT, WOOD, CHART_PALETTE } from "../config";

export function PanoramicaTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const { setTab } = useNav();
  const { store } = useStore();

  const ga4First = data.health?.ga4_prima_data ?? data.ga4?.first_date;
  const rangeTooEarly = isRangeBeforeFirstData(range, ga4First);

  // ─── Spesa pubblicitaria sul periodo ────────────────────────────
  const spesaMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 3), [data.meta?.campaigns_daily, range]);
  const spesaGads = useMemo(() => sumInRange(data.gads_daily, range, 3), [data.gads_daily, range]);
  const spesaTot = spesaMeta + spesaGads;
  const spesaTotPrev = useMemo(() => {
    if (!compareRange) return null;
    return sumInRange(data.meta?.campaigns_daily, compareRange, 3) + sumInRange(data.gads_daily, compareRange, 3);
  }, [data.meta?.campaigns_daily, data.gads_daily, compareRange]);

  const sessioni = useMemo(() => sumInRange(data.ga4?.daily, range, 1), [data.ga4?.daily, range]);
  const sessioniPrev = useMemo(() => compareRange ? sumInRange(data.ga4?.daily, compareRange, 1) : null, [data.ga4?.daily, compareRange]);

  // ─── Sparkline ──────────────────────────────────────────────────
  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sparkWood = useSparkProps(WOOD);
  const storeMaps = useMemo(() => ({
    fatturato: storeDayMap(store, "fatturato"),
    ordini: storeDayMap(store, "ordini"),
    articoli: storeDayMap(store, "articoli"),
  }), [store]);

  const sp = useMemo(() => {
    const spesa: DayMap[] = [dm.metaSpend, dm.gadsSpend];
    // Senza i dati del negozio una serie di zeri disegnerebbe un calo inesistente
    const vuota = { values: [], labels: [] };
    const woo = (opts: Parameters<typeof buildSpark>[1]) => (store ? buildSpark(range, opts) : vuota);
    return {
      fatturato: woo({ num: [storeMaps.fatturato] }),
      ordini: woo({ num: [storeMaps.ordini] }),
      scontrino: woo({ num: [storeMaps.fatturato], den: [storeMaps.ordini] }),
      articoli: woo({ num: [storeMaps.articoli] }),
      spesa: buildSpark(range, { num: spesa }),
      mer: woo({ num: [storeMaps.fatturato], den: spesa }),
      sessioni: buildSpark(range, { num: [dm.sessions], from: dm.ga4First }),
      conv: woo({ num: [storeMaps.ordini], den: [dm.sessions], scale: 100, from: dm.ga4First }),
    };
  }, [dm, range, storeMaps, store]);

  // ─── Andamento giornaliero: negozio e spesa, stessa unità ───────
  const chart = useMemo(() => {
    const giorni = new Map<string, { fatturato: number; ordini: number; spesa: number }>();
    const get = (d: string) => {
      const cur = giorni.get(d) ?? { fatturato: 0, ordini: 0, spesa: 0 };
      giorni.set(d, cur);
      return cur;
    };
    for (const g of store?.giorni ?? []) {
      const c = get(g.data); c.fatturato += g.fatturato; c.ordini += g.ordini;
    }
    for (const r of data.meta?.campaigns_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      get(d).spesa += Number(r[3]) || 0;
    }
    for (const r of data.gads_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      get(d).spesa += Number(r[3]) || 0;
    }
    return [...giorni.entries()]
      .filter(([d]) => d >= range.start && d <= range.end)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data_, v]) => ({ data: data_, ...v }));
  }, [store, data.meta?.campaigns_daily, data.gads_daily, range]);

  const mer = spesaTot > 0 && store ? store.totals.fatturato_lordo / spesaTot : null;
  const merPrev = spesaTotPrev && spesaTotPrev > 0 && store?.prev ? store.prev.fatturato_lordo / spesaTotPrev : null;
  const convRate = sessioni > 0 && store ? (store.totals.ordini / sessioni) * 100 : null;
  const convRatePrev = sessioniPrev && sessioniPrev > 0 && store?.prev ? (store.prev.ordini / sessioniPrev) * 100 : null;

  const acquistiGads = useMemo(() => gadsPurchasesInRange(data, range), [data, range]);
  const acquistiMeta = useMemo(() => sumInRange(data.meta?.campaigns_daily, range, 7), [data.meta?.campaigns_daily, range]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · ${range.days} giorni · vendite e ordini letti da WooCommerce`}>
        Panoramica
      </SectionTitle>

      {rangeTooEarly && ga4First && (
        <Card padding={14} style={{ borderColor: `${WOOD}55` }}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted }}>
            Il periodo scelto inizia prima del <strong>{fmtDate(ga4First)}</strong>, primo giorno con dati
            Google Analytics: le voci di traffico partono da lì, mentre ordini e fatturato di WooCommerce
            coprono comunque tutto il periodo.
          </p>
        </Card>
      )}

      {/* ─── Negozio ─────────────────────────────────────────────── */}
      <div>
        <p style={kicker(palette.textDim)}>Negozio</p>
        <div style={kpiGrid}>
          <KpiTile
            label="Fatturato" accent={WOOD}
            value={store ? eur0(store.totals.fatturato_lordo) : "…"}
            delta={calcDelta(store?.totals.fatturato_lordo, store?.prev?.fatturato_lordo)}
            sub="incassato, spedizioni incluse"
            info="Total sales di WooCommerce sul periodo: valore degli ordini comprensivo di spedizioni e tasse, al netto dei resi. È il dato di cassa, non la stima di Analytics."
            {...sparkWood(sp.fatturato, eur0)}
          />
          <KpiTile
            label="Ordini"
            value={store ? integer(store.totals.ordini) : "…"}
            delta={calcDelta(store?.totals.ordini, store?.prev?.ordini)}
            sub={store ? `${num(store.totals.articoli_per_ordine, 1)} articoli per ordine` : undefined}
            info="Ordini registrati da WooCommerce nel periodo, in tutti gli stati tranne quelli annullati."
            onClick={() => setTab("clienti")}
            {...spark(sp.ordini, integer)}
          />
          <KpiTile
            label="Scontrino medio"
            value={store ? eur(store.totals.scontrino_medio) : "…"}
            delta={calcDelta(store?.totals.scontrino_medio, store?.prev?.scontrino_medio)}
            info="Valore medio dell'ordine secondo WooCommerce."
            {...spark(sp.scontrino, eur0)}
          />
          <KpiTile
            label="Articoli venduti"
            value={store ? integer(store.totals.articoli) : "…"}
            delta={calcDelta(store?.totals.articoli, store?.prev?.articoli)}
            info="Numero di pezzi venduti, utile a distinguere un fatturato fatto di pochi articoli costosi da uno fatto di molti pezzi."
            onClick={() => setTab("prodotti")}
            {...spark(sp.articoli, integer)}
          />
        </div>
      </div>

      {/* ─── Acquisizione ────────────────────────────────────────── */}
      <div>
        <p style={kicker(palette.textDim)}>Acquisizione</p>
        <div style={kpiGrid}>
          <KpiTile
            label="Spesa pubblicitaria"
            value={eur0(spesaTot)}
            delta={calcDelta(spesaTot, spesaTotPrev)}
            sub={`Meta ${eur0(spesaMeta)} · Google ${eur0(spesaGads)}`}
            info="Somma della spesa Meta Ads e Google Ads nel periodo."
            onClick={() => setTab("advertising")}
            {...spark(sp.spesa, eur0)}
          />
          <KpiTile
            label="MER" accent={ACCENT}
            value={mer != null ? num(mer, 2) : "—"}
            delta={calcDelta(mer, merPrev)}
            sub="fatturato totale su spesa ads"
            info="Media Efficiency Ratio: fatturato del negozio diviso per la spesa pubblicitaria complessiva. A differenza del ROAS delle piattaforme non dipende dall'attribuzione, quindi non conta due volte lo stesso ordine."
            {...spark(sp.mer, (v) => num(v, 1))}
          />
          <KpiTile
            label="Sessioni"
            value={integer(sessioni)}
            delta={calcDelta(sessioni, sessioniPrev)}
            info="Sessioni registrate da Google Analytics. Il consenso ai cookie ne lascia fuori una parte: per i numeri di vendita fa fede WooCommerce."
            onClick={() => setTab("funnel")}
            {...spark(sp.sessioni, integer)}
          />
          <KpiTile
            label="Tasso di conversione"
            value={convRate != null ? pctStr(convRate, 2) : "—"}
            delta={calcDelta(convRate, convRatePrev)}
            sub="ordini WooCommerce su sessioni"
            info="Ordini reali del negozio divisi per le sessioni di Analytics. Essendo il numeratore più completo del denominatore, il valore è leggermente generoso ma confrontabile nel tempo."
            {...spark(sp.conv, (v) => pctStr(v, 2))}
          />
        </div>
      </div>

      {/* ─── Andamento ───────────────────────────────────────────── */}
      <StoreSection height={360}>
        {() => (
      <Card>
        <CardHeader
          title="Fatturato e spesa pubblicitaria, giorno per giorno"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>due scale diverse: gli ordini valgono molto più di quanto si investe</span>}
        />
        {chart.length === 0 ? <EmptyState label="Nessun giorno nel periodo selezionato" /> : (
          <>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: palette.textMuted }}>Fatturato del negozio</p>
            <div style={{ width: "100%", height: 230 }}>
              <ResponsiveContainer>
                <ComposedChart data={chart} margin={{ top: 6, right: 8, bottom: 0, left: 0 }} syncId="ow-giorni">
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis dataKey="data" tick={false} axisLine={{ stroke: palette.cardBorder }} tickLine={false} height={6} />
                  <YAxis tickFormatter={(v) => eur0(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }}
                    axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<GiornoTooltip />} cursor={{ fill: palette.buttonHover }} />
                  <Bar dataKey="fatturato" name="Fatturato negozio" fill={WOOD} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p style={{ margin: "10px 0 4px", fontSize: 11, fontWeight: 700, color: palette.textMuted }}>Spesa pubblicitaria</p>
            <div style={{ width: "100%", height: 130 }}>
              <ResponsiveContainer>
                <ComposedChart data={chart} margin={{ top: 6, right: 8, bottom: 0, left: 0 }} syncId="ow-giorni">
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis dataKey="data" tickFormatter={fmtDate} tick={{ fill: palette.axis, fontSize: 10 }}
                    axisLine={{ stroke: palette.cardBorder }} tickLine={false} minTickGap={24} />
                  <YAxis tickFormatter={(v) => eur0(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }}
                    axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<GiornoTooltip />} cursor={{ stroke: palette.textFaint }} />
                  <Line type="monotone" dataKey="spesa" name="Spesa pubblicitaria" stroke={ACCENT} strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>
        )}
      </StoreSection>

      {/* ─── Top prodotti e categorie ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
        <StoreSection height={260}>
          {(s) => (
            <Card>
              <CardHeader title="Prodotti più venduti"
                right={<LinkBtn onClick={() => setTab("prodotti")}>Tutti i prodotti</LinkBtn>} />
              <RankList
                rows={s.prodotti.slice(0, 6).map((p) => ({ nome: p.nome, valore: p.fatturato, extra: `${integer(p.articoli)} pz` }))}
                color={WOOD}
              />
            </Card>
          )}
        </StoreSection>
        <StoreSection height={260}>
          {(s) => (
            <Card>
              <CardHeader title="Categorie che fatturano di più"
                right={<LinkBtn onClick={() => setTab("categorie")}>Tutte le categorie</LinkBtn>} />
              <RankList
                rows={s.categorie.slice(0, 6).map((c) => ({ nome: c.nome, valore: c.fatturato, extra: `${integer(c.ordini)} ordini` }))}
                color={ACCENT}
              />
            </Card>
          )}
        </StoreSection>
      </div>

      {/* ─── Canali ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Da dove arriva il traffico"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>Google Analytics, sessioni nel periodo</span>} />
        <CanaliTable data={data} />
      </Card>

      <p style={{ margin: 0, fontSize: 11, color: palette.textDim, lineHeight: 1.6 }}>
        Nel periodo le piattaforme si attribuiscono {integer(acquistiMeta)} acquisti su Meta e{" "}
        {num(acquistiGads.conv, 1)} su Google, contro {store ? integer(store.totals.ordini) : "—"} ordini
        registrati dal negozio. Le due misure rispondono a domande diverse: la prima dice quanto lavora ogni
        piattaforma, la seconda quanto è entrato davvero in cassa.
      </p>
    </div>
  );
}

// ─── Blocchi di supporto ────────────────────────────────────────

type GiornoPoint = { data: string; fatturato: number; ordini: number; spesa: number };

/** Stesso riquadro per i due grafici affiancati: il giorno si legge una volta sola. */
function GiornoTooltip({ active, payload, label }: {
  active?: boolean; payload?: { payload: GiornoPoint }[]; label?: string | number;
}) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={tooltipBox(palette)}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDate(String(label))}</div>
      <div>Fatturato: <strong>{eur0(p.fatturato)}</strong></div>
      <div>Ordini: <strong>{integer(p.ordini)}</strong></div>
      <div>Spesa ads: <strong>{eur0(p.spesa)}</strong></div>
      {p.spesa > 0 && <div style={{ color: palette.textDim }}>MER {num(p.fatturato / p.spesa, 1)}</div>}
    </div>
  );
}

function CanaliTable({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const righe = useMemo(() => {
    const m = new Map<string, { sessioni: number; acquisti: number; revenue: number }>();
    for (const r of data.ga4?.channels_daily ?? []) {
      const d = String(r[0]); if (d < range.start || d > range.end) continue;
      const k = String(r[1] || "Altro");
      const cur = m.get(k) ?? { sessioni: 0, acquisti: 0, revenue: 0 };
      cur.sessioni += Number(r[2]) || 0;
      cur.acquisti += Number(r[4]) || 0;
      cur.revenue += Number(r[5]) || 0;
      m.set(k, cur);
    }
    return [...m.entries()].map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.sessioni - a.sessioni).slice(0, 8);
  }, [data.ga4?.channels_daily, range]);

  if (righe.length === 0) return <EmptyState label="Nessuna sessione nel periodo" />;
  const max = Math.max(...righe.map((r) => r.sessioni));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {righe.map((r, i) => (
        <div key={r.nome} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1.3fr) 2fr auto", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: palette.text, fontWeight: 500 }}>{r.nome}</span>
          <div style={{ height: 8, borderRadius: 4, background: palette.buttonHover, overflow: "hidden" }}>
            <div style={{
              width: `${(r.sessioni / max) * 100}%`, height: "100%", borderRadius: 4,
              background: CHART_PALETTE[i % CHART_PALETTE.length],
            }} />
          </div>
          <span style={{ fontSize: 11, color: palette.textMuted, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
            {integer(r.sessioni)} sess. · {integer(r.acquisti)} acq.
          </span>
        </div>
      ))}
    </div>
  );
}

function RankList({ rows, color }: { rows: { nome: string; valore: number; extra: string }[]; color: string }) {
  const { palette } = useTheme();
  if (rows.length === 0) return <EmptyState label="Nessuna vendita nel periodo" />;
  const max = Math.max(...rows.map((r) => r.valore));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <div key={r.nome}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: palette.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.nome}>
              {r.nome}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: palette.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              {eur0(r.valore)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: palette.buttonHover, overflow: "hidden" }}>
              <div style={{ width: `${max > 0 ? (r.valore / max) * 100 : 0}%`, height: "100%", background: color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, color: palette.textDim, whiteSpace: "nowrap" }}>{r.extra}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LinkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const { palette } = useTheme();
  return (
    <button onClick={onClick} style={{
      border: "none", background: "transparent", color: palette.textDim,
      fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0,
    }}>{children} →</button>
  );
}

export function tooltipBox(palette: { tooltipBg: string; tooltipBorder: string; text: string }): React.CSSProperties {
  return {
    background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`,
    borderRadius: 8, padding: "7px 10px", fontSize: 11, color: palette.text,
    fontVariantNumeric: "tabular-nums",
  };
}

export const kpiGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10,
};

export function kicker(color: string): React.CSSProperties {
  return {
    margin: "0 0 8px", fontSize: 10, fontWeight: 700, color,
    letterSpacing: "0.12em", textTransform: "uppercase",
  };
}
