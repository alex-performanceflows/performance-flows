"use client";

import { useMemo, useState } from "react";
import {
  GondolinaData, useTheme,
  Card, CardHeader, EmptyState, tableStyles,
  eur, eur0, integer, pctStr, fmtDateTime,
  ACCENT, POSITIVE, NEGATIVE, GOLD,
  AD_CFG, DTS_OBJECTIVE,
  type Palette,
} from "./shared";

type SemStatus = "green" | "amber" | "red" | "grey";

type Semaforo = {
  key: string;
  title: string;
  status: SemStatus;
  value: string;
  hint: string;
  detail: string;
};

const STATUS_META: Record<SemStatus, { color: string; label: string; bg: (p: Palette) => string }> = {
  green: { color: POSITIVE, label: "OK", bg: () => "rgba(34,197,94,0.12)" },
  amber: { color: GOLD, label: "Attenzione", bg: () => "rgba(201,162,39,0.14)" },
  red: { color: NEGATIVE, label: "Da correggere", bg: () => "rgba(239,68,68,0.12)" },
  grey: { color: "#94a3b8", label: "Non applicabile", bg: (p) => p.divider },
};

export function SaluteTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const semafori = useMemo(() => computeSemafori(data), [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Salute del sistema</h2>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          Sei indicatori a semaforo che sintetizzano lo stato attuale. Non seguono il range: guardano l&apos;ultima finestra utile.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {semafori.map((s) => <SemaforoCard key={s.key} sem={s} palette={palette} />)}
      </div>

      <ClassificazioneAccordion data={data} palette={palette} />
    </div>
  );
}

function SemaforoCard({ sem, palette }: { sem: Semaforo; palette: Palette }) {
  const meta = STATUS_META[sem.status];
  return (
    <div style={{
      background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 14,
      padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: 8,
      borderLeft: `3px solid ${meta.color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: palette.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{sem.title}</div>
        <span style={{
          padding: "2px 8px", borderRadius: 20, background: meta.bg(palette),
          color: meta.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
        }}>● {meta.label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: palette.text }}>{sem.value}</div>
      <div style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.45 }}>{sem.hint}</div>
      <div style={{ fontSize: 11, color: palette.textFaint, lineHeight: 1.5, borderTop: `1px dashed ${palette.divider}`, paddingTop: 6, marginTop: 2 }}>{sem.detail}</div>
    </div>
  );
}

// ─── Compute semafori ─────────────────────────────────────────────

function computeSemafori(data: GondolinaData): Semaforo[] {
  const onlineObjs = new Set(data.online_objectives ?? ["Online"]);
  const advDaily = data.adv?.daily ?? [];
  const now = new Date();

  // 1. ROAS obiettivo Online (ultima w30)
  const last30Start = isoDaysAgo(30);
  let spesaOnline = 0, valoreOnline = 0;
  for (const r of advDaily) {
    const d = String(r[0]);
    const obj = String(r[2]);
    if (d < last30Start) continue;
    if (!onlineObjs.has(obj)) continue;
    spesaOnline += Number(r[5]) || 0;
    valoreOnline += Number(r[9]) || 0;
  }
  const roas = spesaOnline > 0 ? valoreOnline / spesaOnline : 0;
  const sem1: Semaforo = {
    key: "roas",
    title: "ROAS Online · ultimi 30 giorni",
    status: spesaOnline < 100 ? "grey" : roas >= AD_CFG.ROAS_GOOD ? "green" : roas >= 1 ? "amber" : "red",
    value: spesaOnline > 0 ? `${roas.toFixed(2)}×` : "—",
    hint: spesaOnline < 100
      ? "Spesa insufficiente per calcolo affidabile"
      : roas >= AD_CFG.ROAS_GOOD ? "Sopra soglia buona (≥2×)"
      : roas >= 1 ? "Sopra il pareggio ma sotto soglia (2×)"
      : "Sotto pareggio: la campagna sta perdendo",
    detail: `Valore ${eur0(valoreOnline)} su spesa ${eur0(spesaOnline)}. Ricorda: revenue arriva da GA4 e sottostima il reale (~1/3).`,
  };

  // 2. Frequenza Meta ultima w7 (se disponibile). Non abbiamo frequency nel daily aggregato,
  //    quindi la stimiamo su rapporto imp/click sales objectives, oppure marchiamo N/A.
  //    Meglio: proxy CPC Meta w7 come segnale di saturazione: CPC in aumento >20% è amber.
  const w7Start = isoDaysAgo(7);
  const w14Start = isoDaysAgo(14);
  let metaImpW7 = 0, metaClickW7 = 0, metaSpendW7 = 0;
  let metaImpPrev = 0, metaClickPrev = 0, metaSpendPrev = 0;
  for (const r of advDaily) {
    const d = String(r[0]);
    const plat = String(r[1]);
    if (plat !== "Meta") continue;
    const imp = Number(r[6]) || 0;
    const click = Number(r[7]) || 0;
    const spend = Number(r[5]) || 0;
    if (d >= w7Start) { metaImpW7 += imp; metaClickW7 += click; metaSpendW7 += spend; }
    else if (d >= w14Start) { metaImpPrev += imp; metaClickPrev += click; metaSpendPrev += spend; }
  }
  const cpcW7 = metaClickW7 > 0 ? metaSpendW7 / metaClickW7 : 0;
  const cpcPrev = metaClickPrev > 0 ? metaSpendPrev / metaClickPrev : 0;
  const cpcDelta = cpcPrev > 0 ? (cpcW7 - cpcPrev) / cpcPrev : 0;
  const sem2: Semaforo = {
    key: "meta-cpc",
    title: "CPC Meta · trend w7 vs w7 prec.",
    status: metaSpendW7 < 50 ? "grey" : Math.abs(cpcDelta) < 0.15 ? "green" : cpcDelta > 0.30 ? "red" : "amber",
    value: metaSpendW7 > 0 ? `${eur(cpcW7)} (${cpcDelta >= 0 ? "+" : ""}${(cpcDelta * 100).toFixed(0)}%)` : "—",
    hint: metaSpendW7 < 50 ? "Spesa Meta troppo bassa per il segnale"
      : cpcDelta > 0.30 ? "CPC in forte aumento: possibile saturazione o creatività stanche"
      : cpcDelta > 0.15 ? "CPC in leggero rialzo: monitorare"
      : "CPC stabile: nessun segnale di saturazione",
    detail: `Spesa w7 ${eur0(metaSpendW7)}, click ${integer(metaClickW7)}. Proxy della frequenza (freq non nel feed).`,
  };

  // 3. Spreco search terms (costo > 5€ con 0 conv)
  const searchTerms = data.adv?.search_terms_w30 ?? [];
  let sprecato = 0, sprecoRows = 0;
  for (const t of searchTerms) {
    const costo = Number(t[4]) || 0;
    const conv = Number(t[5]) || 0;
    if (costo > 5 && conv === 0) { sprecato += costo; sprecoRows++; }
  }
  const sem3: Semaforo = {
    key: "sprechi",
    title: "Spreco search terms · 30g",
    status: searchTerms.length === 0 ? "grey" : sprecato < 20 ? "green" : sprecato < 100 ? "amber" : "red",
    value: searchTerms.length === 0 ? "—" : `${eur0(sprecato)}`,
    hint: searchTerms.length === 0 ? "Nessun termine di ricerca nel feed"
      : sprecato < 20 ? "Spreco sotto controllo"
      : sprecato < 100 ? "Da sorvegliare: aggiungere parole chiave a corrispondenza inversa"
      : "Alto: intervenire con negative keyword sui termini flaggati",
    detail: `${integer(sprecoRows)} termini con costo > 5€ e zero conversioni. Vedi tab Advertising → Search terms.`,
  };

  // 4. Freshness updated_at
  const upd = data.updated_at ? new Date(data.updated_at) : null;
  const ageMinutes = upd ? Math.floor((now.getTime() - upd.getTime()) / 60000) : Infinity;
  const ageHours = ageMinutes / 60;
  const sem4: Semaforo = {
    key: "freshness",
    title: "Freschezza dati",
    status: !upd ? "grey" : ageHours <= 24 ? "green" : ageHours <= 48 ? "amber" : "red",
    value: !upd ? "—" : ageHours < 1 ? `${ageMinutes} min` : ageHours < 24 ? `${ageHours.toFixed(1)} h` : `${Math.floor(ageHours / 24)} g`,
    hint: !upd ? "Timestamp non disponibile"
      : ageHours <= 24 ? "Dati aggiornati nelle ultime 24 ore"
      : ageHours <= 48 ? "Aggiornamento in ritardo: verificare lo script"
      : "Feed fermo: la dashboard non riflette la realtà",
    detail: upd ? `Ultimo aggiornamento: ${fmtDateTime(data.updated_at!)}` : "Il feed non ha inviato un updated_at valido.",
  };

  // 5. Ritardo Search Console
  const gscLast = data.gsc?.ultimo_giorno;
  const gscLag = gscLast ? Math.floor((now.getTime() - new Date(gscLast + "T00:00:00Z").getTime()) / 86400000) : Infinity;
  const sem5: Semaforo = {
    key: "gsc-lag",
    title: "Ritardo Search Console",
    status: !gscLast ? "grey" : gscLag <= 3 ? "green" : gscLag <= 5 ? "amber" : "red",
    value: !gscLast ? "—" : `${gscLag} g`,
    hint: !gscLast ? "GSC non collegato"
      : gscLag <= 3 ? "Ritardo normale (Google impiega ~2-3g)"
      : gscLag <= 5 ? "Leggermente sopra la norma"
      : "Ritardo anomalo: verificare l&apos;integrazione GSC",
    detail: gscLast ? `Ultimo giorno con dati SEO: ${gscLast}. I confronti SEO usano questo limite.` : "Nessun dato Search Console.",
  };

  // 6. Copertura classificazione campagne (spesa Meta con classificazione ≠ vuoto)
  const classif = data.adv?.classificazione ?? [];
  const classifSet = new Set(classif.map((r) => `${r[0]}|${r[1]}`));
  const daysN = 30;
  const from = isoDaysAgo(daysN);
  let spesaMetaTot = 0, spesaMetaClass = 0;
  for (const r of advDaily) {
    const d = String(r[0]);
    if (d < from) continue;
    const plat = String(r[1]);
    if (plat !== "Meta") continue;
    const camp = String(r[3]);
    const spend = Number(r[5]) || 0;
    spesaMetaTot += spend;
    if (classifSet.has(`${camp}|${plat}`)) spesaMetaClass += spend;
  }
  const cov = spesaMetaTot > 0 ? spesaMetaClass / spesaMetaTot : 0;
  const sem6: Semaforo = {
    key: "classif",
    title: "Copertura classificazione · 30g",
    status: spesaMetaTot < 50 ? "grey" : cov >= 0.90 ? "green" : cov >= 0.70 ? "amber" : "red",
    value: spesaMetaTot < 50 ? "—" : pctStr(cov * 100, 1),
    hint: spesaMetaTot < 50 ? "Spesa Meta insufficiente per valutare la copertura"
      : cov >= 0.90 ? "Quasi tutta la spesa Meta è classificata"
      : cov >= 0.70 ? "Alcune campagne Meta non classificate: gli aggregati per obiettivo perdono precisione"
      : "Molte campagne Meta senza classificazione: gli aggregati per obiettivo sono inaffidabili",
    detail: `Spesa classificata ${eur0(spesaMetaClass)} su ${eur0(spesaMetaTot)}. Le campagne senza mapping finiscono in "${DTS_OBJECTIVE}" o "Altro".`,
  };

  return [sem1, sem2, sem3, sem4, sem5, sem6];
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── Audit classificazione (accordion) ────────────────────────────

function ClassificazioneAccordion({ data, palette }: { data: GondolinaData; palette: Palette }) {
  const [open, setOpen] = useState(false);
  const rows = data.adv?.classificazione ?? [];
  const ts = tableStyles(palette);

  const totalByObj = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const obj = String(r[2] ?? "—");
      m.set(obj, (m.get(obj) ?? 0) + (Number(r[4]) || 0));
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const totalSpend = totalByObj.reduce((s, [, v]) => s + v, 0);

  return (
    <Card>
      <button onClick={() => setOpen((v) => !v)} style={{
        width: "100%", textAlign: "left", background: "transparent", border: "none",
        padding: 0, cursor: "pointer", color: palette.text, fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>Audit classificazione campagne</div>
          <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>
            {integer(rows.length)} regole, spesa totale mappata {eur0(totalSpend)}
          </div>
        </div>
        <span style={{
          color: palette.textMuted, fontSize: 20, transition: "transform 0.2s",
          transform: open ? "rotate(90deg)" : "rotate(0)",
        }}>›</span>
      </button>

      {open && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {totalByObj.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {totalByObj.map(([obj, spesa]) => (
                <span key={obj} style={{
                  padding: "4px 10px", borderRadius: 20, background: palette.divider,
                  color: palette.textMuted, fontSize: 11, fontWeight: 600,
                }}>
                  {obj} · <strong style={{ color: ACCENT }}>{eur0(spesa)}</strong>
                </span>
              ))}
            </div>
          )}

          {rows.length === 0 ? <EmptyState label="Nessuna regola di classificazione" /> : (
            <div style={{ overflowX: "auto", maxHeight: 500 }}>
              <CardHeader title={`Regole (${rows.length})`} />
              <table style={ts.table}>
                <thead><tr>
                  <th style={ts.th}>Campagna</th>
                  <th style={ts.th}>Piatt.</th>
                  <th style={ts.th}>Obiettivo</th>
                  <th style={ts.th}>Metodo</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => {
                    const obj = String(r[2] ?? "");
                    const dts = obj === DTS_OBJECTIVE;
                    return (
                      <tr key={i}>
                        <td style={{
                          ...ts.tdBase, color: palette.text,
                          maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11,
                        }} title={String(r[0])}>{String(r[0])}</td>
                        <td style={ts.tdBase}>{String(r[1])}</td>
                        <td style={{ ...ts.tdBase, color: dts ? GOLD : palette.text, fontWeight: dts ? 600 : 400 }}>{obj}</td>
                        <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>{String(r[3] ?? "")}</td>
                        <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(Number(r[4]))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
