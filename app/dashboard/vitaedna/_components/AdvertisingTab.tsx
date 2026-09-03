"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ZAxis,
} from "recharts";
import {
  DashboardData, BlendedWindow, calcDelta, eur, eur0, integer, num, pctStr, NEGATIVE,
  Card, CardHeader, SectionTitle, EmptyState, Pill, tableStyles, useTheme,
} from "./shared";

type SubTab = "gads" | "meta";
type MetaWindow = "w7" | "w30";
type CreativesWindow = "w7" | "w30" | "w90";

// Soglie usate in tutta la sezione (matrice ROAS×freq + verdetti operativi)
const CFG = {
  ROAS_GOOD: 2.0,      // ROAS "salubre"
  FREQ_HIGH: 2.6,      // frequenza oltre cui c'è fatica creativa
  MIN_SPEND: 100,      // spesa minima w30 per un verdetto affidabile (€)
  CTR_DROP: 0.20,      // -20% CTR w7 vs w30 = segnale di fatica
} as const;

const ROAS_THRESHOLD = CFG.ROAS_GOOD;
const FREQ_THRESHOLD = CFG.FREQ_HIGH;

// ─── Verdetti creatività ──────────────────────────────────────────

type Verdict = "scala" | "fatigue" | "spegni" | "osserva" | "mantieni";

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; description: string }> = {
  scala:     { label: "Scala",              color: "#22c55e", bg: "rgba(34,197,94,0.15)",  description: "Performance solida e pubblico non saturo: può reggere più budget" },
  fatigue:   { label: "Fatigue in arrivo",  color: "#f59e0b", bg: "rgba(245,158,11,0.15)", description: "Funziona ma sta perdendo efficacia: preparare il ricambio creativo ora" },
  spegni:    { label: "Spegni",             color: "#ef4444", bg: "rgba(239,68,68,0.15)",  description: "Spreco: costa e non produce" },
  osserva:   { label: "Osserva",            color: "#94a3b8", bg: "rgba(148,163,184,0.18)", description: "Dati insufficienti per giudicare" },
  mantieni:  { label: "Mantieni",           color: "#64CBFF", bg: "rgba(100,203,255,0.15)", description: "Performance nella norma: lasciare invariato" },
};

// Row raw: [nome, stato, spesa, imp, reach, freq, click, ctr, cpm, cpc, acquisti, valore, cpa, roas, lpv, atc]
type CreativeMetrics = {
  name: string;
  stato: string;
  spesa: number; imp: number; reach: number; freq: number;
  click: number; ctr: number; cpm: number; cpc: number;
  acquisti: number; valore: number; cpa: number; roas: number;
  lpv: number; atc: number;
};

function toMetrics(r: (string | number)[]): CreativeMetrics {
  return {
    name: String(r[0] ?? ""),
    stato: String(r[1] ?? ""),
    spesa: Number(r[2]) || 0,
    imp: Number(r[3]) || 0,
    reach: Number(r[4]) || 0,
    freq: Number(r[5]) || 0,
    click: Number(r[6]) || 0,
    ctr: Number(r[7]) || 0,
    cpm: Number(r[8]) || 0,
    cpc: Number(r[9]) || 0,
    acquisti: Number(r[10]) || 0,
    valore: Number(r[11]) || 0,
    cpa: Number(r[12]) || 0,
    roas: Number(r[13]) || 0,
    lpv: Number(r[14]) || 0,
    atc: Number(r[15]) || 0,
  };
}

function computeVerdict(w30: CreativeMetrics, w7: CreativeMetrics | undefined): { verdict: Verdict; reason: string } {
  const roas = w30.roas;
  const spesa = w30.spesa;
  const acquisti = w30.acquisti;

  // SPEGNI (priorità massima)
  if (spesa >= CFG.MIN_SPEND && acquisti === 0) {
    return { verdict: "spegni", reason: `Spesa ${eur(spesa)} con 0 acquisti in 30g` };
  }
  if (roas > 0 && roas < 1) {
    return { verdict: "spegni", reason: `ROAS 30g ${num(roas, 2)} sotto 1,0` };
  }

  // OSSERVA (dati insufficienti)
  if (spesa < CFG.MIN_SPEND) {
    return { verdict: "osserva", reason: `Spesa ${eur(spesa)} sotto ${eur(CFG.MIN_SPEND)}: dati insufficienti per giudicare` };
  }

  // Fasce successive: spesa ≥ 100 e ROAS ≥ 1
  if (roas >= CFG.ROAS_GOOD) {
    const freqW7 = w7?.freq ?? 0;
    const ctrW7 = w7?.ctr ?? 0;
    const ctrW30 = w30.ctr;
    const ctrDropRatio = ctrW30 > 0 ? ctrW7 / ctrW30 : 1;

    // FATIGUE IN ARRIVO
    if (freqW7 >= CFG.FREQ_HIGH) {
      return { verdict: "fatigue", reason: `Frequenza w7 ${num(freqW7, 2)} sopra ${num(CFG.FREQ_HIGH, 1)}: pubblico saturo` };
    }
    if (w7 && ctrW30 > 0 && ctrDropRatio < 1 - CFG.CTR_DROP) {
      const dropPct = (1 - ctrDropRatio) * 100;
      return { verdict: "fatigue", reason: `CTR w7 ${pctStr(ctrW7 * 100, 2)} vs ${pctStr(ctrW30 * 100, 2)} media 30g (−${num(dropPct, 0)}%)` };
    }

    // SCALA
    if (w7 && freqW7 < CFG.FREQ_HIGH && ctrW7 >= ctrW30) {
      const parts = [`ROAS ${num(roas, 2)}`, `freq w7 ${num(freqW7, 2)}`];
      if (ctrW7 > ctrW30) {
        const gain = ctrW30 > 0 ? ((ctrW7 / ctrW30) - 1) * 100 : 0;
        parts.push(`CTR w7 +${num(gain, 0)}% vs 30g`);
      } else {
        parts.push("CTR stabile");
      }
      return { verdict: "scala", reason: parts.join(" · ") };
    }
  }

  return { verdict: "mantieni", reason: `ROAS 30g ${num(roas, 2)} · performance nella norma` };
}

export function AdvertisingTab({ data }: { data: DashboardData }) {
  const [sub, setSub] = useState<SubTab>("gads");
  const b30 = data.blended?.w30;
  const bP30 = data.blended?.p30;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub="Panorama investimenti e performance creatività">Advertising</SectionTitle>

      <Card>
        <BlendedHeader b30={b30} bP30={bP30} />
      </Card>

      <div style={{ display: "flex", gap: 8 }}>
        <SubtabBtn active={sub === "gads"} onClick={() => setSub("gads")}>Google Ads</SubtabBtn>
        <SubtabBtn active={sub === "meta"} onClick={() => setSub("meta")}>Meta</SubtabBtn>
      </div>

      {sub === "gads" ? <GoogleAdsView data={data} /> : <MetaView data={data} />}
    </div>
  );
}

function BlendedHeader({ b30, bP30 }: { b30: BlendedWindow | undefined; bP30: BlendedWindow | undefined }) {
  const { palette } = useTheme();
  if (!b30) return <EmptyState label="Dati blended non disponibili" />;
  const totale = b30.spend_total ?? 0;
  const meta = b30.spend_meta ?? 0;
  const gads = b30.spend_gads ?? 0;
  const metaPct = totale > 0 ? (meta / totale) * 100 : 0;
  const gadsPct = totale > 0 ? (gads / totale) * 100 : 0;
  const deltaTotale = calcDelta(totale, bP30?.spend_total);
  const deltaMer = calcDelta(b30.mer, bP30?.mer);

  return (
    <div>
      <CardHeader title="Blended · Ultimi 30 giorni" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
        <div>
          <Label>Spesa totale</Label>
          <Big>{eur(totale)}</Big>
          {deltaTotale && <Delta info={deltaTotale}>vs periodo precedente</Delta>}
        </div>
        <div>
          <Label>Meta / Google</Label>
          <Big>
            <span style={{ color: "#4267B2" }}>{pctStr(metaPct, 1)}</span>
            <span style={{ color: palette.textFaint, margin: "0 8px" }}>·</span>
            <span style={{ color: "#DB4437" }}>{pctStr(gadsPct, 1)}</span>
          </Big>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: palette.textDim }}>
            Meta {eur0(meta)} · Google {eur0(gads)}
          </p>
        </div>
        <div>
          <Label>MER</Label>
          <Big>{num(b30.mer ?? 0, 2)}</Big>
          {deltaMer && <Delta info={deltaMer}>Fatturato Woo / Spesa adv</Delta>}
        </div>
        <div>
          <Label>Revenue Woo</Label>
          <Big>{eur0(b30.revenue_woo ?? 0)}</Big>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: palette.textDim }}>
            {integer(b30.orders_woo ?? 0)} ordini
          </p>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <p style={{
      margin: 0, fontSize: 10, fontWeight: 700, color: palette.textDim,
      letterSpacing: "0.08em", textTransform: "uppercase",
    }}>{children}</p>
  );
}

function Big({ children }: { children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <p style={{
      margin: "6px 0 0", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em",
      color: palette.text, fontVariantNumeric: "tabular-nums",
    }}>{children}</p>
  );
}

function Delta({ info, children }: { info: NonNullable<ReturnType<typeof calcDelta>>; children?: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: info.color, display: "inline-flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 10 }}>{info.arrow}</span>{info.label}
      </span>
      {children && <span style={{ fontSize: 11, color: palette.textDim }}>{children}</span>}
    </div>
  );
}

function SubtabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.55rem 1.15rem",
        borderRadius: 10,
        border: `1px solid ${active ? palette.textFaint : palette.cardBorder}`,
        background: active ? palette.buttonHover : "transparent",
        color: active ? palette.text : palette.textMuted,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Google Ads ───────────────────────────────────────────────────

function GoogleAdsView({ data }: { data: DashboardData }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const rows = data.gads ?? [];
  const badBg = theme === "dark" ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)";
  return (
    <Card>
      <CardHeader title="Campagne Google Ads" />
      {rows.length === 0 ? <EmptyState label="In attesa dei primi dati Google Ads" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Campagna</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo 7g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conv. 7g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore 7g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Costo 30g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Conv. 30g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Valore 30g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CPA 30g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>ROAS 30g</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Δ Costo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const roas30 = Number(r[8]) || 0;
                const bad = roas30 > 0 && roas30 < 1;
                const deltaCost = calcDelta(Number(r[4]), Number(r[9]));
                return (
                  <tr key={i} style={{ background: bad ? badBg : undefined }}>
                    <td style={{ ...ts.tdBase, color: bad ? "#ef4444" : ts.tdBase.color, fontWeight: bad ? 600 : 400 }}>
                      {String(r[0] ?? "—")}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[1]))}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(Number(r[2]), 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[3]))}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[4]))}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(Number(r[5]), 1)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[6]))}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[7]))}</td>
                    <td style={{
                      ...ts.tdBase, ...ts.tdRight,
                      color: bad ? NEGATIVE : roas30 >= ROAS_THRESHOLD ? "#22c55e" : ts.tdBase.color,
                      fontWeight: 600,
                    }}>{num(roas30, 2)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: deltaCost?.color ?? ts.tdBase.color, fontWeight: 600 }}>
                      {deltaCost ? `${deltaCost.arrow} ${deltaCost.label}` : "—"}
                    </td>
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

// ─── Meta ─────────────────────────────────────────────────────────

function MetaView({ data }: { data: DashboardData }) {
  const [campWindow, setCampWindow] = useState<MetaWindow>("w30");
  const [scatterWindow, setScatterWindow] = useState<CreativesWindow>("w30");
  const campaigns = data.meta?.campaigns?.[campWindow] ?? [];
  const scatterSrc = data.meta?.creatives?.[scatterWindow];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <CardHeader
          title="Campagne Meta"
          right={
            <div style={{ display: "flex", gap: 6 }}>
              <Pill active={campWindow === "w7"} onClick={() => setCampWindow("w7")}>Ultimi 7g</Pill>
              <Pill active={campWindow === "w30"} onClick={() => setCampWindow("w30")}>Ultimi 30g</Pill>
            </div>
          }
        />
        {campaigns.length === 0 ? <EmptyState label="Nessuna campagna nel periodo" /> : <MetaCampaignsTable rows={campaigns} />}
      </Card>

      <Card>
        <CardHeader
          title="Matrice creatività · ROAS × Frequenza"
          right={
            <div style={{ display: "flex", gap: 6 }}>
              <Pill active={scatterWindow === "w7"} onClick={() => setScatterWindow("w7")}>7g</Pill>
              <Pill active={scatterWindow === "w30"} onClick={() => setScatterWindow("w30")}>30g</Pill>
              <Pill active={scatterWindow === "w90"} onClick={() => setScatterWindow("w90")}>90g</Pill>
            </div>
          }
        />
        {!scatterSrc || scatterSrc.rows.length === 0 ? (
          <EmptyState label={`Nessuna creatività per la finestra ${scatterWindow}`} />
        ) : (
          <CreativesScatter rows={scatterSrc.rows} />
        )}
      </Card>

      <VerdictSection data={data} />
    </div>
  );
}

// ─── Verdetti operativi ───────────────────────────────────────────

type VerdictFilter = "all" | Verdict;

function VerdictSection({ data }: { data: DashboardData }) {
  const { palette } = useTheme();
  const w30rows = data.meta?.creatives?.w30?.rows ?? [];
  const w7rows = data.meta?.creatives?.w7?.rows ?? [];

  const enriched = useMemo(() => {
    const w7map = new Map<string, CreativeMetrics>();
    for (const r of w7rows) {
      const m = toMetrics(r);
      w7map.set(m.name.toLowerCase().trim(), m);
    }
    return w30rows.map((r) => {
      const w30m = toMetrics(r);
      const w7m = w7map.get(w30m.name.toLowerCase().trim());
      const v = computeVerdict(w30m, w7m);
      return { w30: w30m, w7: w7m, verdict: v.verdict, reason: v.reason };
    })
    .sort((a, b) => b.w30.spesa - a.w30.spesa);
  }, [w30rows, w7rows]);

  const [filter, setFilter] = useState<VerdictFilter>("all");
  const [includePaused, setIncludePaused] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Verdict, number> = { scala: 0, fatigue: 0, spegni: 0, osserva: 0, mantieni: 0 };
    for (const r of enriched) {
      if (!includePaused && r.w30.stato !== "ACTIVE") continue;
      c[r.verdict]++;
    }
    return c;
  }, [enriched, includePaused]);

  const visible = useMemo(() => enriched.filter((r) => {
    if (!includePaused && r.w30.stato !== "ACTIVE") return false;
    if (filter !== "all" && r.verdict !== filter) return false;
    return true;
  }), [enriched, filter, includePaused]);

  if (enriched.length === 0) {
    return (
      <Card>
        <CardHeader title="Verdetti operativi creatività" />
        <EmptyState label="Nessuna creatività attiva negli ultimi 30 giorni" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Verdetti operativi creatività"
        right={
          <span style={{ fontSize: 11, color: palette.textDim }}>
            Confronto w7 vs w30 · soglie ROAS ≥ {num(CFG.ROAS_GOOD, 1)} · freq ≥ {num(CFG.FREQ_HIGH, 1)} · spesa min {eur(CFG.MIN_SPEND)}
          </span>
        }
      />

      {/* Summary cards clickable */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
        <VerdictCard
          verdict="scala" label="Da scalare"
          count={counts.scala} active={filter === "scala"}
          onClick={() => setFilter(filter === "scala" ? "all" : "scala")}
        />
        <VerdictCard
          verdict="fatigue" label="Fatigue in arrivo"
          count={counts.fatigue} active={filter === "fatigue"}
          onClick={() => setFilter(filter === "fatigue" ? "all" : "fatigue")}
        />
        <VerdictCard
          verdict="spegni" label="Da spegnere"
          count={counts.spegni} active={filter === "spegni"}
          onClick={() => setFilter(filter === "spegni" ? "all" : "spegni")}
        />
      </div>

      {/* Secondary filters */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
        <span style={{ color: palette.textDim, fontWeight: 600, marginRight: 4 }}>Filtra:</span>
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>Tutti</Pill>
        <Pill active={filter === "scala"} onClick={() => setFilter("scala")}>Scala</Pill>
        <Pill active={filter === "fatigue"} onClick={() => setFilter("fatigue")}>Fatigue</Pill>
        <Pill active={filter === "spegni"} onClick={() => setFilter("spegni")}>Spegni</Pill>
        <Pill active={filter === "mantieni"} onClick={() => setFilter("mantieni")}>Mantieni</Pill>
        <Pill active={filter === "osserva"} onClick={() => setFilter("osserva")}>Osserva</Pill>
        <div style={{ flex: 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={includePaused}
            onChange={(e) => setIncludePaused(e.target.checked)}
            style={{ accentColor: "#64CBFF" }}
          />
          <span style={{ color: palette.textMuted }}>Includi PAUSED</span>
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState label="Nessuna creatività corrisponde ai filtri" />
      ) : (
        <VerdictTable rows={visible} />
      )}
    </Card>
  );
}

function VerdictCard({
  verdict, label, count, active, onClick,
}: {
  verdict: Verdict; label: string; count: number; active: boolean; onClick: () => void;
}) {
  const { palette } = useTheme();
  const meta = VERDICT_META[verdict];
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", cursor: "pointer",
        padding: "0.9rem 1rem", borderRadius: 12,
        border: `1px solid ${active ? meta.color : palette.cardBorder}`,
        background: active ? meta.bg : palette.divider,
        color: palette.text, fontFamily: "inherit",
        transition: "all 0.15s",
        boxShadow: active ? `0 0 0 2px ${meta.bg}` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
        {integer(count)}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: palette.textDim }}>
        {meta.description}
      </p>
    </button>
  );
}

type VerdictRow = {
  w30: CreativeMetrics;
  w7: CreativeMetrics | undefined;
  verdict: Verdict;
  reason: string;
};

function VerdictTable({ rows }: { rows: VerdictRow[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Creatività</th>
            <th style={ts.th}>Stato</th>
            <th style={ts.th}>Verdetto</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Spesa 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Freq. 7g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR 7g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Acquisti 30g</th>
            <th style={{ ...ts.th, ...ts.thRight }}>ROAS 30g</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const meta = VERDICT_META[r.verdict];
            const stato = r.w30.stato;
            const active = stato === "ACTIVE";
            return (
              <tr key={i}>
                <td style={{ ...ts.tdBase, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: palette.text, fontWeight: 500 }} title={r.w30.name}>
                  {r.w30.name}
                </td>
                <td style={ts.tdBase}>
                  <span style={{
                    display: "inline-block", padding: "1px 8px", borderRadius: 20,
                    background: active ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.20)",
                    color: active ? "#22c55e" : palette.textDim,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  }}>{stato}</span>
                </td>
                <td style={ts.tdBase}>
                  <span
                    title={r.reason}
                    style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 20,
                      background: meta.bg, color: meta.color,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                      textTransform: "uppercase", cursor: "help",
                      border: `1px solid ${meta.color}30`,
                    }}
                  >
                    {meta.label}
                  </span>
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(r.w30.spesa)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, color: r.w7 && r.w7.freq >= CFG.FREQ_HIGH ? "#f59e0b" : ts.tdBase.color, fontWeight: 500 }}>
                  {r.w7 ? num(r.w7.freq, 2) : "—"}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>
                  {r.w7 ? pctStr(r.w7.ctr * 100, 2) : "—"}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.w30.ctr * 100, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: r.w30.acquisti > 0 ? 600 : 400 }}>
                  {num(r.w30.acquisti, 0)}
                </td>
                <td style={{
                  ...ts.tdBase, ...ts.tdRight,
                  color: r.w30.roas >= CFG.ROAS_GOOD ? "#22c55e" : r.w30.roas < 1 ? NEGATIVE : ts.tdBase.color,
                  fontWeight: 700,
                }}>{num(r.w30.roas, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MetaCampaignsTable({ rows }: { rows: (string | number)[][] }) {
  const { palette, theme } = useTheme();
  const ts = tableStyles(palette);
  const badBg = theme === "dark" ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.08)";
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={ts.table}>
        <thead>
          <tr>
            <th style={ts.th}>Campagna</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Spesa</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Impression</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
            <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Acquisti</th>
            <th style={{ ...ts.th, ...ts.thRight }}>Valore</th>
            <th style={{ ...ts.th, ...ts.thRight }}>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const roas = Number(r[7]) || 0;
            const bad = roas > 0 && roas < 1;
            return (
              <tr key={i} style={{ background: bad ? badBg : undefined }}>
                <td style={{ ...ts.tdBase, color: bad ? "#ef4444" : ts.tdBase.color, fontWeight: bad ? 600 : 400 }}>
                  {String(r[0] ?? "—")}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[1]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[2]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(Number(r[3]))}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(Number(r[4]) * 100, 2)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{num(Number(r[5]), 0)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{eur(Number(r[6]))}</td>
                <td style={{
                  ...ts.tdBase, ...ts.tdRight,
                  color: bad ? NEGATIVE : roas >= ROAS_THRESHOLD ? "#22c55e" : ts.tdBase.color,
                  fontWeight: 600,
                }}>{num(roas, 2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type CreativeRow = (string | number)[];

function CreativesScatter({ rows }: { rows: CreativeRow[] }) {
  const { palette } = useTheme();
  const points = useMemo(() => rows.map((r) => ({
    name: String(r[0] ?? ""),
    stato: String(r[1] ?? ""),
    spesa: Number(r[2]) || 0,
    frequenza: Number(r[5]) || 0,
    ctr: Number(r[7]) || 0,
    cpa: Number(r[12]) || 0,
    roas: Number(r[13]) || 0,
    valore: Number(r[11]) || 0,
    acquisti: Number(r[10]) || 0,
  })).filter((p) => p.frequenza > 0 && p.roas >= 0), [rows]);

  if (points.length === 0) return <EmptyState label="Nessuna creatività con dati sufficienti" />;

  const maxFreq = Math.max(FREQ_THRESHOLD * 1.6, ...points.map((p) => p.frequenza));
  const maxRoas = Math.max(ROAS_THRESHOLD * 1.6, ...points.map((p) => p.roas));
  const maxSpesa = Math.max(1, ...points.map((p) => p.spesa));

  return (
    <div style={{ width: "100%", height: 380 }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 24, bottom: 40, left: 24 }}>
          <CartesianGrid stroke={palette.grid} />
          <ReferenceArea x1={0} x2={FREQ_THRESHOLD} y1={ROAS_THRESHOLD} y2={maxRoas} fill="#22c55e" fillOpacity={0.06} strokeOpacity={0} />
          <ReferenceArea x1={FREQ_THRESHOLD} x2={maxFreq} y1={ROAS_THRESHOLD} y2={maxRoas} fill="#64CBFF" fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceArea x1={0} x2={FREQ_THRESHOLD} y1={0} y2={ROAS_THRESHOLD} fill="#EB9115" fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceArea x1={FREQ_THRESHOLD} x2={maxFreq} y1={0} y2={ROAS_THRESHOLD} fill="#ef4444" fillOpacity={0.08} strokeOpacity={0} />

          <XAxis type="number" dataKey="frequenza" name="Frequenza" domain={[0, maxFreq]}
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => num(Number(v), 1)}
            label={{ value: "Frequenza →", position: "insideBottom", offset: -8, fill: palette.textDim, fontSize: 11 }}
          />
          <YAxis type="number" dataKey="roas" name="ROAS" domain={[0, maxRoas]}
            tick={{ fill: palette.axis, fontSize: 11 }}
            axisLine={{ stroke: palette.cardBorder }} tickLine={false}
            tickFormatter={(v) => num(Number(v), 1)}
            label={{ value: "ROAS ↑", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="spesa" range={[40, Math.max(600, maxSpesa)]} name="Spesa" />
          <ReferenceLine y={ROAS_THRESHOLD} stroke={palette.textFaint} strokeDasharray="4 4"
            label={{ value: `ROAS ${num(ROAS_THRESHOLD, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideBottomRight" }} />
          <ReferenceLine x={FREQ_THRESHOLD} stroke={palette.textFaint} strokeDasharray="4 4"
            label={{ value: `Freq ${num(FREQ_THRESHOLD, 1)}`, fill: palette.textDim, fontSize: 10, position: "insideTopLeft" }} />

          <Tooltip cursor={{ strokeDasharray: "3 3", stroke: palette.textFaint }} content={<CreativeTooltip />} />

          <ReferenceLine segment={[
            { x: FREQ_THRESHOLD / 2, y: ROAS_THRESHOLD + (maxRoas - ROAS_THRESHOLD) * 0.9 },
            { x: FREQ_THRESHOLD / 2 + 0.001, y: ROAS_THRESHOLD + (maxRoas - ROAS_THRESHOLD) * 0.9 },
          ]} stroke="none"
            label={{ value: "Scala", position: "center", fill: "rgba(34,197,94,0.85)", fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine segment={[
            { x: FREQ_THRESHOLD + (maxFreq - FREQ_THRESHOLD) * 0.5, y: ROAS_THRESHOLD + (maxRoas - ROAS_THRESHOLD) * 0.9 },
            { x: FREQ_THRESHOLD + (maxFreq - FREQ_THRESHOLD) * 0.5 + 0.001, y: ROAS_THRESHOLD + (maxRoas - ROAS_THRESHOLD) * 0.9 },
          ]} stroke="none"
            label={{ value: "Mantieni", position: "center", fill: "rgba(100,203,255,0.85)", fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine segment={[
            { x: FREQ_THRESHOLD / 2, y: ROAS_THRESHOLD * 0.1 },
            { x: FREQ_THRESHOLD / 2 + 0.001, y: ROAS_THRESHOLD * 0.1 },
          ]} stroke="none"
            label={{ value: "Osserva", position: "center", fill: "rgba(235,145,21,0.85)", fontSize: 11, fontWeight: 700 }} />
          <ReferenceLine segment={[
            { x: FREQ_THRESHOLD + (maxFreq - FREQ_THRESHOLD) * 0.5, y: ROAS_THRESHOLD * 0.1 },
            { x: FREQ_THRESHOLD + (maxFreq - FREQ_THRESHOLD) * 0.5 + 0.001, y: ROAS_THRESHOLD * 0.1 },
          ]} stroke="none"
            label={{ value: "Spegni", position: "center", fill: "rgba(239,68,68,0.9)", fontSize: 11, fontWeight: 700 }} />

          <Scatter data={points} fill="#96C228" fillOpacity={0.7} stroke="#96C228" strokeWidth={1.5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CreativeTooltip({ active, payload }: any) {
  const { palette } = useTheme();
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as {
    name: string; stato: string; spesa: number; frequenza: number; ctr: number;
    cpa: number; roas: number; valore: number; acquisti: number;
  };
  return (
    <div style={{
      background: palette.tooltipBg,
      border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: 8, padding: "0.7rem 0.85rem",
      fontSize: 12, color: palette.text,
      maxWidth: 280,
      boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
    }}>
      <p style={{ margin: 0, fontWeight: 700, marginBottom: 4, wordBreak: "break-word" }}>{p.name}</p>
      <p style={{
        margin: 0, fontSize: 10,
        color: p.stato === "ACTIVE" ? "#22c55e" : palette.textDim,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>{p.stato}</p>
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: palette.textDim }}>ROAS</span><span style={{ textAlign: "right" }}>{num(p.roas, 2)}</span>
        <span style={{ color: palette.textDim }}>Frequenza</span><span style={{ textAlign: "right" }}>{num(p.frequenza, 2)}</span>
        <span style={{ color: palette.textDim }}>Spesa</span><span style={{ textAlign: "right" }}>{eur(p.spesa)}</span>
        <span style={{ color: palette.textDim }}>Valore</span><span style={{ textAlign: "right" }}>{eur(p.valore)}</span>
        <span style={{ color: palette.textDim }}>Acquisti</span><span style={{ textAlign: "right" }}>{num(p.acquisti, 0)}</span>
        <span style={{ color: palette.textDim }}>CPA</span><span style={{ textAlign: "right" }}>{eur(p.cpa)}</span>
        <span style={{ color: palette.textDim }}>CTR</span><span style={{ textAlign: "right" }}>{pctStr(p.ctr * 100, 2)}</span>
      </div>
    </div>
  );
}

