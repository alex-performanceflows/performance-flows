"use client";

import { useMemo } from "react";
import {
  CoorieData, useTheme,
  eur, eur0, integer, pctStr, fmtDate, fmtDateTime,
  Card, CardHeader, EmptyState, tableStyles,
  ACCENT, SAND, POSITIVE, NEGATIVE,
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

const STATUS_META: Record<SemStatus, { color: string; label: string; bg: string }> = {
  green: { color: POSITIVE, label: "In linea", bg: "rgba(34,197,94,0.12)" },
  amber: { color: SAND, label: "Da monitorare", bg: `${SAND}22` },
  red: { color: NEGATIVE, label: "Da consolidare", bg: "rgba(239,68,68,0.12)" },
  grey: { color: "#94a3b8", label: "Non ancora attivo", bg: "rgba(148,163,184,0.15)" },
};

export function EmailSaluteTab({ data }: { data: CoorieData }) {
  const { palette } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Email e salute</h2>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>
          Klaviyo, indicatori a semaforo del tracking e audit classificazione campagne
        </p>
      </div>

      <KlaviyoBlock data={data} />
      <SemaforiBlock data={data} />
      <ClassificazioneBlock data={data} />
    </div>
  );
}

// ─── Klaviyo ──────────────────────────────────────────────────────

function KlaviyoBlock({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const k = data.klaviyo;
  const active = k?.active ?? false;

  if (!active) {
    return (
      <Card>
        <CardHeader title="Klaviyo · email" />
        <div style={{
          padding: "1.5rem 1rem", textAlign: "center",
          background: palette.divider, borderRadius: 10,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: palette.textMuted }}>
            <strong style={{ color: palette.text }}>Klaviyo collegato, flussi non ancora attivi.</strong><br />
            <span style={{ fontSize: 12, color: palette.textDim }}>La sezione si popola da sola quando partono.</span>
          </p>
        </div>
      </Card>
    );
  }

  const flows = k?.flows ?? [];
  const campaigns = k?.campaigns ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
      <Card>
        <CardHeader title={`Flussi Klaviyo · ${integer(flows.length)}`} />
        {flows.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Nome</th>
                <th style={ts.th}>Stato</th>
                <th style={ts.th}>Trigger</th>
                <th style={ts.th}>Ultimo agg.</th>
              </tr></thead>
              <tbody>
                {flows.map((r, i) => {
                  const stato = String(r[1]);
                  const isLive = /live/i.test(stato);
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
                      <td style={ts.tdBase}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20,
                          background: isLive ? `${POSITIVE}25` : palette.divider,
                          color: isLive ? POSITIVE : palette.textDim,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                        }}>{stato}</span>
                      </td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>{String(r[2])}</td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>
                        {r[3] ? fmtDate(String(r[3])) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={`Campagne Klaviyo · ${integer(campaigns.length)}`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Oggetto</th>
                <th style={ts.th}>Stato</th>
                <th style={ts.th}>Inviata il</th>
              </tr></thead>
              <tbody>
                {campaigns.map((r, i) => {
                  const stato = String(r[1]);
                  const isSent = /sent/i.test(stato);
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
                      <td style={ts.tdBase}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20,
                          background: isSent ? `${ACCENT}25` : palette.divider,
                          color: isSent ? ACCENT : palette.textDim,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                        }}>{stato}</span>
                      </td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>
                        {r[2] ? fmtDateTime(String(r[2])) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Semafori ────────────────────────────────────────────────────

function SemaforiBlock({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const semafori = useMemo(() => computeSemafori(data), [data]);
  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: palette.text }}>Indicatori di salute</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {semafori.map((s) => <SemaforoCard key={s.key} sem={s} palette={palette} />)}
      </div>
    </div>
  );
}

function computeSemafori(data: CoorieData): Semaforo[] {
  const h = data.health;
  const pixel = h?.pixel_coverage_pct ?? -1;
  const gads = h?.gads_coverage_pct ?? -1;
  const nonClass = h?.spesa_non_classificata_pct ?? -1;
  const gscLag = h?.gsc_lag_days ?? -1;
  const firstDate = h?.ga4_first_date ?? data.ga4?.first_date;

  return [
    {
      key: "pixel",
      title: "Copertura Pixel Meta",
      status: pixel < 0 ? "grey" : pixel >= 85 ? "green" : pixel >= 60 ? "amber" : "red",
      value: pixel < 0 ? "—" : pctStr(pixel, 0),
      hint: pixel < 0 ? "In attesa dei primi dati"
        : pixel >= 85 ? "Il Pixel intercetta la maggior parte delle transazioni"
        : pixel >= 60 ? "Copertura in fase di consolidamento"
        : "Copertura ancora in costruzione: il segnale al Pixel si allinea man mano che il volume cresce",
      detail: "Acquisti registrati dal Pixel ÷ transazioni GA4. Riferimento: sopra 85% ottimo, 60-85% da monitorare, sotto 60% da consolidare.",
    },
    {
      key: "gads",
      title: "Copertura conversioni Google Ads",
      status: gads < 0 ? "grey" : gads >= 85 ? "green" : gads >= 60 ? "amber" : "red",
      value: gads < 0 ? "—" : pctStr(gads, 0),
      hint: gads < 0 ? "In attesa dei primi dati"
        : gads >= 85 ? "Google Ads riceve la maggior parte delle conversioni"
        : gads >= 60 ? "Segnale di conversione in fase di consolidamento"
        : "Segnale di conversione ancora in costruzione: si allinea a mano a mano che il tracciamento matura",
      detail: "Riferimento: sopra 85% ottimo, 60-85% da monitorare, sotto 60% da consolidare.",
    },
    {
      key: "spesa-non-class",
      title: "Spesa non classificata",
      status: nonClass < 0 ? "grey" : nonClass < 5 ? "green" : nonClass < 15 ? "amber" : "red",
      value: nonClass < 0 ? "—" : pctStr(nonClass, 1),
      hint: nonClass < 0 ? "In attesa dei primi dati"
        : nonClass < 5 ? "Quasi tutta la spesa è mappata a un obiettivo"
        : nonClass < 15 ? "Qualche campagna finisce in Altro: rifinitura naming in agenda"
        : "Parte della spesa è ancora in Altro: la mappatura si estende via via che nuove campagne vengono lanciate",
      detail: "Spesa senza obiettivo esplicito ÷ spesa totale. Riferimento: sotto 5% ottimo.",
    },
    {
      key: "gsc-lag",
      title: "Ritardo Search Console",
      status: gscLag < 0 ? "grey" : gscLag <= 3 ? "green" : gscLag <= 5 ? "amber" : "red",
      value: gscLag < 0 ? "—" : `${gscLag} g`,
      hint: gscLag < 0 ? "In attesa dei primi dati"
        : gscLag <= 3 ? "Nella norma di Google (~2-3g di ritardo fisiologico)"
        : gscLag <= 5 ? "Leggermente sopra la norma di Google"
        : "Sopra la norma di Google: fisiologico ogni tanto, le tabelle SEO fanno riferimento all'ultimo giorno disponibile",
      detail: "Giorni fra oggi e ultimo giorno disponibile in Search Console.",
    },
    {
      key: "first-date",
      title: "Primo giorno di dati GA4",
      status: firstDate ? "green" : "grey",
      value: firstDate ? fmtDate(firstDate) : "—",
      hint: firstDate ? "I range che partono prima di questa data mostrano soltanto i giorni con dati" : "In attesa dei primi dati GA4",
      detail: "Data del primo evento GA4 utile. I confronti storici partono da qui.",
    },
  ];
}

function SemaforoCard({ sem, palette }: { sem: Semaforo; palette: import("./shared").Palette }) {
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
          padding: "2px 8px", borderRadius: 20, background: meta.bg,
          color: meta.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
        }}>● {meta.label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: palette.text }}>{sem.value}</div>
      <div style={{ fontSize: 12, color: palette.textDim, lineHeight: 1.45 }}>{sem.hint}</div>
      <div style={{ fontSize: 11, color: palette.textFaint, lineHeight: 1.5, borderTop: `1px dashed ${palette.divider}`, paddingTop: 6, marginTop: 2 }}>{sem.detail}</div>
    </div>
  );
}

// ─── Audit classificazione ───────────────────────────────────────

function ClassificazioneBlock({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const rows = useMemo(() => (data.meta?.classificazione ?? []).slice().sort((a, b) => Number(b[3]) - Number(a[3])), [data.meta?.classificazione]);
  const totalSpend = rows.reduce((s, r) => s + (Number(r[3]) || 0), 0);

  const methodColor = (metodo: string): { color: string; bg: string } => {
    const m = metodo.toLowerCase();
    if (m.includes("prefisso") || m.includes("prefix")) return { color: POSITIVE, bg: `${POSITIVE}22` };
    if (m.includes("alias")) return { color: SAND, bg: `${SAND}22` };
    if (m.includes("non classificat") || m.includes("nessuna")) return { color: NEGATIVE, bg: `${NEGATIVE}22` };
    return { color: palette.textDim, bg: palette.divider };
  };

  return (
    <Card>
      <CardHeader title="Audit classificazione campagne"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>
          {integer(rows.length)} regole · totale spesa {eur0(totalSpend)}
        </span>} />
      {rows.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <th style={ts.th}>Campagna</th>
              <th style={ts.th}>Obiettivo</th>
              <th style={ts.th}>Metodo</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const metodo = String(r[2] ?? "");
                const mc = methodColor(metodo);
                return (
                  <tr key={i}>
                    <td style={{
                      ...ts.tdBase, color: palette.text,
                      maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11,
                    }} title={String(r[0])}>{String(r[0])}</td>
                    <td style={ts.tdBase}>{String(r[1] ?? "")}</td>
                    <td style={ts.tdBase}>
                      <span style={{
                        padding: "1px 8px", borderRadius: 20,
                        background: mc.bg, color: mc.color,
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                      }}>{metodo}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur(Number(r[3]))}</td>
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
