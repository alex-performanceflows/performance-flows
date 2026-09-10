"use client";

import { useMemo, useState } from "react";
import {
  GondolinaData, useTheme,
  Card, CardHeader, EmptyState, tableStyles,
  eur, eur0, integer, num, pctStr, fmtDateTime,
  ACCENT, POSITIVE, NEGATIVE, GOLD,
  DTS_OBJECTIVE,
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
  green: { color: POSITIVE, label: "In linea", bg: () => "rgba(34,197,94,0.12)" },
  amber: { color: GOLD, label: "Da monitorare", bg: () => "rgba(201,162,39,0.14)" },
  red: { color: NEGATIVE, label: "Da rivedere", bg: () => "rgba(239,68,68,0.12)" },
  grey: { color: "#94a3b8", label: "In raccolta", bg: (p) => p.divider },
};

export function SaluteTab({ data }: { data: GondolinaData }) {
  const { palette } = useTheme();
  const semafori = useMemo(() => computeSemafori(data), [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Salute del sistema</h2>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          Sei indicatori a semaforo. Ognuno con valore, soglia e cosa fare se è rosso.
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

// ─── Semafori dallo spec ─────────────────────────────────────────

function computeSemafori(data: GondolinaData): Semaforo[] {
  const now = new Date();
  const advDaily = data.adv?.daily ?? [];
  const summary = data.summary?.w30;

  // 1. Attribuito vs GA4 (verde < 110%)
  const attrib = summary?.attribuito_su_ga4_pct ?? null;
  const sem1: Semaforo = {
    key: "attrib",
    title: "Attribuito vs GA4",
    status: attrib == null ? "grey" : attrib < 110 ? "green" : attrib < 150 ? "amber" : "red",
    value: attrib == null ? "—" : pctStr(attrib, 1),
    hint: attrib == null ? "In attesa dei primi dati"
      : attrib < 110 ? "Attribuzione advertising in linea con quanto GA4 misura"
      : attrib < 150 ? "L'attribuzione delle piattaforme è più generosa di GA4: fisiologico coi modelli diversi"
      : "L'attribuzione delle piattaforme è più larga di GA4: qui si legge la differenza fra modelli, non uno sbaglio",
    detail: "Rapporto fra valore attribuito nelle piattaforme pubblicitarie e revenue GA4. Sopra 110% verde, oltre 150% rosso.",
  };

  // 2. Spesa non classificata (quota spesa "Altro" ultimi 30 giorni)
  const from30 = isoDaysAgo(30);
  let spesaTot = 0, spesaAltro = 0;
  for (const r of advDaily) {
    const d = String(r[0]);
    if (d < from30) continue;
    const obj = String(r[2]);
    const spend = Number(r[5]) || 0;
    spesaTot += spend;
    if (obj === "Altro") spesaAltro += spend;
  }
  const nonClassPct = spesaTot > 0 ? (spesaAltro / spesaTot) * 100 : 0;
  const sem2: Semaforo = {
    key: "non-class",
    title: "Spesa non classificata · 30g",
    status: spesaTot < 50 ? "grey" : nonClassPct < 5 ? "green" : nonClassPct < 15 ? "amber" : "red",
    value: spesaTot < 50 ? "—" : pctStr(nonClassPct, 1),
    hint: spesaTot < 50 ? "In attesa di volume sufficiente"
      : nonClassPct < 5 ? "Quasi tutta la spesa è mappata a un obiettivo"
      : nonClassPct < 15 ? "Qualche campagna finisce in Altro: rifinitura naming in agenda"
      : "Parte della spesa è ancora in Altro: la mappatura si estende via via che nuove campagne vengono lanciate",
    detail: `${eur0(spesaAltro)} su ${eur0(spesaTot)} sono nell'obiettivo "Altro". Rifinitura via alias di classificazione.`,
  };

  // 3. Indicazioni tracciate (sum sul range 30g)
  let indicazioni = 0;
  for (const r of advDaily) {
    const d = String(r[0]);
    if (d < from30) continue;
    indicazioni += Number(r[10]) || 0;
  }
  const sem3: Semaforo = {
    key: "indicazioni",
    title: "Indicazioni tracciate · 30g",
    status: indicazioni > 0 ? "green" : spesaTot > 100 ? "red" : "grey",
    value: integer(indicazioni),
    hint: indicazioni > 0
      ? "Il tracking delle indicazioni sta ricevendo eventi"
      : spesaTot > 100 ? "Nessuna indicazione registrata sul range nonostante la spesa Drive to Store — l'evento si allinea quando gli utenti tocca il pulsante indicazioni sulla scheda di Google"
      : "In attesa dei primi eventi di indicazione",
    detail: "Conta le indicazioni al percorso stradale registrate come conversione dalle campagne Drive to Store nella finestra 30g.",
  };

  // 4. Termini a zero conversioni (quota costo su totale)
  const searchTerms = data.adv?.search_terms_w30 ?? [];
  let costoTot = 0, costoSpreco = 0;
  for (const t of searchTerms) {
    const costo = Number(t[4]) || 0;
    const conv = Number(t[5]) || 0;
    costoTot += costo;
    if (conv === 0) costoSpreco += costo;
  }
  const sprecoPct = costoTot > 0 ? (costoSpreco / costoTot) * 100 : 0;
  const sem4: Semaforo = {
    key: "spreco",
    title: "Termini a zero conversioni",
    status: searchTerms.length === 0 ? "grey" : sprecoPct < 30 ? "green" : sprecoPct < 60 ? "amber" : "red",
    value: searchTerms.length === 0 ? "—" : pctStr(sprecoPct, 1),
    hint: searchTerms.length === 0 ? "In attesa dei primi search term"
      : sprecoPct < 30 ? "Percentuale fisiologica"
      : sprecoPct < 60 ? "Buona parte del costo è su termini che non hanno ancora convertito: rifinitura negative keyword in agenda"
      : "Grossa parte del costo è su termini che non hanno ancora convertito: rifinitura negative keyword in agenda",
    detail: `${eur0(costoSpreco)} su ${eur0(costoTot)} sono finiti su termini senza conversioni sul range. Vedi tab Advertising → Search terms.`,
  };

  // 5. Freschezza dati (ore da updated_at, verde < 8)
  const upd = data.updated_at ? new Date(data.updated_at) : null;
  const ageMinutes = upd ? Math.floor((now.getTime() - upd.getTime()) / 60000) : Infinity;
  const ageHours = ageMinutes / 60;
  const sem5: Semaforo = {
    key: "freshness",
    title: "Freschezza dati",
    status: !upd ? "grey" : ageHours < 8 ? "green" : ageHours < 24 ? "amber" : "red",
    value: !upd ? "—" : ageHours < 1 ? `${ageMinutes} min` : ageHours < 24 ? `${ageHours.toFixed(1)} h` : `${Math.floor(ageHours / 24)} g`,
    hint: !upd ? "In attesa del primo aggiornamento"
      : ageHours < 8 ? "Dati freschi"
      : ageHours < 24 ? "L'ultimo refresh è sopra le 8h"
      : "L'ultimo refresh è di ieri: numeri riferiti a quella data",
    detail: upd ? `Ultimo aggiornamento: ${fmtDateTime(data.updated_at!)}` : "Il feed non ha inviato un updated_at valido.",
  };

  // 6. Ritardo Search Console (verde ≤ 3g)
  const gscLast = data.gsc?.ultimo_giorno;
  const gscLag = gscLast ? Math.floor((now.getTime() - new Date(gscLast + "T00:00:00Z").getTime()) / 86400000) : Infinity;
  const sem6: Semaforo = {
    key: "gsc-lag",
    title: "Ritardo Search Console",
    status: !gscLast ? "grey" : gscLag <= 3 ? "green" : gscLag <= 5 ? "amber" : "red",
    value: !gscLast ? "—" : `${gscLag} g`,
    hint: !gscLast ? "In attesa dei primi dati Search Console"
      : gscLag <= 3 ? "Nella norma di Google (~2-3g di ritardo fisiologico)"
      : gscLag <= 5 ? "Leggermente sopra la norma di Google"
      : "Sopra la norma di Google: fisiologico ogni tanto, le tabelle SEO fanno riferimento all'ultimo giorno disponibile",
    detail: gscLast ? `Ultimo giorno con dati SEO: ${gscLast}. I confronti SEO usano questo limite.` : "Nessun dato Search Console.",
  };

  return [sem1, sem2, sem3, sem4, sem5, sem6];
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── Classificazione audit (contatori cliccabili + tabella filtrata) ─

type MetodoFilter = "all" | "prefisso" | "alias" | "nessuna";

function methodCategory(metodo: string): "prefisso" | "alias" | "nessuna" | "altro" {
  const m = metodo.toLowerCase();
  if (m.includes("prefisso") || m.includes("prefix")) return "prefisso";
  if (m.includes("alias")) return "alias";
  if (m.includes("nessuna") || m.includes("non classificat")) return "nessuna";
  return "altro";
}

function ClassificazioneAccordion({ data, palette }: { data: GondolinaData; palette: Palette }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<MetodoFilter>("all");
  const rows = data.adv?.classificazione ?? [];
  const ts = tableStyles(palette);

  const counts = useMemo(() => {
    const c = { prefisso: 0, alias: 0, nessuna: 0, altro: 0 };
    for (const r of rows) c[methodCategory(String(r[3] ?? ""))]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => methodCategory(String(r[3] ?? "")) === filter);
  }, [rows, filter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (Number(b[4]) || 0) - (Number(a[4]) || 0)), [filtered]);
  const totalSpend = rows.reduce((s, r) => s + (Number(r[4]) || 0), 0);

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
            {integer(rows.length)} regole, spesa mappata {eur0(totalSpend)}
          </div>
        </div>
        <span style={{
          color: palette.textMuted, fontSize: 20, transition: "transform 0.2s",
          transform: open ? "rotate(90deg)" : "rotate(0)",
        }}>›</span>
      </button>

      {open && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Contatori cliccabili */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <FilterChip label="Tutte" count={rows.length} active={filter === "all"} color={palette.textMuted} onClick={() => setFilter("all")} palette={palette} />
            <FilterChip label="Da prefisso" count={counts.prefisso} active={filter === "prefisso"} color={POSITIVE} onClick={() => setFilter(filter === "prefisso" ? "all" : "prefisso")} palette={palette} />
            <FilterChip label="Da alias" count={counts.alias} active={filter === "alias"} color={GOLD} onClick={() => setFilter(filter === "alias" ? "all" : "alias")} palette={palette} />
            <FilterChip label="Non classificate" count={counts.nessuna} active={filter === "nessuna"} color={NEGATIVE} onClick={() => setFilter(filter === "nessuna" ? "all" : "nessuna")} palette={palette} />
          </div>

          {sorted.length === 0 ? <EmptyState label="Nessuna regola col filtro" /> : (
            <div style={{ overflowX: "auto", maxHeight: 500 }}>
              <CardHeader title={`Regole (${sorted.length})`} />
              <table style={ts.table}>
                <thead><tr>
                  <th style={ts.th}>Campagna</th>
                  <th style={ts.th}>Piatt.</th>
                  <th style={ts.th}>Obiettivo</th>
                  <th style={ts.th}>Metodo</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                </tr></thead>
                <tbody>
                  {sorted.map((r, i) => {
                    const obj = String(r[2] ?? "");
                    const metodo = String(r[3] ?? "");
                    const cat = methodCategory(metodo);
                    const metCol = cat === "prefisso" ? POSITIVE : cat === "alias" ? GOLD : cat === "nessuna" ? NEGATIVE : palette.textDim;
                    const metBg = cat === "prefisso" ? `${POSITIVE}22` : cat === "alias" ? `${GOLD}22` : cat === "nessuna" ? `${NEGATIVE}22` : palette.divider;
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
                        <td style={ts.tdBase}>
                          <span style={{
                            padding: "1px 8px", borderRadius: 20, background: metBg, color: metCol,
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                          }}>{metodo}</span>
                        </td>
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

function FilterChip({ label, count, active, color, onClick, palette }: {
  label: string; count: number; active: boolean; color: string; onClick: () => void; palette: Palette;
}) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 20, cursor: "pointer",
      border: `1px solid ${active ? color : palette.cardBorder}`,
      background: active ? `${color}22` : "transparent",
      color: active ? color : palette.textMuted,
      fontSize: 11, fontWeight: 700, fontFamily: "inherit", letterSpacing: "0.02em",
    }}>
      {label} <span style={{ opacity: 0.7 }}>({integer(count)})</span>
    </button>
  );
}

void eur; void num;
