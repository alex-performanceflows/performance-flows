"use client";

import { useMemo } from "react";
import {
  MomiData, useTheme,
  eur0, integer, num, pctStr,
  Card, CardHeader, EmptyState, tableStyles,
  type Palette,
} from "./shared";
import { ACCENT, POSITIVE, NEGATIVE } from "../config";

type SemStatus = "green" | "amber" | "red" | "grey";

type Semaforo = {
  key: string; title: string; status: SemStatus; value: string; hint: string; detail: string;
};

const STATUS_META: Record<SemStatus, { color: string; label: string; bg: (p: Palette) => string }> = {
  green: { color: POSITIVE, label: "In linea", bg: () => "rgba(34,197,94,0.12)" },
  amber: { color: "#f59e0b", label: "Da monitorare", bg: () => "rgba(245,158,11,0.14)" },
  red: { color: NEGATIVE, label: "Da rivedere", bg: () => "rgba(239,68,68,0.12)" },
  grey: { color: "#94a3b8", label: "In raccolta", bg: (p) => p.divider },
};

export function SaluteTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const semafori = useMemo(() => computeSemafori(data), [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Salute</h2>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          Indicatori di copertura e classificazione del tracking
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {semafori.map((s) => <SemaforoCard key={s.key} sem={s} palette={palette} />)}
      </div>

      <ClassificazioneAudit data={data} palette={palette} />
      <CreativeAudit data={data} palette={palette} />
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

function computeSemafori(data: MomiData): Semaforo[] {
  const h = data.health;
  const attrib = h?.attribution_coverage_pct ?? -1;
  const freq = h?.account_frequency_w30 ?? -1;
  const nonClass = h?.spesa_non_classificata_pct ?? -1;
  const crNonClass = h?.creativita_non_classificate_pct ?? -1;
  const gscLag = h?.gsc_lag_days ?? -1;

  return [
    {
      key: "attrib",
      title: "Copertura attribuzione",
      status: attrib < 0 ? "grey" : (attrib >= 70 && attrib <= 110) ? "green" : ((attrib >= 50 && attrib < 70) || (attrib > 110 && attrib <= 130)) ? "amber" : "red",
      value: attrib < 0 ? "—" : pctStr(attrib, 1),
      hint: attrib < 0 ? "In attesa dei primi dati"
        : (attrib >= 70 && attrib <= 110) ? "Attribuzione allineata a GA4"
        : attrib < 70 ? "Sotto il target: tracking in fase di consolidamento o molto traffico organico"
        : "Sopra il target: le piattaforme si attribuiscono la stessa registrazione (fisiologico coi modelli diversi)",
      detail: "Registrazioni attribuite ÷ registrazioni GA4. Riferimento: 70-110% ok.",
    },
    {
      key: "freq",
      title: "Frequenza account Meta w30",
      status: freq < 0 ? "grey" : freq < 3 ? "green" : freq <= 4 ? "amber" : "red",
      value: freq < 0 ? "—" : num(freq, 2),
      hint: freq < 0 ? "In attesa dei primi dati"
        : freq < 3 ? "Frequenza account nella norma"
        : freq <= 4 ? "L'account sta iniziando a saturare l'audience"
        : "L'account sta saturando l'audience — allargare il pubblico è il leva-principale, non cambiare creatività",
      detail: "Media impression per persona nell'account Meta su 30 giorni. Riferimento: <3 ok.",
    },
    {
      key: "spesa-non-class",
      title: "Spesa non classificata",
      status: nonClass < 0 ? "grey" : nonClass < 5 ? "green" : nonClass < 15 ? "amber" : "red",
      value: nonClass < 0 ? "—" : pctStr(nonClass, 1),
      hint: nonClass < 0 ? "In attesa dei primi dati"
        : nonClass < 5 ? "Quasi tutta la spesa è mappata a un obiettivo"
        : "Alcune campagne finiscono in Altro perché il nome non contiene il prefisso: rifinitura naming in agenda",
      detail: "Spesa senza prefisso riconosciuto ÷ spesa totale. Riferimento: <5% ok.",
    },
    {
      key: "crea-non-class",
      title: "Creatività non classificate",
      status: crNonClass < 0 ? "grey" : crNonClass < 10 ? "green" : crNonClass < 25 ? "amber" : "red",
      value: crNonClass < 0 ? "—" : pctStr(crNonClass, 1),
      hint: crNonClass < 0 ? "In attesa dei primi dati"
        : crNonClass < 10 ? "Le inserzioni seguono la convenzione di naming"
        : "Alcune inserzioni non hanno formato o angolo riconoscibile: rifinitura naming in agenda",
      detail: "Inserzioni senza formato o angolo detectabile ÷ totale. Riferimento: <10% ok.",
    },
    {
      key: "gsc-lag",
      title: "Ritardo Search Console",
      status: gscLag < 0 ? "grey" : gscLag <= 3 ? "green" : gscLag <= 5 ? "amber" : "red",
      value: gscLag < 0 ? "—" : `${gscLag} g`,
      hint: gscLag < 0 ? "In attesa dei primi dati"
        : gscLag <= 3 ? "Nella norma di Google (~2-3g di ritardo fisiologico)"
        : gscLag <= 5 ? "Leggermente sopra la norma di Google"
        : "Sopra la norma di Google: le tabelle SEO fanno riferimento all'ultimo giorno disponibile",
      detail: "Giorni fra oggi e ultimo giorno disponibile in Search Console.",
    },
  ];
}

function ClassificazioneAudit({ data, palette }: { data: MomiData; palette: Palette }) {
  const ts = tableStyles(palette);
  const rows = useMemo(() => (data.meta?.classificazione ?? []).slice().sort((a, b) => Number(b[4]) - Number(a[4])), [data.meta?.classificazione]);
  return (
    <Card>
      <CardHeader title="Audit classificazione campagne"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>{integer(rows.length)} regole</span>} />
      {rows.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <th style={ts.th}>Campagna</th>
              <th style={ts.th}>Obiettivo</th>
              <th style={ts.th}>Piatt.</th>
              <th style={ts.th}>Metodo</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const metodo = String(r[3] ?? "");
                const isPrefisso = metodo === "prefisso";
                const isAlias = metodo === "alias";
                const isNone = metodo === "nessuno";
                const color = isPrefisso ? POSITIVE : isAlias ? "#f59e0b" : isNone ? NEGATIVE : palette.textDim;
                const bg = isPrefisso ? `${POSITIVE}22` : isAlias ? "rgba(245,158,11,0.20)" : isNone ? `${NEGATIVE}22` : palette.divider;
                return (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }} title={String(r[0])}>{String(r[0])}</td>
                    <td style={ts.tdBase}>{String(r[1])}</td>
                    <td style={{ ...ts.tdBase, fontSize: 11 }}>{String(r[2])}</td>
                    <td style={ts.tdBase}>
                      <span style={{ padding: "1px 8px", borderRadius: 20, background: bg, color, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>{metodo}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(Number(r[4]))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function CreativeAudit({ data, palette }: { data: MomiData; palette: Palette }) {
  const ts = tableStyles(palette);
  const rows = data.meta?.creative_audit ?? [];
  return (
    <Card>
      <CardHeader title="Audit creatività · formato o angolo mancante"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>{integer(rows.length)} inserzioni</span>} />
      {rows.length === 0 ? (
        <EmptyState label="Tutte le inserzioni seguono la convenzione di naming" />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Nome</th>
                <th style={ts.th}>Formato</th>
                <th style={ts.th}>Angolo</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa w30</th>
              </tr></thead>
              <tbody>
                {[...rows].sort((a, b) => Number(b[3]) - Number(a[3])).map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>{String(r[0])}</td>
                    <td style={{ ...ts.tdBase, color: String(r[1]) === "Altro" ? NEGATIVE : palette.text }}>{String(r[1])}</td>
                    <td style={{ ...ts.tdBase, color: String(r[2]) === "Altro" ? NEGATIVE : palette.text }}>{String(r[2])}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(Number(r[3]))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
            Rinomina l&apos;inserzione seguendo la convenzione <code style={{ background: palette.divider, padding: "1px 5px", borderRadius: 4, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: ACCENT }}>{"{Formato}"} · {"{Angolo}"} · {"{Soggetto}"} · {"{Variante}"}</code> oppure aggiungi un alias nel motore.
          </p>
        </>
      )}
    </Card>
  );
}
