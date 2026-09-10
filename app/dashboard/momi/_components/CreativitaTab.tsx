"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, ReferenceLine, ZAxis,
} from "recharts";
import {
  MomiData, useTheme,
  eur, eur0, integer, num, pctStr,
  Card, CardHeader, EmptyState, Pill, tableStyles,
  type Palette,
} from "./shared";
import { ACCENT, CREAM, POSITIVE, NEGATIVE, V_APP, SPESA_SPEGNI_ALERT_PCT, VERDICT_UI, KNOWN_FORMATS, KNOWN_ANGLES, isVideoFormat, type Verdict } from "../config";

type Window = "w7" | "w30" | "w90";
type ObjectiveFilter = "app" | "fan";
type PlatformFilter = "all" | "iOS" | "Android";
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
  nome: string; formato: string; angolo: string; obiettivo: string; piattaforme: string;
  verdetto: Verdict; motivo: string;
  spesaW30: number; cprW30: number; cprW7: number;
  ctrW30: number; ctrW7: number; freqW7: number;
  regW30: number; giorni: number; stato: string;
};

function toVerdict(r: (string | number)[]): VerdictRow {
  return {
    nome: String(r[0] ?? ""), formato: String(r[1] ?? ""), angolo: String(r[2] ?? ""),
    obiettivo: String(r[3] ?? ""), piattaforme: String(r[4] ?? ""),
    verdetto: String(r[5] ?? "OSSERVA") as Verdict, motivo: String(r[6] ?? ""),
    spesaW30: Number(r[7]) || 0, cprW30: Number(r[8]) || 0, cprW7: Number(r[9]) || 0,
    ctrW30: Number(r[10]) || 0, ctrW7: Number(r[11]) || 0, freqW7: Number(r[12]) || 0,
    regW30: Number(r[13]) || 0, giorni: Number(r[14]) || 0, stato: String(r[15] ?? ""),
  };
}

// ══════════════════════════════════════════════════════════════════

export function CreativitaTab({ data }: { data: MomiData }) {
  const { palette } = useTheme();
  const [win, setWin] = useState<Window>("w30");
  const [obiettivo, setObiettivo] = useState<ObjectiveFilter>("app");
  const [piattaforma, setPiattaforma] = useState<PlatformFilter>("all");
  const [formati, setFormati] = useState<Set<string>>(new Set());
  const [angoli, setAngoli] = useState<Set<string>>(new Set());
  const [stato, setStato] = useState<StatoFilter>("active");
  const [verdictFilter, setVerdictFilter] = useState<Verdict | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const objectiveLabel = obiettivo === "app" ? "App Install" : "Fan Acquisition";
  const isFan = obiettivo === "fan";

  // Sorgente righe
  const rawRows = useMemo(() => {
    let src: (string | number)[][];
    if (piattaforma !== "all" && win === "w30") {
      src = (data.meta?.creatives?.by_platform_w30 ?? []).filter((r) => String(r[4]).includes(piattaforma));
    } else {
      src = data.meta?.creatives?.[win]?.rows ?? [];
    }
    return src.map(toRow);
  }, [data.meta?.creatives, win, piattaforma]);

  // Map verdetti per nome
  const verdictMap = useMemo(() => {
    const m = new Map<string, VerdictRow>();
    for (const r of data.meta?.verdetti ?? []) {
      const v = toVerdict(r);
      m.set(v.nome.toLowerCase().trim(), v);
    }
    return m;
  }, [data.meta?.verdetti]);

  // Filtri applicati
  const filtered = useMemo(() => {
    return rawRows.filter((r) => {
      if (isFan) { if (r.obiettivo !== "Fan Acquisition") return false; }
      else { if (r.obiettivo !== "App Install") return false; }
      if (!isFan && piattaforma !== "all" && win !== "w30") {
        if (!r.piattaforme.includes(piattaforma)) return false;
      }
      if (formati.size > 0 && !formati.has(r.formato)) return false;
      if (angoli.size > 0 && !angoli.has(r.angolo)) return false;
      if (stato === "active" && r.stato !== "ACTIVE") return false;
      const v = verdictMap.get(r.nome.toLowerCase().trim());
      if (verdictFilter && v?.verdetto !== verdictFilter) return false;
      return true;
    });
  }, [rawRows, isFan, piattaforma, win, formati, angoli, stato, verdictFilter, verdictMap]);

  // Sort: righe con spesa ≥ 60€ per CPR crescente, poi le altre per spesa desc
  const sorted = useMemo(() => {
    const highSpend = filtered.filter((r) => r.spesa >= V_APP.MIN_SPEND).sort((a, b) => {
      const aC = isFan ? a.cpv : a.cpr;
      const bC = isFan ? b.cpv : b.cpr;
      const aVal = aC > 0 ? aC : Infinity;
      const bVal = bC > 0 ? bC : Infinity;
      return aVal - bVal;
    });
    const lowSpend = filtered.filter((r) => r.spesa < V_APP.MIN_SPEND).sort((a, b) => b.spesa - a.spesa);
    return [...highSpend, ...lowSpend];
  }, [filtered, isFan]);

  // Card riepilogo
  const summary = useMemo(() => {
    const attive = filtered.length;
    const spesa = filtered.reduce((s, r) => s + r.spesa, 0);
    const risultato = filtered.reduce((s, r) => s + (isFan ? r.visite : r.reg), 0);
    const costo = risultato > 0 ? spesa / risultato : 0;
    let spesaScala = 0, spesaSpegni = 0;
    for (const r of filtered) {
      const v = verdictMap.get(r.nome.toLowerCase().trim());
      if (v?.verdetto === "SCALA") spesaScala += r.spesa;
      if (v?.verdetto === "SPEGNI") spesaSpegni += r.spesa;
    }
    return {
      attive, spesa, risultato, costo,
      quotaScala: spesa > 0 ? (spesaScala / spesa) * 100 : 0,
      quotaSpegni: spesa > 0 ? (spesaSpegni / spesa) * 100 : 0,
    };
  }, [filtered, isFan, verdictMap]);

  // Card filtro verdetto
  const verdictCounts = useMemo(() => {
    const c: Record<Verdict, { count: number; spesa: number }> = {
      "SCALA": { count: 0, spesa: 0 },
      "MANTIENI": { count: 0, spesa: 0 },
      "FATIGUE IN ARRIVO": { count: 0, spesa: 0 },
      "SPEGNI": { count: 0, spesa: 0 },
      "OSSERVA": { count: 0, spesa: 0 },
      "NUOVA": { count: 0, spesa: 0 },
    };
    for (const r of filtered) {
      const v = verdictMap.get(r.nome.toLowerCase().trim());
      if (v?.verdetto && c[v.verdetto]) {
        c[v.verdetto].count++;
        c[v.verdetto].spesa += r.spesa;
      }
    }
    return c;
  }, [filtered, verdictMap]);

  const platformDisabled = win !== "w30";
  const selectedRow = selectedName ? sorted.find((r) => r.nome === selectedName) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Creatività · Performance Creative Workflow</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
          Le viste creatività usano finestre fisse del motore: 7, 30 e 90 giorni. La frequenza è stimata: la reach non è additiva fra ad set.
        </p>
      </div>

      {/* Filtri sticky */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5,
        display: "flex", flexDirection: "column", gap: 8,
        padding: "0.75rem 0.9rem",
        background: palette.cardBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 12,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <FilterLabel>Obiettivo</FilterLabel>
          <Pill active={obiettivo === "app"} onClick={() => setObiettivo("app")}>App Install</Pill>
          <Pill active={obiettivo === "fan"} onClick={() => { setObiettivo("fan"); setPiattaforma("all"); }}>Fan Acquisition</Pill>
          {!isFan && (
            <>
              <FilterLabel>Piattaforma</FilterLabel>
              <Pill active={piattaforma === "all"} onClick={() => setPiattaforma("all")}>Tutte</Pill>
              <Pill active={piattaforma === "iOS"} onClick={() => setPiattaforma("iOS")}>iOS</Pill>
              <Pill active={piattaforma === "Android"} onClick={() => setPiattaforma("Android")}>Android</Pill>
              {platformDisabled && piattaforma !== "all" && (
                <span title="Il filtro piattaforma richiede la finestra 30g" style={{ fontSize: 10, color: "#f59e0b" }}>
                  ⓘ solo w30
                </span>
              )}
            </>
          )}
          <div style={{ flex: 1 }} />
          <FilterLabel>Stato</FilterLabel>
          <Pill active={stato === "active"} onClick={() => setStato("active")}>Attive</Pill>
          <Pill active={stato === "all"} onClick={() => setStato("all")}>Tutte</Pill>
          <FilterLabel>Finestra</FilterLabel>
          <Pill active={win === "w7"} onClick={() => setWin("w7")}>7g</Pill>
          <Pill active={win === "w30"} onClick={() => setWin("w30")}>30g</Pill>
          <Pill active={win === "w90"} onClick={() => setWin("w90")}>90g</Pill>
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
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <FilterLabel>Angolo</FilterLabel>
          {KNOWN_ANGLES.map((a) => (
            <Pill key={a} active={angoli.has(a)} onClick={() => {
              const s = new Set(angoli); if (s.has(a)) s.delete(a); else s.add(a); setAngoli(s);
            }}>{a}</Pill>
          ))}
          {angoli.size > 0 && <button onClick={() => setAngoli(new Set())} style={miniBtn(palette)}>× reset</button>}
        </div>
      </div>

      {/* Card riepilogo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <SumCard label="Creatività attive" value={integer(summary.attive)} />
        <SumCard label="Spesa" value={eur0(summary.spesa)} />
        <SumCard label={isFan ? "Visite profilo" : "Registrazioni"} value={integer(summary.risultato)} />
        <SumCard label={isFan ? "CPV medio" : "CPR medio"} value={summary.risultato > 0 ? eur(summary.costo) : "—"} accent />
        <SumCard label="Quota su SCALA" value={pctStr(summary.quotaScala, 1)}
          tone={summary.quotaScala >= 40 ? "positive" : "neutral"} />
        <SumCard label="Quota su SPEGNI" value={pctStr(summary.quotaSpegni, 1)}
          tone={summary.quotaSpegni >= SPESA_SPEGNI_ALERT_PCT ? "negative" : "neutral"}
          title={summary.quotaSpegni >= SPESA_SPEGNI_ALERT_PCT ? "Stai pagando creatività che dovresti aver spento" : undefined} />
      </div>

      {/* Card filtro verdetto */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        {(["SCALA", "FATIGUE IN ARRIVO", "SPEGNI", "OSSERVA", "NUOVA"] as Verdict[]).map((v) => (
          <VerdictFilterCard key={v} verdict={v} count={verdictCounts[v].count} spesa={verdictCounts[v].spesa}
            active={verdictFilter === v} onClick={() => setVerdictFilter(verdictFilter === v ? null : v)} />
        ))}
      </div>

      {/* Tabella creatività */}
      <Card>
        <CardHeader title={`Creatività · ${sorted.length} inserzioni`}
          right={verdictFilter && <Pill active={false} onClick={() => setVerdictFilter(null)}>× rimuovi filtro verdetto</Pill>} />
        {sorted.length === 0 ? <EmptyState label="Nessuna creatività coi filtri" /> : (
          <CreativeTable rows={sorted} isFan={isFan} verdictMap={verdictMap}
            onSelect={setSelectedName} selectedName={selectedName} />
        )}
      </Card>

      {selectedRow && (
        <CreativeDetail row={selectedRow} data={data} onClose={() => setSelectedName(null)} isFan={isFan} />
      )}

      {/* Matrice scala/spegni (solo App Install) */}
      {!isFan && (
        <Card>
          <CardHeader title="Matrice scala / spegni · frequenza × CPR (invertito)"
            right={<span style={{ fontSize: 11, color: palette.textDim }}>bolla = spesa · CPR ≤ €{num(V_APP.CPR_GOOD, 2)} in alto</span>} />
          <ScalaScatter rows={filtered} verdictMap={verdictMap} />
        </Card>
      )}

      {/* Per formato + per angolo (solo App Install) */}
      {!isFan && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
          <Card>
            <CardHeader title="Per formato · CPR e spesa" />
            <MatrixBars rows={data.meta?.matrix?.by_format ?? []} known={KNOWN_FORMATS as unknown as string[]} palette={palette} />
          </Card>
          <Card>
            <CardHeader title="Per angolo · CPR e spesa" />
            <MatrixBars rows={data.meta?.matrix?.by_angle ?? []} known={KNOWN_ANGLES as unknown as string[]} palette={palette} />
          </Card>
        </div>
      )}

      {/* Heatmap piattaforma × angolo */}
      {!isFan && (
        <Card>
          <CardHeader title="Heatmap piattaforma × angolo · CPR" />
          <PlatformAngleHeatmap rows={data.meta?.matrix?.by_platform_angle ?? []} palette={palette} />
        </Card>
      )}

      {/* Matrice formato × angolo con celle "mai testato" */}
      {!isFan && (
        <Card>
          <CardHeader title="Formato × Angolo · combinazioni testate e da testare" />
          <FormatoAngoloMatrix rows={data.meta?.matrix?.by_format_angle ?? []} palette={palette} />
        </Card>
      )}

      {/* Card da produrre */}
      {!isFan && (
        <ProduzioneCard rows={data.meta?.matrix?.by_format_angle ?? []} palette={palette} />
      )}

      {/* Hook test */}
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
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
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
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: palette.text, fontVariantNumeric: "tabular-nums" }}>{integer(count)}</p>
      <p style={{ margin: "3px 0 0", fontSize: 10, color: palette.textDim }}>{eur0(spesa)} di spesa</p>
    </button>
  );
}

// ─── Tabella creatività ───────────────────────────────────────────

function CreativeTable({ rows, isFan, verdictMap, onSelect, selectedName }: {
  rows: CreativeRow[]; isFan: boolean; verdictMap: Map<string, VerdictRow>;
  onSelect: (nome: string) => void; selectedName: string | null;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead><tr>
          <th style={ts.th}>Creatività</th>
          <th style={ts.th}>Piatt.</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Ad set</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Giorni</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Impr.</th>
          <th style={{ ...ts.th, ...ts.thRight }} title="Frequenza stimata: la reach non è additiva fra ad set">Freq</th>
          <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
          <th style={{ ...ts.th, ...ts.thRight }}>CPM</th>
          {!isFan && <th style={{ ...ts.th, ...ts.thRight }}>Install</th>}
          {!isFan && <th style={{ ...ts.th, ...ts.thRight }}>CPI</th>}
          <th style={{ ...ts.th, ...ts.thRight, fontWeight: 700 }}>{isFan ? "Visite" : "Reg."}</th>
          <th style={{ ...ts.th, ...ts.thRight, fontWeight: 700 }}>{isFan ? "CPV" : "CPR"}</th>
          {!isFan && <th style={{ ...ts.th, ...ts.thRight }}>Inst→Reg</th>}
          <th style={{ ...ts.th, ...ts.thRight }} title="Hook rate: video 3s ÷ impression">Hook</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Thruplay</th>
          <th style={{ ...ts.th, ...ts.thRight }} title="Hold rate: p75 ÷ p25, quanto trattiene chi aveva agganciato">Hold</th>
          <th style={{ ...ts.th, ...ts.thRight }}>Trend</th>
          <th style={ts.th}>Verdetto</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const v = verdictMap.get(r.nome.toLowerCase().trim());
            const isVideo = isVideoFormat(r.formato);
            const active = r.stato === "ACTIVE";
            const isSelected = selectedName === r.nome;
            const trend = v && v.cprW30 > 0 && v.cprW7 > 0 ? (v.cprW7 - v.cprW30) / v.cprW30 : null;
            return (
              <tr key={i} onClick={() => onSelect(r.nome)} style={{
                cursor: "pointer",
                background: isSelected ? palette.buttonHover : undefined,
                opacity: active ? 1 : 0.6,
              }}>
                <td style={{ ...ts.tdBase, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: palette.text, fontWeight: 500 }}>
                  <div title={r.nome}>{r.nome}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                    <ChipSmall>{r.formato}</ChipSmall>
                    <ChipSmall>{r.angolo}</ChipSmall>
                  </div>
                </td>
                <td style={{ ...ts.tdBase, fontSize: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {r.piattaforme.split(",").map((p) => p.trim()).filter(Boolean).map((p, j) => (
                      <span key={j} style={{ padding: "1px 6px", borderRadius: 20, background: palette.divider, color: palette.textMuted, fontWeight: 600 }}>{p}</span>
                    ))}
                  </div>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.n_adset)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.giorni)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 600 }}>{eur0(r.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.impr)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.freq >= V_APP.FREQ_HIGH ? "#f59e0b" : ts.tdBase.color }}>{num(r.freq, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctr, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.cpm)}</td>
                {!isFan && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.install)}</td>}
                {!isFan && <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.install > 0 ? eur(r.cpi) : "—"}</td>}
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700 }}>{integer(isFan ? r.visite : r.reg)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: (() => {
                  const c = isFan ? r.cpv : r.cpr;
                  if (c === 0) return ts.tdBase.color;
                  if (isFan) return c <= 0.05 ? POSITIVE : c > 0.15 ? NEGATIVE : ts.tdBase.color;
                  return c <= V_APP.CPR_GOOD ? POSITIVE : c > V_APP.CPR_HIGH ? NEGATIVE : ts.tdBase.color;
                })() }}>
                  {(isFan ? r.cpv : r.cpr) > 0 ? eur(isFan ? r.cpv : r.cpr) : "—"}
                </td>
                {!isFan && <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.instRegPct > 0 && r.instRegPct < V_APP.INST_REG_LOW ? "#f59e0b" : ts.tdBase.color }}>{r.instRegPct > 0 ? pctStr(r.instRegPct, 1) : "—"}</td>}
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: isVideo && r.hookPct < V_APP.HOOK_LOW ? "#f59e0b" : ts.tdBase.color }}>{isVideo ? pctStr(r.hookPct, 1) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{isVideo ? pctStr(r.thruplayPct, 1) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: isVideo && r.holdPct < V_APP.HOLD_LOW ? "#f59e0b" : ts.tdBase.color }}>{isVideo ? pctStr(r.holdPct, 1) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: trend != null ? (trend < 0 ? POSITIVE : NEGATIVE) : palette.textDim, fontVariantNumeric: "tabular-nums" }}
                    title={trend != null ? `CPR w7 vs w30: ${trend > 0 ? "+" : ""}${num(trend * 100, 1)}%` : "confronto non disponibile"}>
                  {trend != null ? (trend < 0 ? "▼" : "▲") : "—"}
                </td>
                <td style={ts.tdBase}>
                  {v ? <VerdictBadge verdict={v.verdetto} motivo={v.motivo} /> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

// ─── Pannello dettaglio (3 finestre affiancate) ──────────────────

function CreativeDetail({ row, data, onClose, isFan }: {
  row: CreativeRow; data: MomiData; onClose: () => void; isFan: boolean;
}) {
  const { palette } = useTheme();
  const key = row.nome.toLowerCase().trim();
  const w7 = (data.meta?.creatives?.w7?.rows ?? []).map(toRow).find((r) => r.nome.toLowerCase().trim() === key);
  const w30 = (data.meta?.creatives?.w30?.rows ?? []).map(toRow).find((r) => r.nome.toLowerCase().trim() === key);
  const w90 = (data.meta?.creatives?.w90?.rows ?? []).map(toRow).find((r) => r.nome.toLowerCase().trim() === key);
  const windows = [{ key: "w7", label: "7 giorni", r: w7 }, { key: "w30", label: "30 giorni", r: w30 }, { key: "w90", label: "90 giorni", r: w90 }];
  const isVideo = isVideoFormat(row.formato);
  return (
    <Card>
      <CardHeader title={`Dettaglio · ${row.nome}`}
        right={<button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: palette.textDim, fontFamily: "inherit" }}>×</button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {windows.map((w) => (
          <div key={w.key} style={{ background: palette.divider, borderRadius: 10, padding: "0.85rem 1rem" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{w.label}</div>
            {!w.r ? <div style={{ marginTop: 6, fontSize: 12, color: palette.textDim }}>Nessun dato in questa finestra</div> : (
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", gap: "3px 8px", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                <span style={{ color: palette.textDim }}>Spesa</span><span style={{ fontWeight: 600 }}>{eur0(w.r.spesa)}</span>
                <span style={{ color: palette.textDim }}>Impr.</span><span>{integer(w.r.impr)}</span>
                <span style={{ color: palette.textDim }}>Freq.</span><span>{num(w.r.freq, 2)}</span>
                <span style={{ color: palette.textDim }}>CTR</span><span>{pctStr(w.r.ctr, 2)}</span>
                <span style={{ color: palette.textDim }}>{isFan ? "Visite" : "Install"}</span><span>{integer(isFan ? w.r.visite : w.r.install)}</span>
                <span style={{ color: palette.textDim }}>{isFan ? "CPV" : "CPI"}</span><span>{(isFan ? w.r.cpv : w.r.cpi) > 0 ? eur(isFan ? w.r.cpv : w.r.cpi) : "—"}</span>
                <span style={{ color: palette.textDim, fontWeight: 700 }}>{isFan ? "Visite" : "Reg."}</span><span style={{ fontWeight: 700 }}>{integer(isFan ? w.r.visite : w.r.reg)}</span>
                <span style={{ color: palette.textDim, fontWeight: 700 }}>{isFan ? "CPV" : "CPR"}</span><span style={{ fontWeight: 700 }}>{(isFan ? w.r.cpv : w.r.cpr) > 0 ? eur(isFan ? w.r.cpv : w.r.cpr) : "—"}</span>
                {isVideo && <>
                  <span style={{ color: palette.textDim }}>Hook</span><span>{pctStr(w.r.hookPct, 1)}</span>
                  <span style={{ color: palette.textDim }}>Thruplay</span><span>{pctStr(w.r.thruplayPct, 1)}</span>
                  <span style={{ color: palette.textDim }}>Hold</span><span>{pctStr(w.r.holdPct, 1)}</span>
                </>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
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
  const enriched = points.map((r) => ({ ...r, verdetto: verdictMap.get(r.nome.toLowerCase().trim())?.verdetto ?? "OSSERVA" }));
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
        <ChipSmall>{p.angolo}</ChipSmall>
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

// ─── Matrix bars (per formato / per angolo) ──────────────────────

function MatrixBars({ rows, known, palette }: { rows: (string | number)[][]; known: string[]; palette: Palette }) {
  // rows: [nome, n, spesa, install, reg, cpr]
  const existing = new Map<string, { spesa: number; n: number; cpr: number }>();
  let totSpesa = 0;
  for (const r of rows) {
    const nome = String(r[0]);
    const n = Number(r[1]) || 0;
    const spesa = Number(r[2]) || 0;
    const cpr = Number(r[5]) || 0;
    existing.set(nome, { spesa, n, cpr });
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
          <span style={{ minWidth: 140, fontSize: 12, color: palette.text, fontWeight: 500 }}>{it.nome}</span>
          <div style={{ flex: 1, height: 20, background: palette.divider, borderRadius: 4, overflow: "hidden", position: "relative" }}>
            {it.cpr > 0 && (
              <>
                <div style={{
                  width: `${Math.min(100, (it.cpr / maxCpr) * 100)}%`,
                  height: "100%",
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

// ─── Heatmap piattaforma × angolo ─────────────────────────────────

function PlatformAngleHeatmap({ rows, palette }: { rows: (string | number)[][]; palette: Palette }) {
  // rows: [piattaforma, angolo, n, spesa, reg, cpr]
  const platforms = Array.from(new Set(rows.map((r) => String(r[0])))).sort();
  const angoli = Array.from(new Set(rows.map((r) => String(r[1])))).sort();
  const map = new Map<string, { n: number; spesa: number; cpr: number }>();
  let minCpr = Infinity, maxCpr = 0;
  for (const r of rows) {
    const key = String(r[0]) + "|" + String(r[1]);
    const cpr = Number(r[5]) || 0;
    const n = Number(r[2]) || 0;
    const spesa = Number(r[3]) || 0;
    map.set(key, { n, spesa, cpr });
    if (cpr > 0) { if (cpr < minCpr) minCpr = cpr; if (cpr > maxCpr) maxCpr = cpr; }
  }
  if (rows.length === 0) return <EmptyState />;
  const colorFor = (cpr: number) => {
    if (cpr === 0) return palette.divider;
    if (cpr <= V_APP.CPR_GOOD) return "rgba(34,197,94,0.35)";
    if (cpr >= V_APP.CPR_HIGH) return "rgba(239,68,68,0.35)";
    return "rgba(245,158,11,0.30)";
  };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 11, color: palette.text }}>
        <thead>
          <tr>
            <th></th>
            {angoli.map((a) => <th key={a} style={{ padding: "4px 8px", textAlign: "center", color: palette.textDim, fontWeight: 600 }}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {platforms.map((p) => (
            <tr key={p}>
              <td style={{ padding: "4px 8px", fontWeight: 700, color: palette.text }}>{p}</td>
              {angoli.map((a) => {
                const cell = map.get(p + "|" + a);
                return (
                  <td key={a} style={{
                    padding: "8px 10px", borderRadius: 6, minWidth: 80,
                    background: cell ? colorFor(cell.cpr) : palette.divider,
                    textAlign: "center", opacity: cell ? 1 : 0.3,
                  }}>
                    {cell ? (
                      <>
                        <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{cell.cpr > 0 ? eur(cell.cpr) : "—"}</div>
                        <div style={{ fontSize: 9, color: palette.textDim, marginTop: 2 }}>{integer(cell.n)} cr.</div>
                      </>
                    ) : <span style={{ fontSize: 9, fontStyle: "italic" }}>—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Matrice formato × angolo (con celle "mai testato") ─────────

function FormatoAngoloMatrix({ rows, palette }: { rows: (string | number)[][]; palette: Palette }) {
  const map = new Map<string, { n: number; spesa: number; reg: number; cpr: number }>();
  for (const r of rows) {
    const key = String(r[0]) + "|" + String(r[1]);
    map.set(key, {
      n: Number(r[2]) || 0, spesa: Number(r[3]) || 0,
      reg: Number(r[4]) || 0, cpr: Number(r[5]) || 0,
    });
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 4, fontSize: 11, color: palette.text }}>
        <thead>
          <tr>
            <th></th>
            {KNOWN_ANGLES.map((a) => <th key={a} style={{ padding: "4px 6px", textAlign: "center", color: palette.textDim, fontWeight: 600 }}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {KNOWN_FORMATS.map((f) => (
            <tr key={f}>
              <td style={{ padding: "4px 8px", fontWeight: 700, color: palette.text }}>{f}</td>
              {KNOWN_ANGLES.map((a) => {
                const cell = map.get(f + "|" + a);
                if (!cell) {
                  return (
                    <td key={a} style={{
                      padding: "8px 10px", borderRadius: 6, minWidth: 90,
                      border: `1px dashed ${palette.cardBorder}`, background: "transparent",
                      textAlign: "center", color: palette.textFaint, fontSize: 9, fontStyle: "italic",
                    }}>mai testato</td>
                  );
                }
                const bg = cell.cpr <= V_APP.CPR_GOOD ? "rgba(34,197,94,0.20)" : cell.cpr >= V_APP.CPR_HIGH ? "rgba(239,68,68,0.20)" : "rgba(245,158,11,0.15)";
                return (
                  <td key={a} style={{ padding: "8px 10px", borderRadius: 6, minWidth: 90, background: bg, textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{cell.cpr > 0 ? eur(cell.cpr) : "—"}</div>
                    <div style={{ fontSize: 9, color: palette.textDim, marginTop: 2 }}>{integer(cell.n)} cr · {eur0(cell.spesa)}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card "Da produrre" ────────────────────────────────────────────

function ProduzioneCard({ rows, palette }: { rows: (string | number)[][]; palette: Palette }) {
  // Replicare: top 3 combinazioni con spesa ≥ 100 e miglior CPR
  const testate = rows.map((r) => ({
    formato: String(r[0]), angolo: String(r[1]),
    n: Number(r[2]) || 0, spesa: Number(r[3]) || 0,
    reg: Number(r[4]) || 0, cpr: Number(r[5]) || 0,
  }));
  const replicare = testate
    .filter((t) => t.spesa >= 100 && t.cpr > 0)
    .sort((a, b) => a.cpr - b.cpr)
    .slice(0, 3);
  // Testate set for lookup
  const testedSet = new Set(testate.map((t) => t.formato + "|" + t.angolo));
  // Testare: combinazioni mai testate che condividono formato o angolo con una vincente
  const vincenti = replicare;
  const toTest: { formato: string; angolo: string; motivo: string }[] = [];
  for (const v of vincenti) {
    // stesso formato, angoli non testati
    for (const a of KNOWN_ANGLES) {
      const k = v.formato + "|" + a;
      if (!testedSet.has(k) && !toTest.some((t) => t.formato === v.formato && t.angolo === a)) {
        toTest.push({ formato: v.formato, angolo: a, motivo: `${v.formato} · ${v.angolo} funziona (CPR ${eur(v.cpr)})` });
        if (toTest.length >= 3) break;
      }
    }
    if (toTest.length >= 3) break;
    // stesso angolo, formati non testati
    for (const f of KNOWN_FORMATS) {
      const k = f + "|" + v.angolo;
      if (!testedSet.has(k) && !toTest.some((t) => t.formato === f && t.angolo === v.angolo)) {
        toTest.push({ formato: f, angolo: v.angolo, motivo: `${v.formato} · ${v.angolo} funziona (CPR ${eur(v.cpr)})` });
        if (toTest.length >= 3) break;
      }
    }
    if (toTest.length >= 3) break;
  }
  return (
    <Card>
      <CardHeader title="Da produrre · replicare e testare" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: POSITIVE, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Replicare (top 3)</div>
          {replicare.length === 0 ? <EmptyState label="Servono combinazioni con spesa ≥ 100 €" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {replicare.map((r, i) => (
                <div key={i} style={{ padding: "0.6rem 0.85rem", background: palette.divider, borderLeft: `3px solid ${POSITIVE}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>{r.formato} · {r.angolo}</div>
                  <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>CPR <strong style={{ color: POSITIVE }}>{eur(r.cpr)}</strong> · {integer(r.reg)} reg · {eur0(r.spesa)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Testare (top 3 mai provate)</div>
          {toTest.length === 0 ? <EmptyState label="Nessuna combinazione affine da testare" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {toTest.map((t, i) => (
                <div key={i} style={{ padding: "0.6rem 0.85rem", background: palette.divider, borderLeft: `3px solid ${ACCENT}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>{t.formato} · {t.angolo}</div>
                  <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>{t.motivo}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
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
  const ts = tableStyles(palette);
  return (
    <Card>
      <CardHeader title="Hook test · varianti per soggetto" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[...groups.entries()].map(([sogg, list]) => (
          <div key={sogg}>
            <div style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Soggetto: {sogg}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={ts.table}>
                <thead><tr>
                  <th style={ts.th}>Variante</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Hook</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Thruplay</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>Reg.</th>
                  <th style={{ ...ts.th, ...ts.thRight }}>CPR</th>
                </tr></thead>
                <tbody>
                  {list.sort((a, b) => b.hookPct - a.hookPct).map((r, i) => (
                    <tr key={i}>
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
        ))}
      </div>
    </Card>
  );
}
