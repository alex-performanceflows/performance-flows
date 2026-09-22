"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CoorieData, useDateRange, useTheme,
  eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill,
  tableStyles, useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle,
  creativeWindowFor, buildSpark, useSparkProps, WINDOW_DAYS,
  ACCENT, SAND, AD_CFG,
  type CreativeWindow, type SortValue, type DayMap, type DateRange,
} from "./shared";
import {
  CreativeWindowDetail, WINDOW_LABEL,
  creativeKey, isVideoFormat, statoLabel, useCreativeWindows, verdettiWindow,
  type CreativeMetricsRaw,
} from "./creatives";
import AiInsights from "@/components/dashboard/insights/AiInsights";
import { buildCreativeInsights, type InsightCreative } from "@/lib/creative-insights";

const VERDICT_UI: Record<string, { color: string; bg: string; short: string }> = {
  "SCALA":       { color: "#22c55e", bg: "rgba(34,197,94,0.18)",   short: "Scala" },
  "MANTIENI":    { color: "#94a3b8", bg: "rgba(148,163,184,0.20)", short: "Mantieni" },
  "RINNOVA":     { color: "#f59e0b", bg: "rgba(245,158,11,0.20)",  short: "Rinnova" },
  "DA RIVEDERE": { color: "#eab308", bg: "rgba(234,179,8,0.18)",   short: "Da rivedere" },
  "SPEGNI":      { color: "#ef4444", bg: "rgba(239,68,68,0.20)",   short: "Spegni" },
  "OSSERVA":     { color: "#64748b", bg: "rgba(100,116,139,0.20)", short: "Osserva" },
  "IN RACCOLTA": { color: "#38bdf8", bg: "rgba(56,189,248,0.20)",  short: "In raccolta" },
};
const verdictUi = (v: string) =>
  VERDICT_UI[v] ?? { color: "rgba(148,163,184,0.9)", bg: "rgba(148,163,184,0.15)", short: v || "—" };

export function CreativitaTab({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const { preset, range } = useDateRange();
  const windows = useCreativeWindows(data);
  const [soloAttive, setSoloAttive] = useState(false);

  const { win, exact } = creativeWindowFor(preset, range.days);
  const longerWin: CreativeWindow | null = win === "w7" ? "w30" : win === "w30" ? "w90" : null;
  const benchmark = data.meta?.benchmark;
  const aggiornato = !!data.meta?.creative_head;

  const creatives = useMemo(() => {
    const all = [...windows[win].values()];
    return soloAttive ? all.filter((c) => c.stato === "ACTIVE") : all;
  }, [windows, win, soloAttive]);

  const tot = useMemo(() => ({
    spesa: creatives.reduce((s, c) => s + c.spesa, 0),
    impression: creatives.reduce((s, c) => s + c.impression, 0),
    clickLink: creatives.reduce((s, c) => s + c.clickLink, 0),
    atc: creatives.reduce((s, c) => s + c.atc, 0),
    acquisti: creatives.reduce((s, c) => s + c.acquisti, 0),
    attive: creatives.filter((c) => c.stato === "ACTIVE").length,
  }), [creatives]);

  // ─── Letture automatiche ────────────────────────────────────────
  const insights = useMemo(() => {
    if (!aggiornato || creatives.length === 0) return [];
    // Meta attribuisce pochissimi acquisti a Coorie: il risultato leggibile è il carrello
    const usaAcquisti = tot.acquisti >= 10;
    const costoDi = (c: CreativeMetricsRaw) =>
      usaAcquisti ? (c.acquisti > 0 ? c.spesa / c.acquisti : null)
                  : (c.atc > 0 ? c.spesa / c.atc : null);
    const rows: InsightCreative[] = creatives.map((c) => {
      const video = isVideoFormat(c.formato);
      const prima = longerWin ? windows[longerWin].get(creativeKey(c.nome)) : undefined;
      return {
        nome: c.nome, formato: c.formato, soggetto: c.soggetto || null,
        isVideo: video, spesa: c.spesa, impression: c.impression,
        risultati: usaAcquisti ? c.acquisti : c.atc,
        costo: costoDi(c),
        hook: video ? c.hookRate : null,
        hold: video ? c.holdRate : null,
        ctr: c.ctrLink,
        giorni: c.giorni,
        costoPrecedente: prima ? costoDi(prima) : null,
      };
    });
    return buildCreativeInsights(rows, {
      risultatoLabel: usaAcquisti ? "acquisti" : "aggiunte al carrello",
      costoLabel: usaAcquisti ? "costo per acquisto" : "costo per carrello",
      minSpesa: AD_CFG.MIN_SPEND,
      finestraBreve: longerWin ? `negli ${WINDOW_LABEL[win]}` : undefined,
      finestraLunga: longerWin ? `agli ${WINDOW_LABEL[longerWin]}` : undefined,
      eur, pct: (n, digits = 1) => pctStr(n, digits), integer,
    });
  }, [creatives, windows, win, longerWin, tot.acquisti, aggiornato]);

  const costoAtc = tot.atc > 0 ? tot.spesa / tot.atc : null;
  const ctrLink = tot.impression > 0 ? (tot.clickLink / tot.impression) * 100 : null;

  // ─── Sparkline dalla serie giornaliera per creatività ───────────
  // Non seguono il periodo scelto in alto ma la finestra del motore, così
  // la linea copre esattamente i giorni del valore che le sta sopra.
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => {
    const righe = data.meta?.creatives_daily ?? [];
    if (righe.length === 0) return null;

    // [data, creativita, formato, soggetto, spesa, impression, clickLink, atc, acquisti, valore]
    const spesa: DayMap = new Map(), impression: DayMap = new Map();
    const clickLink: DayMap = new Map(), atc: DayMap = new Map();
    let ultimo = "";
    for (const r of righe) {
      const d = String(r[0]);
      if (d > ultimo) ultimo = d;
      const add = (m: DayMap, v: unknown) => m.set(d, (m.get(d) ?? 0) + (Number(v) || 0));
      add(spesa, r[4]); add(impression, r[5]); add(clickLink, r[6]); add(atc, r[7]);
    }
    if (!ultimo) return null;

    const giorni = WINDOW_DAYS[win];
    const inizio = new Date(ultimo);
    inizio.setDate(inizio.getDate() - (giorni - 1));
    const finestra: DateRange = { start: inizio.toISOString().slice(0, 10), end: ultimo, days: giorni };

    return {
      spesa: buildSpark(finestra, { num: [spesa] }),
      costoAtc: buildSpark(finestra, { num: [spesa], den: [atc] }),
      ctrLink: buildSpark(finestra, { num: [clickLink], den: [impression], scale: 100 }),
    };
  }, [data.meta?.creatives_daily, win]);

  if (!aggiornato) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionTitle sub="Meta Ads">Creatività</SectionTitle>
        <Card>
          <p style={{ margin: 0, fontSize: 13, color: palette.textMuted, lineHeight: 1.6 }}>
            Questa sezione si appoggia ai campi che il motore aggiornato aggiunge a ogni creatività —
            formato, soggetto, click sul link e metriche video. Il payload attuale arriva dalla versione
            precedente, quindi qui non c&apos;è ancora niente da mostrare: comparirà al primo giro del
            motore nuovo.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`Meta Ads · ${WINDOW_LABEL[win]} fino all'ultimo aggiornamento`}>
        Creatività
      </SectionTitle>

      {!exact && (
        <Card padding={14}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted }}>
            Le creatività arrivano dal motore già aggregate su 7, 30 e 90 giorni: il periodo scelto in alto
            ({fmtDate(range.start)} – {fmtDate(range.end)}, {range.days}{" "}giorni) è stato ricondotto alla
            finestra più vicina, <strong style={{ color: palette.text }}>{WINDOW_LABEL[win]}</strong>.
          </p>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        <KpiTile label="Creatività con spesa" value={integer(creatives.length)}
          sub={`${integer(tot.attive)} ancora attive`}
          info="Creatività distinte con almeno un euro speso nella finestra. Una creatività duplicata in più gruppi di inserzioni conta una volta sola: spesa e risultati sono sommati." />
        <KpiTile label="Spesa" value={eur0(tot.spesa)}
          info="Spesa Meta attribuita alle creatività della finestra."
          {...(sp ? spark(sp.spesa, eur0) : {})} />
        <KpiTile label="Costo per carrello" accent={ACCENT}
          value={costoAtc != null ? eur(costoAtc) : "—"}
          sub={`${integer(tot.atc)} aggiunte al carrello`}
          info="Spesa totale divisa per le aggiunte al carrello. È il metro principale finché gli acquisti attribuiti restano pochi."
          {...(sp ? spark(sp.costoAtc, eur) : {})} />
        <KpiTile label="CTR sul link" accent={SAND}
          value={ctrLink != null ? pctStr(ctrLink, 2) : "—"}
          sub={`${integer(tot.clickLink)} click sul link`}
          info="Click sul link diviso impression: misura quanto la creatività porta davvero al sito, senza contare i click su like e commenti."
          {...(sp ? spark(sp.ctrLink, (v) => pctStr(v, 2)) : {})} />
      </div>

      <AiInsights insights={insights} accent={ACCENT} periodo={WINDOW_LABEL[win]} />

      <VerdettiCard data={data} />

      <CreativeTable
        data={data}
        creatives={creatives}
        win={win}
        soloAttive={soloAttive}
        onToggleAttive={() => setSoloAttive((v) => !v)}
      />

      <RiepilogoCard formato={data.meta?.per_formato} soggetto={data.meta?.per_soggetto} />

      {benchmark?.affidabile && (
        <Card padding={16}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: palette.text }}>Riferimenti dell&apos;account</strong>, calcolati sulle{" "}
            {integer(benchmark.n)} creatività con spesa sopra {eur0(AD_CFG.MIN_SPEND)}: CTR sul link{" "}
            {benchmark.ctr_link != null ? pctStr(benchmark.ctr_link, 2) : "—"}, costo per carrello{" "}
            {benchmark.costo_atc != null ? eur(benchmark.costo_atc) : "—"}, CPM{" "}
            {benchmark.cpm != null ? eur(benchmark.cpm) : "—"}
            {benchmark.hook != null && <>, hook rate {pctStr(benchmark.hook, 1)}</>}. Sono mediane, quindi
            metà delle creatività sta sopra e metà sotto.
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── Verdetti del motore ─────────────────────────────────────────

function VerdettiCard({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const win = verdettiWindow(data);

  const righe = useMemo(() => (data.meta?.verdetti ?? []).map((r) => ({
    nome: String(r[0] ?? ""), formato: String(r[1] ?? ""), soggetto: String(r[2] ?? ""),
    verdetto: String(r[3] ?? ""), motivo: String(r[4] ?? ""),
    spesa: Number(r[5]) || 0, costoAtc: Number(r[6]) || 0, atc: Number(r[7]) || 0,
    acquisti: Number(r[8]) || 0, roas: Number(r[9]) || 0,
    freq: Number(r[10]) || 0, ctrLink: Number(r[11]) || 0, giorni: Number(r[12]) || 0,
  })), [data.meta?.verdetti]);

  const conteggi = useMemo(() => {
    const m = new Map<string, { n: number; spesa: number }>();
    for (const r of righe) {
      const cur = m.get(r.verdetto) ?? { n: 0, spesa: 0 };
      cur.n += 1; cur.spesa += r.spesa;
      m.set(r.verdetto, cur);
    }
    return [...m.entries()].sort((a, b) => b[1].spesa - a[1].spesa);
  }, [righe]);

  if (righe.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Come stanno andando le creatività"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>
          valutazione del motore{win ? ` · ${WINDOW_LABEL[win]}` : ""}
        </span>} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {conteggi.map(([v, c]) => {
          const ui = verdictUi(v);
          return (
            <div key={v} style={{
              padding: "0.45rem 0.7rem", borderRadius: 9,
              background: ui.bg, border: `1px solid ${ui.color}44`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ui.color }}>{ui.short}</span>
              <span style={{ fontSize: 11, color: palette.textMuted, marginLeft: 8 }}>
                {c.n} · {eur0(c.spesa)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
        <table style={{ ...ts.table, minWidth: 860 }}>
          <thead>
            <tr>
              <th style={ts.th}>Creatività</th>
              <th style={ts.th}>Formato</th>
              <th style={ts.th}>Soggetto</th>
              <th style={ts.th}>Valutazione</th>
              <th style={{ ...ts.th, minWidth: 240 }}>Perché</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Costo/carr.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Giorni</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r, i) => {
              const ui = verdictUi(r.verdetto);
              return (
                <tr key={`${r.nome}-${i}`}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 230 }}>
                    <span title={r.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, fontSize: 11 }}>{r.formato}</td>
                  <td style={{ ...ts.tdBase, fontSize: 11 }}>{r.soggetto}</td>
                  <td style={ts.tdBase}>
                    <span style={{
                      display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 6,
                      background: ui.bg, color: ui.color, fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap",
                    }}>{ui.short}</span>
                  </td>
                  <td style={{ ...ts.tdBase, fontSize: 11, minWidth: 240, lineHeight: 1.45 }}>{r.motivo}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.spesa)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.costoAtc > 0 ? eur(r.costoAtc) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.giorni > 0 ? integer(r.giorni) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 10, color: palette.textFaint, lineHeight: 1.5 }}>
        Il metro principale è il costo per carrello confrontato con la mediana dell&apos;account, con
        frequenza e CTR sul link a fare da contorno: finché Meta attribuisce pochi acquisti, il ROAS
        direbbe poco. Le creatività sotto {eur0(AD_CFG.MIN_SPEND)} di spesa restano in osservazione
        perché i numeri non sono ancora stabili.
      </p>
    </Card>
  );
}

// ─── Tabella creatività ──────────────────────────────────────────

function CreativeTable({ data, creatives, win, soloAttive, onToggleAttive }: {
  data: CoorieData;
  creatives: CreativeMetricsRaw[];
  win: CreativeWindow;
  soloAttive: boolean;
  onToggleAttive: () => void;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const windows = useCreativeWindows(data);
  const [aperta, setAperta] = useState<string | null>(null);

  const getValue = (c: CreativeMetricsRaw, k: string): SortValue => {
    switch (k) {
      case "nome": return c.nome;
      case "formato": return c.formato;
      case "soggetto": return c.soggetto;
      case "stato": return statoLabel(c.stato);
      case "spesa": return c.spesa;
      case "freq": return c.frequenza > 0 ? c.frequenza : null;
      case "ctrLink": return c.impression > 0 ? c.ctrLink : null;
      case "cpm": return c.cpm > 0 ? c.cpm : null;
      case "lpvRate": return c.clickLink > 0 ? c.lpvRate : null;
      case "atc": return c.atc;
      case "costoAtc": return c.atc > 0 ? c.spesa / c.atc : null;
      case "acquisti": return c.acquisti;
      case "hook": return isVideoFormat(c.formato) && c.impression > 0 ? c.hookRate : null;
      case "hold": return isVideoFormat(c.formato) && c.impression > 0 ? c.holdRate : null;
      case "giorni": return c.giorni;
      default: return null;
    }
  };

  const { sorted, sort, toggle } = useTableSort(creatives, getValue, { key: "spesa", dir: "desc" });

  const media = useMemo(() => {
    const spesa = sorted.reduce((s, c) => s + c.spesa, 0);
    const impression = sorted.reduce((s, c) => s + c.impression, 0);
    const clickLink = sorted.reduce((s, c) => s + c.clickLink, 0);
    const lpv = sorted.reduce((s, c) => s + c.lpv, 0);
    const atc = sorted.reduce((s, c) => s + c.atc, 0);
    const video = sorted.filter((c) => isVideoFormat(c.formato) && c.impression > 0);
    const videoImpr = video.reduce((s, c) => s + c.impression, 0);
    return {
      spesa: mean(sorted.map((c) => c.spesa)),
      freq: mean(sorted.map((c) => c.frequenza).filter((x) => x > 0)),
      ctrLink: ratio(clickLink, impression, 100),
      cpm: ratio(spesa, impression, 1000),
      lpvRate: ratio(lpv, clickLink, 100),
      atc: mean(sorted.map((c) => c.atc)),
      costoAtc: ratio(spesa, atc),
      acquisti: mean(sorted.map((c) => c.acquisti)),
      hook: videoImpr > 0 ? video.reduce((s, c) => s + c.hookRate * c.impression, 0) / videoImpr : null,
      hold: videoImpr > 0 ? video.reduce((s, c) => s + c.holdRate * c.impression, 0) / videoImpr : null,
    };
  }, [sorted]);

  if (creatives.length === 0) {
    return <Card><EmptyState label="Nessuna creatività con spesa in questa finestra" /></Card>;
  }

  return (
    <Card>
      <CardHeader
        title="Ogni creatività nel dettaglio"
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: palette.textDim }}>clicca una riga per la storia sulle tre finestre</span>
            <Pill active={soloAttive} onClick={onToggleAttive}>
              {soloAttive ? "Solo attive" : "Tutte"}
            </Pill>
          </div>
        }
      />
      <div style={{ overflowX: "auto" }}>
        <table style={{ ...ts.table, minWidth: 1180 }}>
          <thead>
            <tr>
              <th style={{ ...ts.th, width: 20 }} aria-label="Dettaglio" />
              <SortTh label="Creatività" sortKey="nome" sort={sort} onSort={toggle} />
              <SortTh label="Formato" sortKey="formato" sort={sort} onSort={toggle} />
              <SortTh label="Soggetto" sortKey="soggetto" sort={sort} onSort={toggle} />
              <SortTh label="Stato" sortKey="stato" sort={sort} onSort={toggle} />
              <SortTh label="Spesa" sortKey="spesa" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Freq." sortKey="freq" sort={sort} onSort={toggle} align="right" first="asc"
                title="Quante volte in media la stessa persona ha visto l'annuncio" />
              <SortTh label="CTR link" sortKey="ctrLink" sort={sort} onSort={toggle} align="right" />
              <SortTh label="CPM" sortKey="cpm" sort={sort} onSort={toggle} align="right" first="asc" />
              <SortTh label="Click → pagina" sortKey="lpvRate" sort={sort} onSort={toggle} align="right"
                title="Visite alla pagina sul totale dei click sul link: quanto del traffico arriva davvero a destinazione" />
              <SortTh label="Carrelli" sortKey="atc" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Costo/carr." sortKey="costoAtc" sort={sort} onSort={toggle} align="right" first="asc" />
              <SortTh label="Acquisti" sortKey="acquisti" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Hook" sortKey="hook" sort={sort} onSort={toggle} align="right"
                title="Quota di impression che guarda almeno 3 secondi: si legge solo sui video" />
              <SortTh label="Hold" sortKey="hold" sort={sort} onSort={toggle} align="right"
                title="Quota di impression che arriva al thruplay" />
              <SortTh label="Giorni" sortKey="giorni" sort={sort} onSort={toggle} align="right" />
            </tr>
          </thead>
          <tbody>
            <tr style={avgRowStyle(palette)} title={AVG_TITLE}>
              <td style={ts.tdBase} />
              <td style={{ ...ts.tdBase, fontWeight: 700, fontStyle: "italic", color: palette.text }}>Media</td>
              <td style={ts.tdBase} /><td style={ts.tdBase} /><td style={ts.tdBase} />
              <AvgTd strong>{media.spesa != null ? eur0(media.spesa) : "—"}</AvgTd>
              <AvgTd>{media.freq != null ? num(media.freq, 2) : "—"}</AvgTd>
              <AvgTd>{media.ctrLink != null ? pctStr(media.ctrLink, 2) : "—"}</AvgTd>
              <AvgTd>{media.cpm != null ? eur(media.cpm) : "—"}</AvgTd>
              <AvgTd>{media.lpvRate != null ? pctStr(media.lpvRate, 0) : "—"}</AvgTd>
              <AvgTd>{media.atc != null ? num(media.atc, 1) : "—"}</AvgTd>
              <AvgTd strong>{media.costoAtc != null ? eur(media.costoAtc) : "—"}</AvgTd>
              <AvgTd>{media.acquisti != null ? num(media.acquisti, 1) : "—"}</AvgTd>
              <AvgTd>{media.hook != null ? pctStr(media.hook, 1) : "—"}</AvgTd>
              <AvgTd>{media.hold != null ? pctStr(media.hold, 1) : "—"}</AvgTd>
              <td style={{ ...ts.tdBase, ...ts.tdRight }} />
            </tr>
            {sorted.map((c) => {
              const key = creativeKey(c.nome);
              const open = aperta === key;
              const video = isVideoFormat(c.formato);
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => setAperta(open ? null : key)}
                    style={{ cursor: "pointer", background: open ? palette.buttonHover : undefined }}
                  >
                    <td style={{ ...ts.tdBase, color: palette.textDim, textAlign: "center" }}>
                      <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                    </td>
                    <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 210 }}>
                      <span title={c.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                    </td>
                    <td style={{ ...ts.tdBase, fontSize: 11 }}>{c.formato}</td>
                    <td style={{ ...ts.tdBase, fontSize: 11 }}>{c.soggetto}</td>
                    <td style={{ ...ts.tdBase, fontSize: 11, color: c.stato === "ACTIVE" ? palette.text : palette.textDim }}>
                      {statoLabel(c.stato)}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(c.spesa)}</td>
                    <td style={{
                      ...ts.tdBase, ...ts.tdRight,
                      color: c.frequenza >= AD_CFG.FREQ_HIGH ? "#f59e0b" : palette.textMuted,
                      fontWeight: c.frequenza >= AD_CFG.FREQ_HIGH ? 700 : 400,
                    }}>{c.frequenza > 0 ? num(c.frequenza, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.impression > 0 ? pctStr(c.ctrLink, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.cpm > 0 ? eur(c.cpm) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.clickLink > 0 ? pctStr(c.lpvRate, 0) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.atc)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>
                      {c.atc > 0 ? eur(c.spesa / c.atc) : "—"}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.acquisti)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: video ? palette.textMuted : palette.textFaint }}>
                      {video && c.impression > 0 ? pctStr(c.hookRate, 1) : "—"}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: video ? palette.textMuted : palette.textFaint }}>
                      {video && c.impression > 0 ? pctStr(c.holdRate, 1) : "—"}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.giorni != null ? integer(c.giorni) : "—"}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={16} style={{ ...ts.tdBase, padding: "0.9rem 0.65rem", background: palette.buttonHover }}>
                        <CreativeWindowDetail
                          nome={c.nome} windows={windows} highlight={win} benchmark={data.meta?.benchmark}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AvgTd({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: strong ? 700 : 600, fontStyle: "italic" }}>{children}</td>;
}

// ─── Riepilogo per formato e soggetto ───────────────────────────

/**
 * Non è una vista alternativa: la tabella qui sopra ha già tutte le
 * creatività insieme. Questo è solo il totale raggruppato, mostrato per
 * intero senza niente da aprire o da cambiare.
 */
function RiepilogoCard({ formato, soggetto }: {
  formato: (string | number)[][] | undefined;
  soggetto: (string | number)[][] | undefined;
}) {
  const { palette } = useTheme();
  return (
    <Card>
      <CardHeader title="Gli stessi numeri, raggruppati"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 22 }}>
        <Gruppo titolo="Per formato" righe={formato} />
        <Gruppo titolo="Per soggetto" righe={soggetto} />
      </div>
    </Card>
  );
}

function Gruppo({ titolo, righe }: { titolo: string; righe: (string | number)[][] | undefined }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  // [valore, spesa, impression, clickLink, ctrLink%, atc, costoAtc, acquisti, valoreAcq, roas, hook%]
  const dati = (righe ?? []).map((r) => ({
    nome: String(r[0] ?? ""),
    spesa: Number(r[1]) || 0,
    ctrLink: Number(r[4]) || 0,
    atc: Number(r[5]) || 0,
    costoAtc: Number(r[6]) || 0,
    hook: r[10] == null || r[10] === "" ? null : Number(r[10]),
  })).filter((r) => r.spesa > 0).sort((a, b) => b.spesa - a.spesa);

  const maxSpesa = Math.max(...dati.map((r) => r.spesa), 1);

  return (
    <div>
      <p style={{
        margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: palette.textDim,
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>{titolo}</p>
      {dati.length === 0 ? <EmptyState label="Nessun dato" /> : (
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Valore</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
              <th style={ts.th} />
              <th style={{ ...ts.th, ...ts.thRight }}>CTR link</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Carrelli</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Costo/carr.</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Hook</th>
            </tr>
          </thead>
          <tbody>
            {dati.map((r) => (
              <tr key={r.nome}>
                <td style={{ ...ts.tdBase, color: palette.text }}>{r.nome}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.spesa)}</td>
                <td style={{ ...ts.tdBase, width: 54 }}>
                  <div style={{ height: 5, borderRadius: 3, background: palette.buttonHover, overflow: "hidden" }}>
                    <div style={{ width: `${(r.spesa / maxSpesa) * 100}%`, height: "100%", background: SAND, borderRadius: 3 }} />
                  </div>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.ctrLink > 0 ? pctStr(r.ctrLink, 2) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.atc)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>
                  {r.costoAtc > 0 ? eur(r.costoAtc) : "—"}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.hook == null ? palette.textFaint : palette.textMuted }}>
                  {r.hook != null ? pctStr(r.hook, 1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
