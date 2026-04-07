"use client";

import React, { useEffect, useState, useCallback } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Badge, statoColor, prioritaColor, sentimentColor, mrrSemaforo } from "@/components/dashboard/Badge";
import { SkeletonBlock } from "@/components/dashboard/Skeleton";

// ─── Types ───────────────────────────────────────────────────────
interface ClientRow { id: string; nome: string; mrr: number; valoreStorico: number; stato: string; sentiment: string; risultati: string; attenzione: string; }
interface ContrattoRow { id: string; nome: string; tipo: string; valore: number; durataMesi: number; valoreStorico: number; stato: string; mrrNetto: number; }
interface TaskRow { id: string; nome: string; stato: string; priorita: string; scadenza: string | null; assignedTo: string[]; cliente: string[]; }
interface FatturaRow { id: string; nome: string; importo: number; dataEmissione: string | null; emessa: boolean; contratto: string[]; }
interface PipelineRow { id: string; nome: string; fase: string; tipoOpportunita: string; valoreStimato: number; responsabile: string[]; prossimoFollowup: string | null; }
interface TouchpointRow { id: string; cliente: string[]; tipo: string; canale: string; data: string | null; sentimentCall: string; }
interface Fatturato2026Data { year: number; mrrFatturato2026: number; valoreUnaT2026: number; totale2026: number; }
interface MarginalitaData { month: string; tasksMensili: number; meetingMensili: number; ricorrenti: { contractId: string; nome: string; clienteNome: string; ore: number; costoOre: number; mrrNetto?: number; margine: number; marginePercent: number | null; nTask: number; nMeeting: number; }[]; nonRicorrenti: { contractId: string; nome: string; clienteNome: string; ore: number; costoOre: number; valore?: number; margine: number; marginePercent: number | null; nTask: number; nMeeting: number; }[]; }
interface OreRow { week: string; label: string; cells: Record<string, number>; total: number; }
interface OreSettimanaliData { from: string; to: string; weeks: number; people: string[]; rows: OreRow[]; colTotals: Record<string, number>; colAvg: Record<string, number>; grandTotal: number; }

// ─── Helpers ─────────────────────────────────────────────────────
function eur(n: number) { return "€\u00a0" + Math.round(n).toLocaleString("it-IT"); }
function fmtDate(d: string | null) { if (!d) return "—"; return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" }); }
function isWithin(d: string | null, days: number) { if (!d) return false; const diff = (new Date(d).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= days; }
function currentMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function monthLabel(m: string) { const [y, mo] = m.split("-"); return new Date(Number(y), Number(mo) - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" }); }

const TASK_COLS = ["Da fare", "In corso", "In review", "Bloccato"] as const;

// ─── Light theme tokens ───────────────────────────────────────────
const T = {
  bg:         "#f4f4f5",
  card:       "#ffffff",
  border:     "#e4e4e7",
  borderMid:  "#d4d4d8",
  text:       "#18181b",
  textMid:    "#52525b",
  textMuted:  "#a1a1aa",
  header:     "rgba(255,255,255,0.92)",
};

// ─── Fetch hook ───────────────────────────────────────────────────
function useFetch<T>(key: string, autoRefreshMs = 300000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notion/${key}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore"); }
    finally { setLoading(false); }
  }, [key]);

  useEffect(() => { load(); const id = setInterval(load, autoRefreshMs); return () => clearInterval(id); }, [load, autoRefreshMs]);
  return { data, loading, error, refresh: load };
}

function useMarginalita(month: string) {
  const [data, setData] = useState<MarginalitaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/notion/marginalita?month=${month}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore"); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refresh: load };
}

function useFatturato2026() {
  const [data, setData] = useState<Fatturato2026Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/notion/fatturato-2026");
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refresh: load };
}

function useOreSettimanali(weeks: number) {
  const [data, setData] = useState<OreSettimanaliData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/notion/ore-settimanali?weeks=${weeks}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Errore"); }
    finally { setLoading(false); }
  }, [weeks]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refresh: load };
}

// ─── Main ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const crm         = useFetch<ClientRow[]>("crm");
  const contratti   = useFetch<ContrattoRow[]>("contratti");
  const tasks       = useFetch<TaskRow[]>("task");
  const fatture     = useFetch<FatturaRow[]>("fatturazioni");
  const pipeline    = useFetch<PipelineRow[]>("pipeline");
  const touchpoints = useFetch<TouchpointRow[]>("touchpoints");

  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const marginalita   = useMarginalita(selectedMonth);
  const fatt2026      = useFatturato2026();

  const [oreWeeks, setOreWeeks] = useState(8);
  const oreSettimanali = useOreSettimanali(oreWeeks);

  // KPI
  const attivi           = (crm.data ?? []).filter((c) => c.stato === "Attivo");
  const contrattiAttivi  = (contratti.data ?? []).filter((c) => c.stato === "Attivo");
  const mrrNetto         = contrattiAttivi.filter((c) => c.tipo === "Ricorrente").reduce((s, c) => s + c.mrrNetto, 0);
  const valoreUnaT2026   = fatt2026.data?.valoreUnaT2026 ?? 0;
  const previsioneFineAnno = fatt2026.data?.totale2026 ?? 0;
  const daEmettere       = (fatture.data ?? []).filter((f) => isWithin(f.dataEmissione, 14)).length;

  // Filters
  const [crmFilter, setCrmFilter] = useState("Tutti");
  const [taskFilter, setTaskFilter] = useState("Tutti");
  const [sortMrr, setSortMrr]     = useState<"asc"|"desc">("desc");

  const allStati    = ["Tutti", ...Array.from(new Set((crm.data ?? []).map((c) => c.stato).filter(Boolean)))];
  const allAssignees= ["Tutti", ...Array.from(new Set((tasks.data ?? []).flatMap((t) => t.assignedTo)))];

  const filteredCrm = (crm.data ?? [])
    .filter((c) => crmFilter === "Tutti" || c.stato === crmFilter)
    .sort((a, b) => sortMrr === "desc" ? b.mrr - a.mrr : a.mrr - b.mrr);

  const filteredTasks = (tasks.data ?? [])
    .filter((t) => taskFilter === "Tutti" || t.assignedTo.includes(taskFilter));

  const fattureList  = [...(fatture.data ?? [])].sort((a, b) => new Date(a.dataEmissione ?? "").getTime() - new Date(b.dataEmissione ?? "").getTime());
  const totaleFatture= fattureList.reduce((s, f) => s + f.importo, 0);

  // Generate last 6 months options
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  function refreshAll() { crm.refresh(); contratti.refresh(); tasks.refresh(); fatture.refresh(); pipeline.refresh(); touchpoints.refresh(); marginalita.refresh(); oreSettimanali.refresh(); fatt2026.refresh(); }

  const thStyle = { padding: "6px 12px 6px 0", color: T.textMuted, fontWeight: 500 as const, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" as const };
  const tdStyle = (extra?: object) => ({ padding: "8px 12px 8px 0", borderBottom: `1px solid ${T.bg}`, color: T.text, ...extra });

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.text, fontFamily: "Inter, system-ui, sans-serif", fontSize: 13 }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f4f4f5; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 3px; }
        select { appearance: none; -webkit-appearance: none; cursor: pointer; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; }
        tr:last-child td { border-bottom: none !important; }
      `}</style>

      {/* Top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: T.header, backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, padding: "0 1.5rem", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          </div>
          <span style={{ color: T.text, fontWeight: 600, fontSize: 14, letterSpacing: "-0.02em" }}>Performance Flows</span>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ color: T.textMid, fontSize: 13 }}>Dashboard</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={refreshAll} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 12px", color: T.textMid, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Aggiorna
          </button>
          <button onClick={async () => { await fetch("/api/auth/login", { method: "DELETE" }); location.href = "/dashboard/login"; }} style={{ background: "transparent", border: "none", color: T.textMuted, fontSize: 12, cursor: "pointer" }}>
            Esci
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "1.5rem 1.25rem 5rem" }}>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
          <KpiCard label="MRR Netto" value={eur(mrrNetto)} sub={`${attivi.length} clienti attivi`} accent="violet" loading={contratti.loading} />
          <KpiCard label="Clienti Attivi" value={attivi.length} accent="green" loading={crm.loading} />
          <KpiCard label="Una tantum 2026" value={eur(valoreUnaT2026)} sub="tutti i contratti 2026" accent="violet" loading={fatt2026.loading} />
          <KpiCard label="Previsione 2026" value={eur(previsioneFineAnno)} sub="MRR × mesi attivi + una tantum" accent="green" loading={fatt2026.loading} />
          <KpiCard label="Fatture entro 14gg" value={daEmettere} sub="da emettere" accent={daEmettere > 0 ? "yellow" : "default"} loading={fatture.loading} />
        </div>

        {/* ── Marginalità contratti ricorrenti (mensile) ── */}
        <SectionCard
          title="Marginalità — Contratti Ricorrenti"
          action={
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMid, padding: "4px 28px 4px 10px", fontSize: 12 }}>
              {monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          }
        >
          {marginalita.loading ? <SkeletonBlock rows={5} /> : marginalita.error ? <ErrorMsg msg={marginalita.error} /> : (
            <>
              {marginalita.data && (
                <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>
                  {marginalita.data.tasksMensili} task · {marginalita.data.meetingMensili ?? 0} meeting in {monthLabel(selectedMonth)} · €25/h
                </p>
              )}
              <MarginalitaTable rows={marginalita.data?.ricorrenti ?? []} valueKey="mrrNetto" valueLabel="MRR Netto" emptyMsg={`Nessuna task completata in ${monthLabel(selectedMonth)}`} thStyle={thStyle} tdStyle={tdStyle} T={T} />
            </>
          )}
        </SectionCard>

        <Spacer />

        {/* ── Marginalità contratti non ricorrenti (totale) ── */}
        <SectionCard title="Marginalità — Contratti Non Ricorrenti (totale progetto)">
          {marginalita.loading ? <SkeletonBlock rows={4} /> : marginalita.error ? null : (
            <MarginalitaTable rows={marginalita.data?.nonRicorrenti ?? []} valueKey="valore" valueLabel="Valore" emptyMsg="Nessun contratto non ricorrente attivo" thStyle={thStyle} tdStyle={tdStyle} T={T} />
          )}
        </SectionCard>

        <Spacer />

        {/* ── Ore per settimana ── */}
        <SectionCard title="Ore lavorate per persona / settimana" action={
          <select
            value={oreWeeks}
            onChange={(e) => setOreWeeks(Number(e.target.value))}
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMid, padding: "4px 28px 4px 10px", fontSize: 12 }}
          >
            {[4, 8, 13, 26].map((w) => (
              <option key={w} value={w}>{w === 4 ? "Ultime 4 sett." : w === 8 ? "Ultime 8 sett." : w === 13 ? "Ultimi 3 mesi" : "Ultimi 6 mesi"}</option>
            ))}
          </select>
        }>
          {oreSettimanali.loading ? <SkeletonBlock rows={5} /> : oreSettimanali.error ? <ErrorMsg msg={oreSettimanali.error} /> : !oreSettimanali.data || oreSettimanali.data.rows.length === 0 ? <Empty msg="Nessun task con ore registrate in questo periodo" /> : (() => {
            const d = oreSettimanali.data!;
            const people = d.people;
            const tfStyle: React.CSSProperties = { padding: "8px 12px 8px 0", borderTop: `2px solid ${T.borderMid}`, color: T.text, fontWeight: 700, fontSize: 12 };
            const numStyle = (h: number): React.CSSProperties => ({
              padding: "7px 12px 7px 0",
              borderBottom: `1px solid ${T.bg}`,
              color: h === 0 ? T.textMuted : h >= 8 ? "#16a34a" : h >= 4 ? "#d97706" : T.textMid,
              fontWeight: h > 0 ? 600 : 400,
              textAlign: "right" as const,
            });
            return (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: "left" }}>Settimana</th>
                      {people.map((p) => <th key={p} style={{ ...thStyle, textAlign: "right" }}>{p}</th>)}
                      <th style={{ ...thStyle, textAlign: "right" }}>Totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((row) => (
                      <tr key={row.week}>
                        <td style={tdStyle({ color: T.textMid, whiteSpace: "nowrap" })}>
                          <span style={{ fontWeight: 600, color: T.text }}>{row.week}</span>
                          <span style={{ marginLeft: 6, fontSize: 11, color: T.textMuted }}>{row.label}</span>
                        </td>
                        {people.map((p) => {
                          const h = row.cells[p] ?? 0;
                          return <td key={p} style={numStyle(h)}>{h > 0 ? `${h}h` : "—"}</td>;
                        })}
                        <td style={{ ...numStyle(row.total), color: T.text, fontWeight: 700 }}>{row.total > 0 ? `${row.total}h` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ ...tfStyle, color: T.textMuted }}>Totale</td>
                      {people.map((p) => <td key={p} style={{ ...tfStyle, textAlign: "right" }}>{d.colTotals[p] ? `${d.colTotals[p]}h` : "—"}</td>)}
                      <td style={{ ...tfStyle, textAlign: "right", color: "#6366f1" }}>{d.grandTotal ? `${d.grandTotal}h` : "—"}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "6px 12px 6px 0", color: T.textMuted, fontSize: 11 }}>Media / settimana attiva</td>
                      {people.map((p) => <td key={p} style={{ padding: "6px 12px 6px 0", textAlign: "right", color: T.textMid, fontSize: 11 }}>{d.colAvg[p] ? `${d.colAvg[p].toFixed(1)}h` : "—"}</td>)}
                      <td style={{ padding: "6px 12px 6px 0", textAlign: "right", color: T.textMid, fontSize: 11 }}>
                        {d.rows.length > 0 ? `${(d.grandTotal / d.rows.length).toFixed(1)}h` : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}
        </SectionCard>

        <Spacer />

        {/* ── CRM Clienti ── */}
        <SectionCard title="Clienti" action={
          <div style={{ display: "flex", gap: 8 }}>
            <select value={crmFilter} onChange={(e) => setCrmFilter(e.target.value)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMid, padding: "4px 28px 4px 10px", fontSize: 12 }}>
              {allStati.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => setSortMrr(s => s === "desc" ? "asc" : "desc")} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMid, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
              MRR {sortMrr === "desc" ? "↓" : "↑"}
            </button>
          </div>
        }>
          {crm.loading ? <SkeletonBlock rows={6} /> : crm.error ? <ErrorMsg msg={crm.error} /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>{["Nome", "MRR", "Val. Storico", "Status", "Sentiment", "Attenzione"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredCrm.map((c) => {
                    const isAttenzione = c.attenzione?.includes("Attenzione");
                    const isMonitora   = c.attenzione?.includes("Monitora");
                    const rowBg = isAttenzione ? "#fef2f2" : isMonitora ? "#fffbeb" : "transparent";
                    return (
                      <tr key={c.id} style={{ background: rowBg }}>
                        <td style={tdStyle({ fontWeight: 500 })}>
                          {isAttenzione && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#ef4444", marginRight: 6 }} />}
                          {isMonitora   && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", marginRight: 6 }} />}
                          {c.nome || "—"}
                        </td>
                        <td style={tdStyle({ color: "#6366f1", fontWeight: 600 })}>{c.mrr ? eur(c.mrr) : "—"}</td>
                        <td style={tdStyle({ color: T.textMid })}>{c.valoreStorico ? eur(c.valoreStorico) : "—"}</td>
                        <td style={tdStyle()}><Badge label={c.stato || "—"} color={statoColor(c.stato)} /></td>
                        <td style={tdStyle()}><Badge label={c.sentiment || "—"} color={sentimentColor(c.sentiment)} /></td>
                        <td style={{ ...tdStyle(), color: isAttenzione ? "#dc2626" : isMonitora ? "#d97706" : T.textMuted, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.attenzione || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCrm.length === 0 && <Empty />}
            </div>
          )}
        </SectionCard>

        <Spacer />

        {/* ── Contratti ── */}
        <SectionCard title="Contratti Attivi & Marginalità">
          {contratti.loading ? <SkeletonBlock rows={4} /> : contratti.error ? <ErrorMsg msg={contratti.error} /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>{["Contratto", "Tipo", "Valore €", "Durata", "Val. Storico", "MRR Netto", "Stato"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {(contratti.data ?? []).map((c) => (
                    <tr key={c.id}>
                      <td style={tdStyle({ fontWeight: 500 })}>{c.nome || "—"}</td>
                      <td style={tdStyle({ color: T.textMid })}>{c.tipo || "—"}</td>
                      <td style={tdStyle({ color: "#6366f1", fontWeight: 600 })}>{c.valore ? eur(c.valore) : "—"}</td>
                      <td style={tdStyle({ color: T.textMid })}>{c.durataMesi ? `${c.durataMesi} mesi` : "—"}</td>
                      <td style={tdStyle({ color: T.textMid })}>{c.valoreStorico ? eur(c.valoreStorico) : "—"}</td>
                      <td style={tdStyle()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: mrrSemaforo(c.mrrNetto) === "green" ? "#22c55e" : mrrSemaforo(c.mrrNetto) === "yellow" ? "#eab308" : "#ef4444", display: "inline-block" }} />
                          <span>{c.mrrNetto ? eur(c.mrrNetto) : "—"}</span>
                        </div>
                      </td>
                      <td style={tdStyle()}><Badge label={c.stato || "—"} color={statoColor(c.stato)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(contratti.data ?? []).length === 0 && <Empty />}
            </div>
          )}
        </SectionCard>

        <Spacer />

        {/* ── Task Kanban ── */}
        <SectionCard title="Task" action={
          <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMid, padding: "4px 28px 4px 10px", fontSize: 12 }}>
            {allAssignees.map((a) => <option key={a}>{a}</option>)}
          </select>
        }>
          {tasks.loading ? <SkeletonBlock rows={3} /> : tasks.error ? <ErrorMsg msg={tasks.error} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
              {TASK_COLS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.stato === col);
                const colColors: Record<string, string> = { "Da fare": "#e0e7ff", "In corso": "#dbeafe", "In review": "#ede9fe", "Bloccato": "#fee2e2" };
                const colText:   Record<string, string> = { "Da fare": "#3730a3", "In corso": "#1e40af", "In review": "#5b21b6", "Bloccato": "#991b1b" };
                return (
                  <div key={col} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.75rem", minHeight: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: colText[col] ?? T.textMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col}</span>
                      {colTasks.length > 0 && <span style={{ fontSize: 10, background: colColors[col] ?? T.border, color: colText[col] ?? T.textMid, borderRadius: 10, padding: "1px 7px", fontWeight: 600 }}>{colTasks.length}</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {colTasks.map((t) => (
                        <div key={t.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 10px" }}>
                          <p style={{ color: T.text, fontSize: 12, margin: "0 0 5px", lineHeight: 1.4 }}>{t.nome}</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                            {t.priorita && <Badge label={t.priorita} color={prioritaColor(t.priorita)} />}
                            {t.scadenza && <span style={{ fontSize: 10, color: isWithin(t.scadenza, 3) ? "#dc2626" : T.textMuted }}>{fmtDate(t.scadenza)}</span>}
                          </div>
                        </div>
                      ))}
                      {colTasks.length === 0 && <span style={{ color: T.textMuted, fontSize: 11 }}>Nessun task</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <Spacer />

        {/* ── Fatturazioni ── */}
        <SectionCard title="Fatture da Emettere">
          {fatture.loading ? <SkeletonBlock rows={4} /> : fatture.error ? <ErrorMsg msg={fatture.error} /> : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead><tr>{["Nome", "Importo", "Data Emissione"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {fattureList.map((f) => {
                      const urgent = isWithin(f.dataEmissione, 7);
                      return (
                        <tr key={f.id} style={{ background: urgent ? "#fef2f2" : "transparent" }}>
                          <td style={tdStyle({ fontWeight: 500, color: urgent ? "#dc2626" : T.text })}>
                            {urgent && <span style={{ marginRight: 6 }}>⚠</span>}{f.nome || "—"}
                          </td>
                          <td style={tdStyle({ color: "#6366f1", fontWeight: 600 })}>{f.importo ? eur(f.importo) : "—"}</td>
                          <td style={tdStyle({ color: urgent ? "#dc2626" : T.textMid })}>{fmtDate(f.dataEmissione)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {fattureList.length === 0 && <Empty msg="Nessuna fattura da emettere" />}
              </div>
              {fattureList.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: T.textMid }}>Totale: <strong style={{ color: "#6366f1" }}>{eur(totaleFatture)}</strong></span>
                </div>
              )}
            </>
          )}
        </SectionCard>

        <Spacer />

        {/* ── Pipeline ── */}
        <SectionCard title="Pipeline">
          {pipeline.loading ? <SkeletonBlock rows={4} /> : pipeline.error ? <ErrorMsg msg={pipeline.error} /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>{["Nome", "Fase", "Tipo", "Responsabile"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {(pipeline.data ?? []).map((p) => (
                    <tr key={p.id}>
                      <td style={tdStyle({ fontWeight: 500 })}>{p.nome || "—"}</td>
                      <td style={tdStyle()}><Badge label={p.fase || "—"} color="violet" /></td>
                      <td style={tdStyle({ color: T.textMid })}>{p.tipoOpportunita || "—"}</td>
                      <td style={tdStyle({ color: T.textMid })}>{p.responsabile.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(pipeline.data ?? []).length === 0 && <Empty />}
            </div>
          )}
        </SectionCard>

        <Spacer />

        {/* ── Touchpoints ── */}
        <SectionCard title="Ultimi Touchpoints">
          {touchpoints.loading ? <SkeletonBlock rows={5} /> : touchpoints.error ? <ErrorMsg msg={touchpoints.error} /> : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead><tr>{["Tipo", "Canale", "Data", "Sentiment"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {(touchpoints.data ?? []).map((t) => (
                    <tr key={t.id}>
                      <td style={tdStyle()}>{t.tipo || "—"}</td>
                      <td style={tdStyle({ color: T.textMid })}>{t.canale || "—"}</td>
                      <td style={tdStyle({ color: T.textMid })}>{fmtDate(t.data)}</td>
                      <td style={tdStyle()}><Badge label={t.sentimentCall || "—"} color={sentimentColor(t.sentimentCall)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(touchpoints.data ?? []).length === 0 && <Empty />}
            </div>
          )}
        </SectionCard>

      </main>
    </div>
  );
}

function Spacer() { return <div style={{ height: 12 }} />; }
function Empty({ msg = "Nessun dato" }: { msg?: string }) { return <p style={{ color: "#a1a1aa", fontSize: 12, padding: "1rem 0", textAlign: "center" }}>{msg}</p>; }
function ErrorMsg({ msg }: { msg: string }) { return <p style={{ color: "#dc2626", fontSize: 12, padding: "0.5rem 0" }}>Errore: {msg}</p>; }

interface MarginalitaContratto { contractId: string; nome: string; clienteNome: string; ore: number; costoOre: number; mrrNetto?: number; valore?: number; margine: number; marginePercent: number | null; nTask: number; nMeeting: number; }
type MargSort = "marginePercent" | "margine" | "valore" | "ore";

function MarginalitaTable({ rows, valueKey, valueLabel, emptyMsg, thStyle, tdStyle, T }: {
  rows: MarginalitaContratto[];
  valueKey: "mrrNetto" | "valore";
  valueLabel: string;
  emptyMsg: string;
  thStyle: React.CSSProperties;
  tdStyle: (extra?: object) => React.CSSProperties;
  T: { text: string; textMid: string; textMuted: string; border: string; bg: string };
}) {
  const [sortBy, setSortBy] = React.useState<MargSort>("marginePercent");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  function toggleSort(col: MargSort) {
    if (sortBy === col) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    let av = 0, bv = 0;
    if (sortBy === "marginePercent") { av = a.marginePercent ?? -Infinity; bv = b.marginePercent ?? -Infinity; }
    else if (sortBy === "margine") { av = a.margine; bv = b.margine; }
    else if (sortBy === "valore") { av = (a.mrrNetto ?? a.valore ?? 0); bv = (b.mrrNetto ?? b.valore ?? 0); }
    else if (sortBy === "ore") { av = a.ore; bv = b.ore; }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  // Totals
  const totVal     = rows.reduce((s, c) => s + (c.mrrNetto ?? c.valore ?? 0), 0);
  const totOre     = rows.reduce((s, c) => s + c.ore, 0);
  const totCosto   = rows.reduce((s, c) => s + c.costoOre, 0);
  const totMarg    = rows.reduce((s, c) => s + c.margine, 0);
  const totPct     = totVal > 0 ? (totMarg / totVal) * 100 : null;
  const totTask    = rows.reduce((s, c) => s + c.nTask, 0);
  const totMeeting = rows.reduce((s, c) => s + c.nMeeting, 0);

  function eur(n: number) { return "€\u00a0" + Math.round(n).toLocaleString("it-IT"); }

  function SortTh({ label, col }: { label: string; col: MargSort }) {
    const active = sortBy === col;
    return (
      <th style={{ ...thStyle, cursor: "pointer", userSelect: "none" as const }} onClick={() => toggleSort(col)}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: active ? "#6366f1" : undefined }}>
          {label}
          <span style={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>{active && sortDir === "asc" ? "↑" : "↓"}</span>
        </span>
      </th>
    );
  }

  const totPctColor = totPct === null ? T.textMuted : totPct >= 70 ? "#16a34a" : totPct >= 40 ? "#d97706" : "#dc2626";
  const totMargColor = totMarg >= 0 ? "#16a34a" : "#dc2626";
  const tfStyle: React.CSSProperties = { padding: "8px 12px 8px 0", borderTop: `2px solid #d4d4d8`, color: T.text, fontWeight: 700, fontSize: 12 };

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th style={thStyle}>Contratto</th>
            <th style={thStyle}>Cliente</th>
            <SortTh label={valueLabel} col="valore" />
            <SortTh label="Ore spese" col="ore" />
            <th style={thStyle}>Costo ore</th>
            <SortTh label="Margine €" col="margine" />
            <SortTh label="Margine %" col="marginePercent" />
            <th style={thStyle}>Task / Meet.</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const val = valueKey === "mrrNetto" ? (c.mrrNetto ?? 0) : (c.valore ?? 0);
            const pct = c.marginePercent;
            const pctColor = pct === null ? T.textMuted : pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
            const margColor = c.margine >= 0 ? "#16a34a" : "#dc2626";
            return (
              <tr key={c.contractId}>
                <td style={tdStyle({ fontWeight: 500 })}>{c.nome || "—"}</td>
                <td style={tdStyle({ color: T.textMid })}>{c.clienteNome || "—"}</td>
                <td style={tdStyle({ color: "#6366f1", fontWeight: 600 })}>{val ? eur(val) : "—"}</td>
                <td style={tdStyle({ color: T.textMid })}>{c.ore ? `${c.ore}h` : "—"}</td>
                <td style={tdStyle({ color: T.textMid })}>{c.costoOre ? eur(c.costoOre) : "—"}</td>
                <td style={tdStyle({ color: margColor, fontWeight: 600 })}>{eur(c.margine)}</td>
                <td style={tdStyle()}>
                  {pct !== null ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ flex: 1, height: 5, background: "#e4e4e7", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${Math.max(0, Math.min(100, pct)).toFixed(0)}%`, background: pctColor, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ color: pctColor, fontWeight: 600, minWidth: 38 }}>{pct.toFixed(0)}%</span>
                    </div>
                  ) : "—"}
                </td>
                <td style={tdStyle({ color: T.textMuted })}>
                  {c.nTask > 0 && <span>{c.nTask}t</span>}
                  {c.nTask > 0 && c.nMeeting > 0 && <span style={{ margin: "0 2px", color: T.textMuted }}> · </span>}
                  {c.nMeeting > 0 && <span style={{ color: "#6366f1" }}>{c.nMeeting}m</span>}
                  {c.nTask === 0 && c.nMeeting === 0 && "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr>
              <td style={tfStyle}>Totale</td>
              <td style={tfStyle} />
              <td style={{ ...tfStyle, color: "#6366f1" }}>{totVal ? eur(totVal) : "—"}</td>
              <td style={{ ...tfStyle, color: T.textMid }}>{totOre ? `${totOre}h` : "—"}</td>
              <td style={{ ...tfStyle, color: T.textMid }}>{totCosto ? eur(totCosto) : "—"}</td>
              <td style={{ ...tfStyle, color: totMargColor }}>{eur(totMarg)}</td>
              <td style={tfStyle}>
                {totPct !== null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ flex: 1, height: 5, background: "#e4e4e7", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${Math.max(0, Math.min(100, totPct)).toFixed(0)}%`, background: totPctColor, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ color: totPctColor, fontWeight: 700, minWidth: 38 }}>{totPct.toFixed(0)}%</span>
                  </div>
                ) : "—"}
              </td>
              <td style={{ ...tfStyle, color: T.textMuted }}>
                {totTask > 0 && <span>{totTask}t</span>}
                {totTask > 0 && totMeeting > 0 && <span style={{ margin: "0 2px" }}> · </span>}
                {totMeeting > 0 && <span style={{ color: "#6366f1" }}>{totMeeting}m</span>}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
      {rows.length === 0 && <Empty msg={emptyMsg} />}
    </div>
  );
}
