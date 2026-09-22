"use client";

import { Fragment, useMemo, useState } from "react";
import {
  OnlywoodData, useDateRange, useTheme,
  eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill,
  tableStyles, useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle,
  creativeWindowFor,
  type CreativeWindow, type SortValue,
} from "./shared";
import {
  CreativeWindowDetail, WINDOW_LABEL,
  creativeKey, isVideoFormat, statoLabel, useCreativeWindows, verdettiWindow,
  type CreativeMetricsRaw,
} from "./creatives";
import AiInsights from "@/components/dashboard/insights/AiInsights";
import { buildCreativeInsights, type InsightCreative } from "@/lib/creative-insights";
import { kicker, kpiGrid } from "./PanoramicaTab";
import { ACCENT, WOOD, AD_CFG, verdictUi } from "../config";

export function CreativitaTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { preset, range } = useDateRange();
  const windows = useCreativeWindows(data);
  const [includePaused, setIncludePaused] = useState(true);

  const { win, exact } = creativeWindowFor(preset, range.days);
  const longerWin: CreativeWindow | null = win === "w7" ? "w30" : win === "w30" ? "w90" : null;
  const benchmark = data.meta?.benchmark;

  const creatives = useMemo(() => {
    const all = [...windows[win].values()];
    return includePaused ? all : all.filter((c) => c.stato === "ACTIVE");
  }, [windows, win, includePaused]);

  const tot = useMemo(() => ({
    spesa: creatives.reduce((s, c) => s + c.spesa, 0),
    impression: creatives.reduce((s, c) => s + c.impression, 0),
    clickLink: creatives.reduce((s, c) => s + c.clickLink, 0),
    atc: creatives.reduce((s, c) => s + c.atc, 0),
    acquisti: creatives.reduce((s, c) => s + c.acquisti, 0),
    valore: creatives.reduce((s, c) => s + c.valore, 0),
    attive: creatives.filter((c) => c.stato === "ACTIVE").length,
  }), [creatives]);

  // ─── Letture automatiche ────────────────────────────────────────
  const insights = useMemo(() => {
    if (creatives.length === 0) return [];
    // Finché Meta attribuisce pochi acquisti, il risultato leggibile è il carrello
    const usaAcquisti = tot.acquisti >= 5;
    const costoDi = (c: CreativeMetricsRaw) =>
      usaAcquisti ? (c.acquisti > 0 ? c.spesa / c.acquisti : null)
                  : (c.atc > 0 ? c.spesa / c.atc : null);
    const rows: InsightCreative[] = creatives.map((c) => {
      const video = isVideoFormat(c.formato);
      const prima = longerWin ? windows[longerWin].get(creativeKey(c.nome, c.formato)) : undefined;
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
      minSpesa: AD_CFG.SPESA_MIN,
      costoBuono: usaAcquisti ? AD_CFG.CPA_MAX : null,
      finestraBreve: longerWin ? `negli ${WINDOW_LABEL[win]}` : undefined,
      finestraLunga: longerWin ? `agli ${WINDOW_LABEL[longerWin]}` : undefined,
      eur, pct: (n, digits = 1) => pctStr(n, digits), integer,
    });
  }, [creatives, windows, win, longerWin, tot.acquisti]);

  const roas = tot.spesa > 0 && tot.valore > 0 ? tot.valore / tot.spesa : null;
  const costoAtc = tot.atc > 0 ? tot.spesa / tot.atc : null;

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

      <div>
        <p style={kicker(palette.textDim)}>Il quadro</p>
        <div style={kpiGrid}>
          <KpiTile label="Creatività con spesa" value={integer(creatives.length)}
            sub={`${integer(tot.attive)} ancora attive`}
            info="Creatività distinte con almeno un euro speso nella finestra." />
          <KpiTile label="Spesa" value={eur0(tot.spesa)}
            info="Spesa Meta attribuita alle creatività della finestra." />
          <KpiTile label="Costo per carrello" accent={ACCENT}
            value={costoAtc != null ? eur(costoAtc) : "—"}
            sub={`${integer(tot.atc)} aggiunte al carrello`}
            info="Spesa totale divisa per le aggiunte al carrello: è la metrica più stabile quando gli acquisti attribuiti sono ancora pochi." />
          <KpiTile label="ROAS della finestra" accent={WOOD}
            value={roas != null ? num(roas, 2) : "—"}
            sub={`${integer(tot.acquisti)} acquisti attribuiti`}
            info="Valore degli acquisti attribuiti da Meta diviso per la spesa delle creatività." />
        </div>
      </div>

      <AiInsights insights={insights} accent={ACCENT} periodo={WINDOW_LABEL[win]} />

      <VerdettiCard data={data} />

      <CreativeTable
        data={data}
        creatives={creatives}
        win={win}
        includePaused={includePaused}
        onTogglePaused={() => setIncludePaused((v) => !v)}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 16 }}>
        <AggCard titolo="Per formato" righe={data.meta?.per_formato} />
        <AggCard titolo="Per soggetto" righe={data.meta?.per_soggetto} />
      </div>

      {benchmark && benchmark.affidabile && (
        <Card padding={16}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: palette.text }}>Riferimenti dell&apos;account</strong>, calcolati sulle{" "}
            {integer(benchmark.n)} creatività con spesa sopra {eur0(AD_CFG.SPESA_MIN)}: CTR sul link{" "}
            {benchmark.ctr_link != null ? pctStr(benchmark.ctr_link, 2) : "—"}, costo per carrello{" "}
            {benchmark.costo_atc != null ? eur(benchmark.costo_atc) : "—"}, CPM{" "}
            {benchmark.cpm != null ? eur(benchmark.cpm) : "—"}, ROAS{" "}
            {benchmark.roas != null ? num(benchmark.roas, 2) : "—"}. Sono mediane, quindi metà delle
            creatività sta sopra e metà sotto.
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── Verdetti del motore ─────────────────────────────────────────

function VerdettiCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const win = verdettiWindow(data);

  const righe = useMemo(() => (data.meta?.verdetti ?? []).map((r) => ({
    nome: String(r[0] ?? ""), formato: String(r[1] ?? ""), soggetto: String(r[2] ?? ""),
    verdetto: String(r[3] ?? ""), motivo: String(r[4] ?? ""),
    spesa: Number(r[5]) || 0, roas: Number(r[6]) || 0, acquisti: Number(r[7]) || 0,
    atc: Number(r[8]) || 0, freq: Number(r[9]) || 0, ctrLink: Number(r[10]) || 0,
    giorni: Number(r[11]) || 0,
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

      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Creatività</th>
              <th style={ts.th}>Formato</th>
              <th style={ts.th}>Valutazione</th>
              <th style={ts.th}>Perché</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
              <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Giorni</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => {
              const ui = verdictUi(r.verdetto);
              return (
                <tr key={`${r.nome}-${r.formato}`}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 240 }}>
                    <span title={r.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, fontSize: 11 }}>{r.formato}</td>
                  <td style={ts.tdBase}>
                    <span style={{
                      display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 6,
                      background: ui.bg, color: ui.color, fontSize: 10.5, fontWeight: 700,
                    }}>{ui.short}</span>
                  </td>
                  <td style={{ ...ts.tdBase, fontSize: 11, maxWidth: 280 }}>{r.motivo}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.spesa)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.roas > 0 ? num(r.roas, 2) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.giorni)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 10, color: palette.textFaint, lineHeight: 1.5 }}>
        La valutazione confronta ROAS, frequenza e CTR sul link con le soglie concordate, e mette a
        confronto gli ultimi 7 giorni con i 30. Le creatività sotto {eur0(AD_CFG.SPESA_MIN)} di spesa
        restano in osservazione perché i numeri non sono ancora stabili.
      </p>
    </Card>
  );
}

// ─── Tabella creatività ──────────────────────────────────────────

function CreativeTable({ data, creatives, win, includePaused, onTogglePaused }: {
  data: OnlywoodData;
  creatives: CreativeMetricsRaw[];
  win: CreativeWindow;
  includePaused: boolean;
  onTogglePaused: () => void;
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
      case "impression": return c.impression;
      case "freq": return c.frequenza > 0 ? c.frequenza : null;
      case "ctrLink": return c.impression > 0 ? c.ctrLink : null;
      case "cpm": return c.cpm > 0 ? c.cpm : null;
      case "atc": return c.atc;
      case "costoAtc": return c.atc > 0 ? c.spesa / c.atc : null;
      case "acquisti": return c.acquisti;
      case "roas": return c.valore > 0 ? c.roas : null;
      case "hook": return isVideoFormat(c.formato) && c.impression > 0 ? c.hookRate : null;
      case "giorni": return c.giorni;
      default: return null;
    }
  };

  const { sorted, sort, toggle } = useTableSort(creatives, getValue, { key: "spesa", dir: "desc" });

  const media = useMemo(() => {
    const spesa = sorted.reduce((s, c) => s + c.spesa, 0);
    const impression = sorted.reduce((s, c) => s + c.impression, 0);
    const clickLink = sorted.reduce((s, c) => s + c.clickLink, 0);
    const atc = sorted.reduce((s, c) => s + c.atc, 0);
    const valore = sorted.reduce((s, c) => s + c.valore, 0);
    const video = sorted.filter((c) => isVideoFormat(c.formato) && c.impression > 0);
    return {
      spesa: mean(sorted.map((c) => c.spesa)),
      impression: mean(sorted.map((c) => c.impression)),
      freq: mean(sorted.map((c) => c.frequenza).filter((x) => x > 0)),
      ctrLink: ratio(clickLink, impression, 100),
      cpm: ratio(spesa, impression, 1000),
      atc: mean(sorted.map((c) => c.atc)),
      costoAtc: ratio(spesa, atc),
      acquisti: mean(sorted.map((c) => c.acquisti)),
      roas: ratio(valore, spesa),
      hook: video.length > 0
        ? video.reduce((s, c) => s + c.hookRate * c.impression, 0) / video.reduce((s, c) => s + c.impression, 0)
        : null,
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
            <Pill active={includePaused} onClick={onTogglePaused}>
              {includePaused ? "Tutte" : "Solo attive"}
            </Pill>
          </div>
        }
      />
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
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
              <SortTh label="Carrelli" sortKey="atc" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Costo/carr." sortKey="costoAtc" sort={sort} onSort={toggle} align="right" first="asc" />
              <SortTh label="Acquisti" sortKey="acquisti" sort={sort} onSort={toggle} align="right" />
              <SortTh label="ROAS" sortKey="roas" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Hook" sortKey="hook" sort={sort} onSort={toggle} align="right"
                title="Quota di impression che guarda almeno 3 secondi: si legge solo sui video" />
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
              <AvgTd>{media.atc != null ? num(media.atc, 1) : "—"}</AvgTd>
              <AvgTd strong>{media.costoAtc != null ? eur(media.costoAtc) : "—"}</AvgTd>
              <AvgTd>{media.acquisti != null ? num(media.acquisti, 1) : "—"}</AvgTd>
              <AvgTd strong>{media.roas != null ? num(media.roas, 2) : "—"}</AvgTd>
              <AvgTd>{media.hook != null ? pctStr(media.hook, 1) : "—"}</AvgTd>
              <td style={{ ...ts.tdBase, ...ts.tdRight }} />
            </tr>
            {sorted.map((c) => {
              const key = creativeKey(c.nome, c.formato);
              const open = aperta === key;
              const video = isVideoFormat(c.formato);
              const roas = c.valore > 0 ? c.roas : null;
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => setAperta(open ? null : key)}
                    style={{ cursor: "pointer", background: open ? palette.buttonHover : undefined }}
                  >
                    <td style={{ ...ts.tdBase, color: palette.textDim, textAlign: "center" }}>
                      <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                    </td>
                    <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 220 }}>
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
                      color: c.frequenza >= AD_CFG.FREQ_MAX ? "#f59e0b" : palette.textMuted,
                      fontWeight: c.frequenza >= AD_CFG.FREQ_MAX ? 700 : 400,
                    }}>{c.frequenza > 0 ? num(c.frequenza, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.impression > 0 ? pctStr(c.ctrLink, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.cpm > 0 ? eur(c.cpm) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.atc)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>
                      {c.atc > 0 ? eur(c.spesa / c.atc) : "—"}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.acquisti)}</td>
                    <td style={{
                      ...ts.tdBase, ...ts.tdRight, fontWeight: 700,
                      color: roas == null ? palette.textDim
                        : roas >= AD_CFG.ROAS_SCALA ? palette.positive
                        : roas < AD_CFG.ROAS_SPEGNI ? palette.negative : palette.text,
                    }}>{roas != null ? num(roas, 2) : "—"}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: video ? palette.textMuted : palette.textFaint }}>
                      {video && c.impression > 0 ? pctStr(c.hookRate, 1) : "—"}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.giorni)}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={15} style={{ ...ts.tdBase, padding: "0.9rem 0.65rem", background: palette.buttonHover }}>
                        <CreativeWindowDetail
                          nome={c.nome} formato={c.formato}
                          windows={windows} highlight={win} benchmark={data.meta?.benchmark}
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

// ─── Aggregati per formato e soggetto ────────────────────────────

function AggCard({ titolo, righe }: { titolo: string; righe: (string | number)[][] | undefined }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  // [valore, spesa, impression, clickLink, ctrLink%, atc, costoAtc, acquisti, valoreAcq, roas, hook%]
  const dati = (righe ?? []).map((r) => ({
    nome: String(r[0] ?? ""),
    spesa: Number(r[1]) || 0,
    ctrLink: Number(r[4]) || 0,
    atc: Number(r[5]) || 0,
    costoAtc: Number(r[6]) || 0,
    acquisti: Number(r[7]) || 0,
    roas: Number(r[9]) || 0,
  })).filter((r) => r.spesa > 0).sort((a, b) => b.spesa - a.spesa);

  return (
    <Card>
      <CardHeader title={titolo}
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>} />
      {dati.length === 0 ? <EmptyState label="Nessun dato" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Valore</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR link</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Carrelli</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo/carr.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {dati.map((r) => (
                <tr key={r.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text }}>{r.nome}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(r.spesa)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.ctrLink > 0 ? pctStr(r.ctrLink, 2) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.atc)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.costoAtc > 0 ? eur(r.costoAtc) : "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>
                    {r.roas > 0 ? num(r.roas, 2) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
