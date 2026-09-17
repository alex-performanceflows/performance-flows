"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, ReferenceLine, ZAxis,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
import {
  MomiData, useTheme, useDateRange,
  eur, eur0, integer, num, pctStr,
  Card, CardHeader, EmptyState, Pill, tableStyles,
  creativeWindowFor, useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle,
  type CreativeWindow, type SortValue, type Palette,
} from "./shared";
import { ACCENT, POSITIVE, NEGATIVE, V_APP, V_FAN, SPESA_SPEGNI_ALERT_PCT, VERDICT_UI, KNOWN_FORMATS, isVideoFormat, type Verdict } from "../config";

type ObjectiveFilter = "app" | "fan";
type StatoFilter = "active" | "all";

type CreativeRow = {
  nome: string; formato: string; angolo: string; obiettivo: string; piattaforme: string;
  n_adset: number; stato: string; giorni: number;
  spesa: number; impr: number; reach: number; freq: number;
  click: number; ctr: number; cpm: number;
  install: number; cpi: number;
  reg: number; cpr: number; instRegPct: number;
  visite: number; cpv: number; follow: number;
  video3s: number; hookPct: number; thruplay: number; thruplayPct: number;
  p25: number; p75: number; holdPct: number;
};

function toRow(r: (string | number)[]): CreativeRow {
  return {
    nome: String(r[0] ?? ""), formato: String(r[1] ?? ""), angolo: String(r[2] ?? ""),
    obiettivo: String(r[3] ?? ""), piattaforme: String(r[4] ?? ""),
    n_adset: Number(r[5]) || 0, stato: String(r[6] ?? ""), giorni: Number(r[7]) || 0,
    spesa: Number(r[8]) || 0, impr: Number(r[9]) || 0, reach: Number(r[10]) || 0, freq: Number(r[11]) || 0,
    click: Number(r[12]) || 0, ctr: Number(r[13]) || 0, cpm: Number(r[14]) || 0,
    install: Number(r[15]) || 0, cpi: Number(r[16]) || 0,
    reg: Number(r[17]) || 0, cpr: Number(r[18]) || 0, instRegPct: Number(r[19]) || 0,
    visite: Number(r[20]) || 0, cpv: Number(r[21]) || 0, follow: Number(r[22]) || 0,
    video3s: Number(r[23]) || 0, hookPct: Number(r[24]) || 0,
    thruplay: Number(r[25]) || 0, thruplayPct: Number(r[26]) || 0,
    p25: Number(r[27]) || 0, p75: Number(r[28]) || 0, holdPct: Number(r[29]) || 0,
  };
}

type VerdictRow = {
  nome: string; verdetto: Verdict; motivo: string;
  cprW30: number; cprW7: number;
};

function toVerdict(r: (string | number)[]): VerdictRow {
  return {
    nome: String(r[0] ?? ""),
    verdetto: String(r[5] ?? "OSSERVA") as Verdict, motivo: String(r[6] ?? ""),
    cprW30: Number(r[8]) || 0, cprW7: Number(r[9]) || 0,
  };
}

const keyOf = (nome: string) => nome.toLowerCase().trim();

const WINDOW_LABEL: Record<CreativeWindow, string> = { w7: "ultimi 7 giorni", w30: "ultimi 30 giorni", w90: "ultimi 90 giorni" };

/** Ordine d'azione, usato per ordinare la colonna Verdetto. */
const VERDICT_RANK: Record<Verdict, number> = {
  "SCALA": 0, "MANTIENI": 1, "NUOVA": 2, "OSSERVA": 3, "FATIGUE IN ARRIVO": 4, "SPEGNI": 5,
};

// ══════════════════════════════════════════════════════════════════

export function CreativitaTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const { preset, range } = useDateRange();
  const [obiettivo, setObiettivo] = useState<ObjectiveFilter>("app");
  const [formati, setFormati] = useState<Set<string>>(new Set());
  const [stato, setStato] = useState<StatoFilter>("active");
  const [verdictFilter, setVerdictFilter] = useState<Verdict | null>(null);

  // Il periodo lo decide il selettore in alto: ricondotto alla finestra del motore più vicina
  const { win, exact } = creativeWindowFor(preset, range.days);
  const isFan = obiettivo === "fan";

  const windowRows = useMemo(
    () => (data.meta?.creatives?.[win]?.rows ?? []).map(toRow),
    [data.meta?.creatives, win],
  );

  const verdictMap = useMemo(() => {
    const m = new Map<string, VerdictRow>();
    for (const r of data.meta?.verdetti ?? []) {
      const v = toVerdict(r);
      m.set(keyOf(v.nome), v);
    }
    return m;
  }, [data.meta?.verdetti]);

  // Righe dell'obiettivo scelto: base per la tabella e per la vista per formato
  const objectiveRows = useMemo(
    () => windowRows.filter((r) => r.obiettivo === (isFan ? "Fan Acquisition" : "App Install")),
    [windowRows, isFan],
  );

  const filtered = useMemo(() => objectiveRows.filter((r) => {
    if (formati.size > 0 && !formati.has(r.formato)) return false;
    if (stato === "active" && r.stato !== "ACTIVE") return false;
    if (verdictFilter && verdictMap.get(keyOf(r.nome))?.verdetto !== verdictFilter) return false;
    return true;
  }), [objectiveRows, formati, stato, verdictFilter, verdictMap]);

  // Ordine predefinito: righe con spesa ≥ soglia per costo crescente, poi le altre per spesa
  const defaultOrder = useMemo(() => {
    const cost = (r: CreativeRow) => { const c = isFan ? r.cpv : r.cpr; return c > 0 ? c : Infinity; };
    const high = filtered.filter((r) => r.spesa >= V_APP.MIN_SPEND).sort((a, b) => cost(a) - cost(b));
    const low = filtered.filter((r) => r.spesa < V_APP.MIN_SPEND).sort((a, b) => b.spesa - a.spesa);
    return [...high, ...low];
  }, [filtered, isFan]);

  const summary = useMemo(() => {
    const spesa = filtered.reduce((s, r) => s + r.spesa, 0);
    const risultato = filtered.reduce((s, r) => s + (isFan ? r.visite : r.reg), 0);
    let spesaScala = 0, spesaSpegni = 0;
    for (const r of filtered) {
      const v = verdictMap.get(keyOf(r.nome))?.verdetto;
      if (v === "SCALA") spesaScala += r.spesa;
      if (v === "SPEGNI") spesaSpegni += r.spesa;
    }
    return {
      count: filtered.length, spesa, risultato,
      costo: risultato > 0 ? spesa / risultato : 0,
      quotaScala: spesa > 0 ? (spesaScala / spesa) * 100 : 0,
      quotaSpegni: spesa > 0 ? (spesaSpegni / spesa) * 100 : 0,
    };
  }, [filtered, isFan, verdictMap]);

  const verdictCounts = useMemo(() => {
    const c = Object.fromEntries(
      (Object.keys(VERDICT_UI) as Verdict[]).map((v) => [v, { count: 0, spesa: 0 }]),
    ) as Record<Verdict, { count: number; spesa: number }>;
    for (const r of filtered) {
      const v = verdictMap.get(keyOf(r.nome))?.verdetto;
      if (v && c[v]) { c[v].count++; c[v].spesa += r.spesa; }
    }
    return c;
  }, [filtered, verdictMap]);

  // Vista per formato ricalcolata sulla finestra corrente, così segue il periodo selezionato
  const byFormat = useMemo(() => {
    const m = new Map<string, { n: number; spesa: number; install: number; reg: number }>();
    for (const r of objectiveRows) {
      const cur = m.get(r.formato) ?? { n: 0, spesa: 0, install: 0, reg: 0 };
      cur.n++; cur.spesa += r.spesa; cur.install += r.install; cur.reg += r.reg;
      m.set(r.formato, cur);
    }
    return [...m.entries()].map(([f, v]) => [f, v.n, v.spesa, v.install, v.reg, v.reg > 0 ? v.spesa / v.reg : 0]);
  }, [objectiveRows]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Creatività · Performance Creative Workflow</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
          Periodo creatività: <strong style={{ color: palette.textMuted }}>{WINDOW_LABEL[win]}</strong>
          {exact
            ? ". "
            : ", la finestra più vicina al periodo selezionato in alto: le creatività sono calcolate su 7, 30 e 90 giorni. "}
          La frequenza è stimata: la reach non è additiva fra ad set.
        </p>
      </div>

      {/* Filtri */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5,
        display: "flex", flexDirection: "column", gap: 8,
        padding: "0.75rem 0.9rem",
        background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <FilterLabel>Obiettivo</FilterLabel>
          <Pill active={!isFan} onClick={() => setObiettivo("app")}>App Install</Pill>
          <Pill active={isFan} onClick={() => setObiettivo("fan")}>Fan Acquisition</Pill>
          <div style={{ flex: 1 }} />
          <FilterLabel>Stato</FilterLabel>
          <Pill active={stato === "active"} onClick={() => setStato("active")}>Attive</Pill>
          <Pill active={stato === "all"} onClick={() => setStato("all")}>Tutte</Pill>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <FilterLabel>Formato</FilterLabel>
          {KNOWN_FORMATS.map((f) => (
            <Pill key={f} active={formati.has(f)} onClick={() => {
              const s = new Set(formati); if (s.has(f)) s.delete(f); else s.add(f); setFormati(s);
            }}>{f}</Pill>
          ))}
          {formati.size > 0 && <button onClick={() => setFormati(new Set())} style={miniBtn(palette)}>× reset</button>}
        </div>
      </div>

      {/* Card riepilogo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <SumCard label={stato === "active" ? "Creatività attive" : "Creatività"} value={integer(summary.count)} />
        <SumCard label="Spesa" value={eur0(summary.spesa)} />
        <SumCard label={isFan ? "Visite profilo" : "Registrazioni"} value={integer(summary.risultato)} />
        <SumCard label={isFan ? "CPV medio" : "CPR medio"} value={summary.risultato > 0 ? eur(summary.costo) : "—"} accent />
        <SumCard label="Quota su SCALA" value={pctStr(summary.quotaScala, 1)}
          tone={summary.quotaScala >= 40 ? "positive" : "neutral"} />
        <SumCard label="Quota su SPEGNI" value={pctStr(summary.quotaSpegni, 1)}
          tone={summary.quotaSpegni >= SPESA_SPEGNI_ALERT_PCT ? "negative" : "neutral"}
          title={summary.quotaSpegni >= SPESA_SPEGNI_ALERT_PCT ? "Quota di spesa su creatività con verdetto Spegni" : undefined} />
      </div>

      {/* Card filtro verdetto */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        {(["SCALA", "FATIGUE IN ARRIVO", "SPEGNI", "OSSERVA", "NUOVA"] as Verdict[]).map((v) => (
          <VerdictFilterCard key={v} verdict={v} count={verdictCounts[v].count} spesa={verdictCounts[v].spesa}
            active={verdictFilter === v} onClick={() => setVerdictFilter(verdictFilter === v ? null : v)} />
        ))}
      </div>

      <CreativeTable
        rows={defaultOrder} isFan={isFan} verdictMap={verdictMap} data={data} win={win}
        verdictFilter={verdictFilter} onClearVerdict={() => setVerdictFilter(null)}
      />

      {!isFan && (
        <Card>
          <CardHeader title="Matrice scala / spegni · frequenza × CPR (invertito)"
            right={<span style={{ fontSize: 11, color: palette.textDim }}>bolla = spesa · CPR ≤ €{num(V_APP.CPR_GOOD, 2)} in alto</span>} />
          <ScalaScatter rows={filtered} verdictMap={verdictMap} />
        </Card>
      )}

      {!isFan && (
        <Card>
          <CardHeader title={`Per formato · CPR e spesa · ${WINDOW_LABEL[win]}`} />
          <MatrixBars rows={byFormat} known={KNOWN_FORMATS as unknown as string[]} palette={palette} />
        </Card>
      )}

      <HookTest rows={filtered} palette={palette} />
    </div>
  );
}

// ─── UI helpers ────────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return <span style={{ fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>{children}</span>;
}

function miniBtn(palette: Palette): React.CSSProperties {
  return {
    padding: "2px 8px", borderRadius: 20, cursor: "pointer",
    border: `1px solid ${palette.cardBorder}`, background: "transparent",
    color: palette.textDim, fontSize: 10, fontWeight: 600, fontFamily: "inherit",
  };
}

function SumCard({ label, value, accent, tone, title }: {
  label: string; value: string; accent?: boolean; tone?: "positive" | "negative" | "neutral"; title?: string;
}) {
  const { palette } = useTheme();
  const color = tone === "negative" ? NEGATIVE : tone === "positive" ? POSITIVE : (accent ? ACCENT : palette.text);
  return (
    <div title={title} style={{
      background: palette.cardBg, border: `1px solid ${palette.cardBorder}`,
      borderRadius: 10, padding: "0.75rem 0.9rem",
      borderLeft: accent || tone === "negative" ? `3px solid ${color}` : `1px solid ${palette.cardBorder}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function VerdictFilterCard({ verdict, count, spesa, active, onClick }: {
  verdict: Verdict; count: number; spesa: number; active: boolean; onClick: () => void;
}) {
  const { palette } = useTheme();
  const m = VERDICT_UI[verdict];
  return (
    <button onClick={onClick} style={{
      textAlign: "left", cursor: "pointer",
      padding: "0.75rem 0.85rem", borderRadius: 10,
      border: `1px solid ${active ? m.color : palette.cardBorder}`,
      background: active ? m.bg : palette.divider,
      color: palette.text, fontFamily: "inherit",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: m.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>{verdict}</span>
      </div>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: palette.text }}>{integer(count)}</p>
      <p style={{ margin: "3px 0 0", fontSize: 10, color: palette.textDim }}>{eur0(spesa)} di spesa</p>
    </button>
  );
}

// ─── Tabella creatività ───────────────────────────────────────────

function CreativeTable({ rows, isFan, verdictMap, data, win, verdictFilter, onClearVerdict }: {
  rows: CreativeRow[]; isFan: boolean; verdictMap: Map<string, VerdictRow>;
  data: MomiData; win: CreativeWindow;
  verdictFilter: Verdict | null; onClearVerdict: () => void;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const [openName, setOpenName] = useState<string | null>(null);

  // Larghezza visibile del contenitore: il pannello di dettaglio resta a vista
  // anche quando la tabella è scrollata in orizzontale.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapWidth(el.clientWidth));
    ro.observe(el);
    setWrapWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const trendOf = (r: CreativeRow) => {
    const v = verdictMap.get(keyOf(r.nome));
    return v && v.cprW30 > 0 && v.cprW7 > 0 ? (v.cprW7 - v.cprW30) / v.cprW30 : null;
  };

  const { sorted, sort, toggle, reset } = useTableSort<CreativeRow>(rows, (r, key): SortValue => {
    const video = isVideoFormat(r.formato);
    switch (key) {
      case "nome": return r.nome;
      case "piatt": return r.piattaforme;
      case "giorni": return r.giorni;
      case "spesa": return r.spesa;
      case "impr": return r.impr;
      case "freq": return r.freq;
      case "ctr": return r.ctr;
      case "cpm": return r.cpm > 0 ? r.cpm : null;
      case "install": return r.install;
      case "cpi": return r.install > 0 ? r.cpi : null;
      case "risultato": return isFan ? r.visite : r.reg;
      case "costo": { const c = isFan ? r.cpv : r.cpr; return c > 0 ? c : null; }
      case "instReg": return r.install > 0 ? r.instRegPct : null;
      case "hook": return video ? r.hookPct : null;
      case "thruplay": return video ? r.thruplayPct : null;
      case "hold": return video ? r.holdPct : null;
      case "trend": return trendOf(r);
      case "verdetto": { const v = verdictMap.get(keyOf(r.nome))?.verdetto; return v ? VERDICT_RANK[v] : null; }
      default: return null;
    }
  });

  // Media sulle righe visibili: costi e tassi dai totali, volumi per riga
  const avg = useMemo(() => {
    const t = { spesa: 0, impr: 0, reach: 0, click: 0, install: 0, reg: 0, visite: 0, v3: 0, tp: 0, imprVideo: 0, p25: 0, p75: 0 };
    for (const r of rows) {
      t.spesa += r.spesa; t.impr += r.impr; t.reach += r.reach; t.click += r.click;
      t.install += r.install; t.reg += r.reg; t.visite += r.visite;
      if (isVideoFormat(r.formato)) { t.v3 += r.video3s; t.tp += r.thruplay; t.imprVideo += r.impr; t.p25 += r.p25; t.p75 += r.p75; }
    }
    return {
      giorni: mean(rows.map((r) => r.giorni)),
      spesa: mean(rows.map((r) => r.spesa)),
      impr: mean(rows.map((r) => r.impr)),
      freq: ratio(t.impr, t.reach),
      ctr: ratio(t.click, t.impr, 100),
      cpm: ratio(t.spesa, t.impr, 1000),
      install: mean(rows.map((r) => r.install)),
      cpi: ratio(t.spesa, t.install),
      risultato: mean(rows.map((r) => (isFan ? r.visite : r.reg))),
      costo: ratio(t.spesa, isFan ? t.visite : t.reg),
      instReg: ratio(t.reg, t.install, 100),
      hook: ratio(t.v3, t.imprVideo, 100),
      thruplay: ratio(t.tp, t.imprVideo, 100),
      hold: ratio(t.p75, t.p25, 100),
    };
  }, [rows, isFan]);

  const costGood = isFan ? V_FAN.CPV_GOOD : V_APP.CPR_GOOD;
  const costHigh = isFan ? V_FAN.CPV_HIGH : V_APP.CPR_HIGH;
  const colCount = isFan ? 15 : 18;
  const th = { sort, onSort: toggle };
  const dash = "—";
  const fmt = (v: number | null, f: (n: number) => string) => (v == null ? dash : f(v));

  return (
    <Card>
      <CardHeader
        title={`Creatività · ${rows.length} inserzioni`}
        right={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sort && <Pill active={false} onClick={reset}>Ordine predefinito</Pill>}
            {verdictFilter && <Pill active={false} onClick={onClearVerdict}>× rimuovi filtro verdetto</Pill>}
          </div>
        }
      />
      {rows.length === 0 ? <EmptyState label="Nessuna creatività coi filtri" /> : (
        <div ref={wrapRef} style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead><tr>
              <SortTh label="Creatività" sortKey="nome" {...th} />
              <SortTh label="Piatt." sortKey="piatt" {...th} />
              <SortTh label="Giorni" sortKey="giorni" align="right" {...th} />
              <SortTh label="Spesa" sortKey="spesa" align="right" {...th} />
              <SortTh label="Impr." sortKey="impr" align="right" {...th} />
              <SortTh label="Freq" sortKey="freq" align="right" title="Frequenza stimata: la reach non è additiva fra ad set" {...th} />
              <SortTh label="CTR" sortKey="ctr" align="right" {...th} />
              <SortTh label="CPM" sortKey="cpm" align="right" first="asc" {...th} />
              {!isFan && <SortTh label="Install" sortKey="install" align="right" {...th} />}
              {!isFan && <SortTh label="CPI" sortKey="cpi" align="right" first="asc" {...th} />}
              <SortTh label={isFan ? "Visite" : "Reg."} sortKey="risultato" align="right" {...th} style={{ fontWeight: 800 }} />
              <SortTh label={isFan ? "CPV" : "CPR"} sortKey="costo" align="right" first="asc" {...th} style={{ fontWeight: 800 }} />
              {!isFan && <SortTh label="Inst→Reg" sortKey="instReg" align="right" {...th} />}
              <SortTh label="Hook" sortKey="hook" align="right" title="Hook rate: video 3s ÷ impression" {...th} />
              <SortTh label="Thruplay" sortKey="thruplay" align="right" {...th} />
              <SortTh label="Hold" sortKey="hold" align="right" title="Hold rate: p75 ÷ p25, quanto trattiene chi aveva agganciato" {...th} />
              <SortTh label="Trend" sortKey="trend" align="right" first="asc" title="CPR ultimi 7 giorni rispetto agli ultimi 30" {...th} />
              <SortTh label="Verdetto" sortKey="verdetto" first="asc" {...th} />
            </tr></thead>
            <tbody>
              <tr style={avgRowStyle(palette)}>
                <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700 }} title={AVG_TITLE}>
                  Media <span style={{ fontWeight: 500, color: palette.textDim }}>· {integer(rows.length)} creatività</span>
                </td>
                <td style={ts.tdBase} />
                <AvgTd ts={ts}>{fmt(avg.giorni, integer)}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.spesa, eur0)}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.impr, integer)}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.freq, (v) => num(v, 2))}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.ctr, (v) => pctStr(v, 2))}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.cpm, eur)}</AvgTd>
                {!isFan && <AvgTd ts={ts}>{fmt(avg.install, integer)}</AvgTd>}
                {!isFan && <AvgTd ts={ts}>{fmt(avg.cpi, eur)}</AvgTd>}
                <AvgTd ts={ts}>{fmt(avg.risultato, integer)}</AvgTd>
                <AvgTd ts={ts} strong>{fmt(avg.costo, eur)}</AvgTd>
                {!isFan && <AvgTd ts={ts}>{fmt(avg.instReg, (v) => pctStr(v, 1))}</AvgTd>}
                <AvgTd ts={ts}>{fmt(avg.hook, (v) => pctStr(v, 1))}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.thruplay, (v) => pctStr(v, 1))}</AvgTd>
                <AvgTd ts={ts}>{fmt(avg.hold, (v) => pctStr(v, 1))}</AvgTd>
                <td style={ts.tdBase} />
                <td style={ts.tdBase} />
              </tr>

              {sorted.map((r) => {
                const v = verdictMap.get(keyOf(r.nome));
                const isVideo = isVideoFormat(r.formato);
                const active = r.stato === "ACTIVE";
                const isOpen = openName === r.nome;
                const trend = trendOf(r);
                const cost = isFan ? r.cpv : r.cpr;
                const toggleOpen = () => setOpenName(isOpen ? null : r.nome);
                return (
                  <FragmentRow key={r.nome}>
                    <tr
                      onClick={toggleOpen}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOpen(); } }}
                      tabIndex={0}
                      aria-expanded={isOpen}
                      style={{
                        cursor: "pointer",
                        background: isOpen ? palette.buttonHover : undefined,
                        opacity: active ? 1 : 0.6,
                      }}
                    >
                      <td style={{ ...ts.tdBase, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: palette.text, fontWeight: 500 }}>
                        <div title={r.nome}>
                          <span style={{ display: "inline-block", width: 12, color: palette.textDim, fontSize: 9 }}>{isOpen ? "▾" : "▸"}</span>
                          {r.nome}
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 3, paddingLeft: 12 }}>
                          <ChipSmall>{r.formato}</ChipSmall>
                        </div>
                      </td>
                      <td style={{ ...ts.tdBase, fontSize: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {r.piattaforme.split(",").map((p) => p.trim()).filter(Boolean).map((p, j) => (
                            <span key={j} style={{ padding: "1px 6px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontWeight: 600 }}>{p}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.giorni)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(r.spesa)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.impr)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.freq >= V_APP.FREQ_HIGH ? "#f59e0b" : ts.tdBase.color }}>{num(r.freq, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctr, 2)}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.cpm)}</td>
                      {!isFan && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.install)}</td>}
                      {!isFan && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.install > 0 ? eur(r.cpi) : dash}</td>}
                      <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}>{integer(isFan ? r.visite : r.reg)}</td>
                      <td style={{
                        ...ts.tdBase, ...ts.tdRight, fontWeight: 700,
                        color: cost === 0 ? ts.tdBase.color : cost <= costGood ? POSITIVE : cost > costHigh ? NEGATIVE : ts.tdBase.color,
                      }}>
                        {cost > 0 ? eur(cost) : dash}
                      </td>
                      {!isFan && <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.instRegPct > 0 && r.instRegPct < V_APP.INST_REG_LOW ? "#f59e0b" : ts.tdBase.color }}>{r.instRegPct > 0 ? pctStr(r.instRegPct, 1) : dash}</td>}
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: isVideo && r.hookPct < V_APP.HOOK_LOW ? "#f59e0b" : ts.tdBase.color }}>{isVideo ? pctStr(r.hookPct, 1) : dash}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight }}>{isVideo ? pctStr(r.thruplayPct, 1) : dash}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: isVideo && r.holdPct < V_APP.HOLD_LOW ? "#f59e0b" : ts.tdBase.color }}>{isVideo ? pctStr(r.holdPct, 1) : dash}</td>
                      <td style={{ ...ts.tdBase, ...ts.tdRight, color: trend != null ? (trend < 0 ? POSITIVE : NEGATIVE) : palette.textDim }}
                          title={trend != null ? `CPR ultimi 7 giorni vs ultimi 30: ${trend > 0 ? "+" : ""}${num(trend * 100, 1)}%` : "Confronto non disponibile"}>
                        {trend != null ? (trend < 0 ? "▼" : "▲") : dash}
                      </td>
                      <td style={ts.tdBase}>
                        {v ? <VerdictBadge verdict={v.verdetto} motivo={v.motivo} /> : dash}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={colCount} style={{ padding: 0, borderBottom: `1px solid ${palette.cardBorder}`, background: palette.divider }}>
                          <div style={{ position: "sticky", left: 0, width: wrapWidth || "100%", boxSizing: "border-box", padding: "14px 16px 16px" }}>
                            <CreativeDetail row={r} data={data} isFan={isFan} win={win} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AvgTd({ ts, strong, children }: { ts: ReturnType<typeof tableStyles>; strong?: boolean; children: React.ReactNode }) {
  return (
    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: strong ? 700 : 600, fontStyle: "italic" }}>{children}</td>
  );
}

function ChipSmall({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return <span style={{ padding: "0px 6px", borderRadius: 20, background: palette.divider, color: palette.textDim, fontSize: 9, fontWeight: 600 }}>{children}</span>;
}

function VerdictBadge({ verdict, motivo }: { verdict: Verdict; motivo?: string }) {
  const m = VERDICT_UI[verdict];
  return (
    <span title={motivo || verdict} style={{
      padding: "2px 8px", borderRadius: 20, background: m.bg, color: m.color,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap",
      border: `1px solid ${m.color}45`, cursor: motivo ? "help" : "default",
    }}>{m.short}</span>
  );
}

// ─── Dettaglio creatività: costo per finestra + numeri delle 3 finestre ──

function CreativeDetail({ row, data, isFan, win }: {
  row: CreativeRow; data: MomiData; isFan: boolean; win: CreativeWindow;
}) {
  const { palette } = useTheme();
  const key = keyOf(row.nome);
  const find = (w: CreativeWindow) => (data.meta?.creatives?.[w]?.rows ?? []).map(toRow).find((r) => keyOf(r.nome) === key);
  // Dal periodo più lungo al più recente: si legge da sinistra a destra
  const windows = (["w90", "w30", "w7"] as CreativeWindow[]).map((w) => ({ w, label: WINDOW_LABEL[w], r: find(w) }));
  const isVideo = isVideoFormat(row.formato);
  const costLabel = isFan ? "CPV" : "CPR";
  const threshold = isFan ? V_FAN.CPV_GOOD : V_APP.CPR_GOOD;

  const chartData = windows.map(({ w, r }) => {
    const risultato = r ? (isFan ? r.visite : r.reg) : 0;
    const costo = r && risultato > 0 ? r.spesa / risultato : null;
    return {
      w, short: w === "w7" ? "7 giorni" : w === "w30" ? "30 giorni" : "90 giorni",
      costo, risultato, spesa: r?.spesa ?? 0, missing: !r,
    };
  });
  const maxCost = Math.max(threshold, ...chartData.map((d) => d.costo ?? 0));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
      <div style={{ background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: "0.8rem 0.9rem" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.text, marginBottom: 2 }}>{costLabel} per finestra</div>
        <div style={{ fontSize: 10, color: palette.textDim, marginBottom: 6, lineHeight: 1.4 }}>
          Finestre cumulative fino all&apos;ultimo aggiornamento: i 7 giorni sono compresi nei 30, i 30 nei 90. In evidenza il periodo selezionato; la linea tratteggiata è la soglia di {eur(threshold)}.
        </div>
        <div style={{ width: "100%", height: 170 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="short" tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false} />
              <YAxis domain={[0, maxCost * 1.25]} tickFormatter={(v) => eur(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={52} />
              <ReferenceLine y={threshold} stroke={palette.textDim} strokeDasharray="4 4" />
              <Tooltip
                cursor={{ fill: palette.buttonHover }}
                content={({ active, payload }) => {
                  const p = active && payload?.[0]?.payload as (typeof chartData)[number] | undefined;
                  if (!p) return null;
                  return (
                    <div style={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, padding: "6px 9px", fontSize: 11, color: palette.text }}>
                      <div style={{ fontWeight: 700, marginBottom: 3 }}>Ultimi {p.short}</div>
                      {p.missing ? <div style={{ color: palette.textDim }}>Creatività non attiva in questa finestra</div> : (
                        <>
                          <div>{costLabel}: <strong>{p.costo != null ? eur(p.costo) : "—"}</strong></div>
                          <div style={{ color: palette.textDim }}>{integer(p.risultato)} {isFan ? "visite" : "registrazioni"} · {eur0(p.spesa)}</div>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="costo" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                {chartData.map((d) => (
                  <Cell key={d.w} fill={ACCENT} fillOpacity={d.w === win ? 1 : 0.4} />
                ))}
                <LabelList dataKey="costo" position="top" formatter={(v: unknown) => (v == null ? "" : eur(Number(v)))}
                  style={{ fill: palette.text, fontSize: 11, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        {windows.map(({ w, label, r }) => (
          <div key={w} style={{
            background: palette.cardBg, borderRadius: 10, padding: "0.75rem 0.8rem",
            border: `1px solid ${w === win ? ACCENT : palette.cardBorder}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: w === win ? ACCENT : palette.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
            {!r ? <div style={{ marginTop: 6, fontSize: 11, color: palette.textDim }}>Non attiva in questa finestra</div> : (
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 6px", fontSize: 11, fontVariantNumeric: "tabular-nums", color: palette.textMuted }}>
                <span style={{ color: palette.textDim }}>Spesa</span><span style={{ fontWeight: 600, color: palette.text }}>{eur0(r.spesa)}</span>
                <span style={{ color: palette.textDim }}>Impr.</span><span>{integer(r.impr)}</span>
                <span style={{ color: palette.textDim }}>Freq.</span><span>{num(r.freq, 2)}</span>
                <span style={{ color: palette.textDim }}>CTR</span><span>{pctStr(r.ctr, 2)}</span>
                {!isFan && <><span style={{ color: palette.textDim }}>Install</span><span>{integer(r.install)}</span></>}
                <span style={{ color: palette.textDim }}>{isFan ? "Visite" : "Reg."}</span><span style={{ fontWeight: 700, color: palette.text }}>{integer(isFan ? r.visite : r.reg)}</span>
                <span style={{ color: palette.textDim }}>{costLabel}</span><span style={{ fontWeight: 700, color: palette.text }}>{(isFan ? r.cpv : r.cpr) > 0 ? eur(isFan ? r.cpv : r.cpr) : "—"}</span>
                {isVideo && <>
                  <span style={{ color: palette.textDim }}>Hook</span><span>{pctStr(r.hookPct, 1)}</span>
                  <span style={{ color: palette.textDim }}>Hold</span><span>{pctStr(r.holdPct, 1)}</span>
                </>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scatter scala/spegni ─────────────────────────────────────────

function ScalaScatter({ rows, verdictMap }: { rows: CreativeRow[]; verdictMap: Map<string, VerdictRow> }) {
  const { palette } = useTheme();
  const points = rows.filter((r) => r.freq > 0 && r.cpr > 0);
  if (points.length === 0) return <EmptyState label="Nessuna creatività con dati sufficienti" />;
  const maxFreq = Math.max(...points.map((r) => r.freq), V_APP.FREQ_HIGH * 1.5);
  const maxCpr = Math.max(...points.map((r) => r.cpr), V_APP.CPR_GOOD * 3);
  const maxSpesa = Math.max(1, ...points.map((r) => r.spesa));
  const enriched = points.map((r) => ({ ...r, verdetto: verdictMap.get(keyOf(r.nome))?.verdetto ?? "OSSERVA" }));
  const groups: Record<string, typeof enriched> = {};
  for (const f of KNOWN_FORMATS) groups[f] = enriched.filter((r) => r.formato === f);

  return (
    <>
      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 50 }}>
            <CartesianGrid stroke={palette.grid} />
            <ReferenceLine x={V_APP.FREQ_HIGH} stroke={palette.textFaint} strokeDasharray="4 4" label={{ value: `Freq ${num(V_APP.FREQ_HIGH, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideTopLeft" }} />
            <ReferenceLine y={V_APP.CPR_GOOD} stroke={palette.textFaint} strokeDasharray="4 4" label={{ value: `CPR €${num(V_APP.CPR_GOOD, 2)}`, fill: palette.textDim, fontSize: 10, position: "insideBottomRight" }} />
            <XAxis type="number" dataKey="freq" domain={[0, maxFreq * 1.05]}
              tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
              label={{ value: "Frequenza →", position: "insideBottom", offset: -8, fill: palette.textDim, fontSize: 11 }} />
            <YAxis type="number" dataKey="cpr" domain={[0, maxCpr * 1.05]} reversed
              tickFormatter={(v) => eur(Number(v))}
              tick={{ fill: palette.axis, fontSize: 11 }} axisLine={{ stroke: palette.cardBorder }} tickLine={false}
              label={{ value: "CPR (invertito) ↑", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }} width={60} />
            <ZAxis type="number" dataKey="spesa" range={[40, Math.max(500, maxSpesa)]} />
            <Tooltip cursor={{ strokeDasharray: "3 3", stroke: palette.textFaint }} content={<ScatterTip />} />
            {KNOWN_FORMATS.map((f, i) => (
              <Scatter key={f} name={f} data={groups[f]} fill={FMT_COLORS[i]} fillOpacity={0.7} stroke={FMT_COLORS[i]} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: palette.textDim, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <span>⬆︎sx <strong style={{ color: POSITIVE }}>Scala</strong></span>
        <span>⬆︎dx <strong style={{ color: "#f59e0b" }}>Fatigue</strong></span>
        <span>⬇︎sx <strong style={{ color: "#0ea5e9" }}>Osserva / Mantieni</strong></span>
        <span>⬇︎dx <strong style={{ color: NEGATIVE }}>Spegni</strong></span>
      </div>
    </>
  );
}

const FMT_COLORS = ["#c85a3f", "#f3eee8", "#8a6d55", "#4a6a8a", "#5f7d63", "#a3735a"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTip({ active, payload }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as CreativeRow & { verdetto: Verdict };
  return (
    <div style={{ background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 8, padding: 10, color: palette.text, fontSize: 11, maxWidth: 280, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.nome}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <ChipSmall>{p.formato}</ChipSmall>
        <VerdictBadge verdict={p.verdetto} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>Spesa</span><span style={{ textAlign: "right" }}>{eur0(p.spesa)}</span>
        <span style={{ color: palette.textDim }}>Reg.</span><span style={{ textAlign: "right" }}>{integer(p.reg)}</span>
        <span style={{ color: palette.textDim }}>CPR</span><span style={{ textAlign: "right", fontWeight: 700 }}>{eur(p.cpr)}</span>
        <span style={{ color: palette.textDim }}>Freq.</span><span style={{ textAlign: "right" }}>{num(p.freq, 2)}</span>
      </div>
    </div>
  );
}

// ─── Per formato ──────────────────────────────────────────────────

function MatrixBars({ rows, known, palette }: { rows: (string | number)[][]; known: string[]; palette: Palette }) {
  // rows: [nome, n, spesa, install, reg, cpr]
  const existing = new Map<string, { spesa: number; n: number; cpr: number }>();
  let totSpesa = 0;
  for (const r of rows) {
    const spesa = Number(r[2]) || 0;
    existing.set(String(r[0]), { spesa, n: Number(r[1]) || 0, cpr: Number(r[5]) || 0 });
    totSpesa += spesa;
  }
  const items = known.map((k) => ({
    nome: k, ...(existing.get(k) ?? { spesa: 0, n: 0, cpr: 0 }),
    quota: totSpesa > 0 ? ((existing.get(k)?.spesa ?? 0) / totSpesa) * 100 : 0,
  }));
  const maxCpr = Math.max(...items.map((i) => i.cpr), V_APP.CPR_GOOD * 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it) => (
        <div key={it.nome} style={{ display: "flex", alignItems: "center", gap: 10, opacity: it.n === 0 ? 0.4 : 1 }}>
          <span style={{ minWidth: 110, fontSize: 12, color: palette.text, fontWeight: 500 }}>{it.nome}</span>
          <div style={{ flex: 1, height: 20, background: palette.divider, borderRadius: 4, overflow: "hidden", position: "relative" }}>
            {it.cpr > 0 && (
              <>
                <div style={{
                  width: `${Math.min(100, (it.cpr / maxCpr) * 100)}%`, height: "100%",
                  background: it.cpr <= V_APP.CPR_GOOD ? POSITIVE : it.cpr >= V_APP.CPR_HIGH ? NEGATIVE : "#f59e0b",
                  transition: "width 0.3s",
                }} />
                <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: palette.text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{eur(it.cpr)}</span>
              </>
            )}
          </div>
          <span style={{ minWidth: 130, textAlign: "right", fontSize: 11, color: palette.textMuted, fontVariantNumeric: "tabular-nums" }}>
            {it.n === 0 ? <em style={{ color: palette.textDim }}>mai testato</em> : `${eur0(it.spesa)} · ${num(it.quota, 1)}% · ${integer(it.n)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Hook test ─────────────────────────────────────────────────────

function HookTest({ rows, palette }: { rows: CreativeRow[]; palette: Palette }) {
  const hookRows = rows.filter((r) => /hook/i.test(r.nome));
  if (hookRows.length === 0) {
    return <Card><CardHeader title="Hook test" /><EmptyState label="Nessun test hook attivo" /></Card>;
  }
  // Raggruppamento per soggetto: token dopo "Video" o "Reel"
  const groups = new Map<string, CreativeRow[]>();
  for (const r of hookRows) {
    const m = r.nome.match(/(?:Video|Reel)\s+(\S+)/i);
    const soggetto = m ? m[1] : "senza soggetto";
    const arr = groups.get(soggetto) ?? [];
    arr.push(r); groups.set(soggetto, arr);
  }
  return (
    <Card>
      <CardHeader title="Hook test · varianti per soggetto" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[...groups.entries()].map(([sogg, list]) => (
          <HookGroupTable key={sogg} soggetto={sogg} rows={list} palette={palette} />
        ))}
      </div>
    </Card>
  );
}

function HookGroupTable({ soggetto, rows, palette }: { soggetto: string; rows: CreativeRow[]; palette: Palette }) {
  const ts = tableStyles(palette);
  const { sorted, sort, toggle } = useTableSort<CreativeRow>(rows, (r, key) => {
    switch (key) {
      case "nome": return r.nome;
      case "hook": return r.hookPct;
      case "thruplay": return r.thruplayPct;
      case "ctr": return r.ctr;
      case "reg": return r.reg;
      case "cpr": return r.cpr > 0 ? r.cpr : null;
      default: return null;
    }
  }, { key: "hook", dir: "desc" });
  const th = { sort, onSort: toggle };

  const t = rows.reduce((a, r) => ({
    impr: a.impr + r.impr, v3: a.v3 + r.video3s, tp: a.tp + r.thruplay,
    click: a.click + r.click, spesa: a.spesa + r.spesa, reg: a.reg + r.reg,
  }), { impr: 0, v3: 0, tp: 0, click: 0, spesa: 0, reg: 0 });
  const avgCell = (v: number | null, f: (n: number) => string) => (v == null ? "—" : f(v));

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Soggetto: {soggetto}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead><tr>
            <SortTh label="Variante" sortKey="nome" {...th} />
            <SortTh label="Hook" sortKey="hook" align="right" {...th} />
            <SortTh label="Thruplay" sortKey="thruplay" align="right" {...th} />
            <SortTh label="CTR" sortKey="ctr" align="right" {...th} />
            <SortTh label="Reg." sortKey="reg" align="right" {...th} />
            <SortTh label="CPR" sortKey="cpr" align="right" first="asc" {...th} />
          </tr></thead>
          <tbody>
            <tr style={avgRowStyle(palette)}>
              <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 700 }} title={AVG_TITLE}>Media</td>
              <AvgTd ts={ts}>{avgCell(ratio(t.v3, t.impr, 100), (v) => pctStr(v, 1))}</AvgTd>
              <AvgTd ts={ts}>{avgCell(ratio(t.tp, t.impr, 100), (v) => pctStr(v, 1))}</AvgTd>
              <AvgTd ts={ts}>{avgCell(ratio(t.click, t.impr, 100), (v) => pctStr(v, 2))}</AvgTd>
              <AvgTd ts={ts}>{avgCell(mean(rows.map((r) => r.reg)), integer)}</AvgTd>
              <AvgTd ts={ts} strong>{avgCell(ratio(t.spesa, t.reg), eur)}</AvgTd>
            </tr>
            {sorted.map((r) => (
              <tr key={r.nome}>
                <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>{r.nome}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.hookPct, 1)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.thruplayPct, 1)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctr, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.reg > 0 ? 600 : 400 }}>{integer(r.reg)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}>{r.cpr > 0 ? eur(r.cpr) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
