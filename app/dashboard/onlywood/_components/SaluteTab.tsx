"use client";

import { useMemo, useState } from "react";
import {
  OnlywoodData, useDateRange, useStore, useTheme,
  Card, CardHeader, SectionTitle, tableStyles,
  eur0, integer, num, pctStr, fmtDate, fmtDateTime,
  sumInRange,
  type Palette,
} from "./shared";
import { POSITIVE, NEGATIVE, WOOD } from "../config";

type SemStatus = "green" | "amber" | "red" | "grey";

type Semaforo = { key: string; title: string; status: SemStatus; value: string; hint: string; detail: string };

const STATUS_META: Record<SemStatus, { color: string; label: string; bg: (p: Palette) => string }> = {
  green: { color: POSITIVE, label: "In linea", bg: () => "rgba(34,197,94,0.12)" },
  amber: { color: WOOD, label: "Da monitorare", bg: () => "rgba(192,138,74,0.16)" },
  red: { color: NEGATIVE, label: "Da rivedere", bg: () => "rgba(239,68,68,0.12)" },
  grey: { color: "#94a3b8", label: "In raccolta", bg: (p) => p.divider },
};

export function SaluteTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const { store } = useStore();

  const acquistiGa4 = useMemo(() => sumInRange(data.ga4?.funnel_daily, range, 5), [data.ga4?.funnel_daily, range]);
  const semafori = useMemo(
    () => computeSemafori(data, acquistiGa4, store?.totals.ordini ?? null, store?.ordini_campione ?? null, store?.ordini_totali ?? null),
    [data, acquistiGa4, store],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionTitle sub="Ogni indicatore con il suo valore e la soglia di riferimento. Serve a sapere quanto sono solidi i numeri delle altre sezioni.">
        Salute dei dati
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {semafori.map((s) => <SemaforoCard key={s.key} sem={s} palette={palette} />)}
      </div>

      <FontiCard data={data} />
      <ClassificazioneCard data={data} />

      <Card padding={16}>
        <p style={{ margin: 0, fontSize: 12, color: palette.textMuted, lineHeight: 1.65 }}>
          <strong style={{ color: palette.text }}>Da dove arriva ogni numero.</strong> Ordini, fatturato,
          prodotti, spedizioni e resi sono letti direttamente da WooCommerce a ogni cambio di periodo: sono
          il dato di cassa. Sessioni, schede viste, carrelli e checkout vengono da Google Analytics e
          risentono del consenso ai cookie, quindi servono a leggere il percorso, non a contare gli ordini.
          Meta Ads e Google Ads riportano spesa e conversioni secondo le proprie regole di attribuzione.
          Search Console copre la parte organica con qualche giorno di ritardo.{" "}
          {data.updated_at && <>Il motore raccoglie tutto una volta al giorno: ultimo giro {fmtDateTime(data.updated_at)}.</>}
        </p>
      </Card>
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
          color: meta.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}>● {meta.label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: palette.text }}>{sem.value}</div>
      <div style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.45 }}>{sem.hint}</div>
      <div style={{ fontSize: 11, color: palette.textFaint, lineHeight: 1.5, borderTop: `1px dashed ${palette.divider}`, paddingTop: 6, marginTop: 2 }}>{sem.detail}</div>
    </div>
  );
}

function computeSemafori(
  data: OnlywoodData,
  acquistiGa4: number,
  ordiniWoo: number | null,
  campione: number | null,
  totaliOrdini: number | null,
): Semaforo[] {
  const h = data.health ?? {};
  const out: Semaforo[] = [];

  // 1. Fonti del motore
  const fonti = h.sources ?? [];
  const ok = fonti.filter((f) => f.ok).length;
  out.push({
    key: "fonti",
    title: "Fonti dell'ultimo giro",
    status: fonti.length === 0 ? "grey" : ok === fonti.length ? "green" : ok >= fonti.length - 1 ? "amber" : "red",
    value: fonti.length === 0 ? "—" : `${ok} / ${fonti.length}`,
    hint: fonti.length === 0 ? "In attesa del primo giro del motore"
      : ok === fonti.length ? "Tutte le fonti hanno risposto"
      : "Una parte delle fonti non ha risposto: per quelle resta in mostra l'ultimo dato buono",
    detail: "Il motore interroga Meta, Google Analytics e Search Console in blocchi indipendenti: se uno non risponde, gli altri arrivano comunque.",
  });

  // 2. Freschezza del dato
  const updated = data.updated_at ? new Date(data.updated_at) : null;
  const ore = updated ? (Date.now() - updated.getTime()) / 3600000 : null;
  out.push({
    key: "fresh",
    title: "Ultimo aggiornamento",
    status: ore == null ? "grey" : ore <= 30 ? "green" : ore <= 54 ? "amber" : "red",
    value: ore == null ? "—" : ore < 1 ? "meno di un'ora fa" : `${num(ore, 0)} ore fa`,
    hint: ore == null ? "In attesa del primo giro"
      : ore <= 30 ? "Il giro quotidiano è arrivato regolarmente"
      : "Il dato mostrato è quello dell'ultimo giro riuscito",
    detail: `Il motore gira una volta al giorno di primo mattino.${updated ? ` Ultimo giro: ${fmtDateTime(data.updated_at!)}.` : ""}`,
  });

  // 3. Attribuzione pubblicitaria rispetto ad Analytics
  const attrib = h.copertura_attribuzione_pct ?? data.blended?.w30?.attribuito_su_ga4_pct ?? null;
  out.push({
    key: "attrib",
    title: "Attribuito vs Analytics · 30g",
    status: attrib == null ? "grey" : attrib < 130 ? "green" : attrib < 180 ? "amber" : "red",
    value: attrib == null ? "—" : pctStr(attrib, 0),
    hint: attrib == null ? "In attesa dei primi dati"
      : attrib < 130 ? "Le piattaforme si attribuiscono un numero di acquisti in linea con quelli visti da Analytics"
      : "Le piattaforme sono più generose di Analytics: è la differenza fra due modelli di attribuzione, non un conteggio sbagliato",
    detail: "Acquisti attribuiti da Meta e Google rapportati a quelli registrati da Analytics negli ultimi 30 giorni.",
  });

  // 4. Analytics rispetto agli ordini reali
  const copertura = ordiniWoo && ordiniWoo > 0 ? (acquistiGa4 / ordiniWoo) * 100 : null;
  out.push({
    key: "ga4-woo",
    title: "Analytics vs WooCommerce",
    status: copertura == null ? "grey" : copertura >= 70 ? "green" : copertura >= 40 ? "amber" : "red",
    value: copertura == null ? "…" : pctStr(copertura, 0),
    hint: copertura == null ? "In attesa dei dati del negozio"
      : copertura >= 70 ? "Analytics vede la gran parte degli ordini registrati dal negozio"
      : "Analytics vede una parte degli ordini: la differenza è il traffico senza consenso ai cookie e gli ordini raccolti fuori dal sito",
    detail: `Acquisti tracciati da Analytics (${integer(acquistiGa4)}) rapportati agli ordini WooCommerce del periodo${ordiniWoo != null ? ` (${integer(ordiniWoo)})` : ""}. Per questo il fatturato in dashboard arriva sempre da WooCommerce.`,
  });

  // 5. Classificazione della spesa
  const nonClass = h.spesa_non_classificata_pct ?? null;
  out.push({
    key: "classificazione",
    title: "Spesa classificata · 30g",
    status: nonClass == null ? "grey" : nonClass <= 15 ? "green" : nonClass <= 40 ? "amber" : "red",
    value: nonClass == null ? "—" : pctStr(100 - nonClass, 0),
    hint: nonClass == null ? "In attesa dei primi dati"
      : nonClass <= 15 ? "Quasi tutta la spesa ricade in un obiettivo riconosciuto dal nome della campagna"
      : "Una quota della spesa sta su campagne il cui nome non contiene un obiettivo riconoscibile: finisce sotto «Altro» nelle viste per obiettivo",
    detail: "Il motore legge l'obiettivo dal nome della campagna. I totali di spesa restano corretti in ogni caso: cambia solo il raggruppamento.",
  });

  // 6. Ritardo di Search Console
  const ultimo = h.gsc_ultimo_giorno ?? data.gsc?.ultimo_giorno ?? null;
  const lag = ultimo ? Math.round((Date.now() - new Date(`${ultimo}T12:00:00`).getTime()) / 86400000) : null;
  out.push({
    key: "gsc",
    title: "Dati Search Console",
    status: lag == null ? "grey" : lag <= 4 ? "green" : lag <= 7 ? "amber" : "red",
    value: ultimo ? fmtDate(ultimo) : "—",
    hint: lag == null ? "In attesa dei primi dati"
      : lag <= 4 ? "Ritardo nella norma per Search Console"
      : "Search Console sta rilasciando i dati con qualche giorno in più del solito",
    detail: "Google pubblica i dati di ricerca con due o tre giorni di ritardo: i giorni mancanti sono esclusi dai totali.",
  });

  // 7. Tracciamento dei carrelli
  const atc1000 = h.atc_per_1000_sessioni ?? null;
  out.push({
    key: "atc",
    title: "Carrelli per 1.000 sessioni",
    status: atc1000 == null ? "grey" : atc1000 >= 40 ? "green" : atc1000 >= 10 ? "amber" : "red",
    value: atc1000 == null ? "—" : num(atc1000, 0),
    hint: atc1000 == null ? "In attesa dei primi dati"
      : atc1000 >= 40 ? "L'evento di aggiunta al carrello arriva ad Analytics con regolarità"
      : "L'evento di aggiunta al carrello arriva ad Analytics in misura ridotta rispetto al traffico",
    detail: "Serve a capire quanto è affidabile la lettura del carrello in Analytics: i numeri di vendita restano quelli di WooCommerce.",
  });

  // 8. Profondità della lettura degli ordini
  const quota = campione != null && totaliOrdini ? (campione / totaliOrdini) * 100 : null;
  out.push({
    key: "ordini",
    title: "Ordini letti nel dettaglio",
    status: quota == null ? "grey" : quota >= 99 ? "green" : quota >= 60 ? "amber" : "red",
    value: campione == null || totaliOrdini == null ? "…" : `${integer(campione)} / ${integer(totaliOrdini)}`,
    hint: quota == null ? "In attesa dei dati del negozio"
      : quota >= 99 ? "Spedizioni, pagamenti e resi sono calcolati su tutti gli ordini del periodo"
      : "Spedizioni, pagamenti e resi sono calcolati su una parte degli ordini: le proporzioni tengono, i totali assoluti vanno letti come riferimento",
    detail: "Fatturato, ordini, prodotti e categorie arrivano dai report aggregati di WooCommerce e coprono sempre tutto il periodo.",
  });

  return out;
}

// ─── Dettaglio delle fonti ──────────────────────────────────────

function FontiCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const fonti = data.health?.sources ?? [];

  const NOMI: Record<string, string> = {
    meta_stati: "Meta · stato degli annunci",
    meta_creativita: "Meta · creatività",
    meta_creativita_daily: "Meta · creatività giorno per giorno",
    meta_campagne: "Meta · campagne",
    meta_campagne_daily: "Meta · campagne giorno per giorno",
    meta_adset: "Meta · pubblici",
    meta_breakdown: "Meta · paesi e posizionamenti",
    ga4: "Google Analytics",
    gsc: "Search Console",
  };

  if (fonti.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Le fonti, una per una"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimo giro del motore</span>} />
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Fonte</th>
              <th style={ts.th}>Esito</th>
              <th style={ts.th}>Nota</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Tempo di risposta</th>
            </tr>
          </thead>
          <tbody>
            {fonti.map((f) => (
              <tr key={f.fonte}>
                <td style={{ ...ts.tdBase, color: palette.text }}>{NOMI[f.fonte] ?? f.fonte}</td>
                <td style={ts.tdBase}>
                  <span style={{
                    display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 6,
                    background: f.ok ? "rgba(34,197,94,0.14)" : "rgba(192,138,74,0.16)",
                    color: f.ok ? POSITIVE : WOOD, fontSize: 10.5, fontWeight: 700,
                  }}>{f.ok ? "Ricevuta" : "Non ricevuta"}</span>
                </td>
                <td style={{ ...ts.tdBase, fontSize: 11, maxWidth: 420 }}>
                  {f.ok ? "—" : (f.messaggio || "resta in mostra l'ultimo dato buono")}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{f.ms > 0 ? `${num(f.ms / 1000, 1)} s` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Come sono state classificate le campagne ───────────────────

function ClassificazioneCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const [aperto, setAperto] = useState(false);

  const righe = useMemo(() => (data.meta?.classificazione ?? []).map((r) => ({
    campagna: String(r[0] ?? ""),
    obiettivo: String(r[1] ?? ""),
    metodo: String(r[2] ?? ""),
    spesa: Number(r[3]) || 0,
  })).sort((a, b) => b.spesa - a.spesa), [data.meta?.classificazione]);

  if (righe.length === 0) return null;
  const altro = righe.filter((r) => r.obiettivo === "Altro");
  const spesaAltro = altro.reduce((s, r) => s + r.spesa, 0);
  const spesaTot = righe.reduce((s, r) => s + r.spesa, 0);

  return (
    <Card>
      <CardHeader
        title="Come sono state raggruppate le campagne Meta"
        right={
          <button onClick={() => setAperto((v) => !v)} style={{
            border: `1px solid ${palette.inputBorder}`, background: palette.input,
            color: palette.textMuted, fontSize: 11, fontWeight: 600, borderRadius: 7,
            padding: "0.3rem 0.65rem", cursor: "pointer", fontFamily: "inherit",
          }}>{aperto ? "Nascondi" : "Mostra"} dettaglio</button>
        }
      />
      <p style={{ margin: 0, fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
        L&apos;obiettivo di ogni campagna viene riconosciuto dalle parole contenute nel nome.{" "}
        {spesaTot > 0 && altro.length > 0 ? (
          <>Su {eur0(spesaTot)} di spesa negli ultimi 30 giorni, {eur0(spesaAltro)} (
          {pctStr((spesaAltro / spesaTot) * 100, 0)}) stanno su {altro.length}{" "}
          {altro.length === 1 ? "campagna il cui nome non contiene" : "campagne i cui nomi non contengono"} una
          parola riconosciuta, e compaiono quindi sotto «Altro» nelle viste per obiettivo.</>
        ) : (
          <>Tutte le campagne del periodo ricadono in un obiettivo riconosciuto.</>
        )}
      </p>

      {aperto && (
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Campagna</th>
                <th style={ts.th}>Obiettivo</th>
                <th style={ts.th}>Riconosciuto da</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa 30g</th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => (
                <tr key={r.campagna}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 320 }}>
                    <span title={r.campagna} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.campagna}</span>
                  </td>
                  <td style={{ ...ts.tdBase, color: r.obiettivo === "Altro" ? palette.textDim : palette.textMuted }}>{r.obiettivo}</td>
                  <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textDim }}>{r.metodo}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.spesa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
