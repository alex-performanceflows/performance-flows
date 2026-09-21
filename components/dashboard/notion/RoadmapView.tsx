"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import {
  useTheme, fmtDateTime,
  Card, EmptyState, Skeleton, tableStyles, useElementWidth,
  type Palette,
} from "@/app/dashboard/vitaedna/_components/shared";
import {
  ContentPanel, fmtDay, parseDay, secondaryBtn, useNotionContent, useNotionUi,
  type ContentState,
} from "./notionContent";
import type { RoadmapItem, RoadmapOwner } from "@/lib/client-roadmap";

type RoadmapPayload = { items: RoadmapItem[]; aggiornato: string };
type View = "lineare" | "categoria" | "kanban";
const VIEWS: { key: View; label: string }[] = [
  { key: "lineare", label: "Lineare" },
  { key: "categoria", label: "Per categoria" },
  { key: "kanban", label: "Kanban" },
];

const FASI = ["Onboarding", "Set-up", "A Regime", "Espansione"];
const POSITIVE = "#22c55e";
const IN_PROGRESS = "#c9a227";
const IN_REVIEW = "#0ea5e9";

/** "Cliente" nel database Notion diventa il nome del cliente di questa dashboard. */
function ownerLabel(owner: RoadmapOwner, clientName: string): string {
  if (owner === "cliente") return clientName;
  return owner === "joint" ? "Insieme" : "Performance Flows";
}

function statusColor(status: string | null, palette: Palette): string {
  if (status === "Completata") return POSITIVE;
  if (status === "In corso") return IN_PROGRESS;
  if (status === "In review") return IN_REVIEW;
  return palette.textMuted;
}

/** Colori delle etichette di Notion, così la categoria ha lo stesso colore che si vede in Notion. */
const NOTION_TAG_COLORS: Record<string, string> = {
  default: "#8f8e8a", gray: "#787774", brown: "#9f6b53", orange: "#d9730d", yellow: "#cb912f",
  green: "#448361", blue: "#337ea9", purple: "#9065b0", pink: "#c14c8a", red: "#d44c47",
};

const byDate = (a: RoadmapItem, b: RoadmapItem) =>
  (a.entro ?? "9999").localeCompare(b.entro ?? "9999") || a.attivita.localeCompare(b.attivita, "it");

/** Roadmap del cliente: i dati arrivano da `endpoint`, colori e nome dal contesto. */
export default function RoadmapView({ endpoint, viewKey }: { endpoint: string; viewKey: string }) {
  const { palette } = useTheme();
  const { accent, accentSoft } = useNotionUi();
  const [data, setData] = useState<RoadmapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<View>(() => {
    try {
      const saved = localStorage.getItem(viewKey);
      return VIEWS.some((v) => v.key === saved) ? (saved as View) : "lineare";
    } catch { return "lineare"; }
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const { contents, load: loadContent } = useNotionContent(endpoint);

  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as RoadmapPayload);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  function changeView(v: View) {
    setView(v);
    try { localStorage.setItem(viewKey, v); } catch {}
  }

  const toggle = useCallback((item: RoadmapItem) => {
    if (!item.hasContent) return;
    setOpenId((cur) => (cur === item.id ? null : item.id));
    loadContent(item.id);
  }, [loadContent]);

  const rowProps = { openId, contents, onToggle: toggle, onRetry: (id: string) => loadContent(id, true) };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 20,
        ["--pf-accent" as string]: accent,
        ["--pf-ink" as string]: palette.text,
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Roadmap strategica</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
            Il piano di lavoro condiviso con il team Performance Flows. Le attività con il pulsante <strong style={{ color: palette.textMuted }}>Dettagli</strong> si aprono con un clic.
            {data?.aggiornato && <> Aggiornato {fmtDateTime(data.aggiornato)}.</>}
          </p>
        </div>
        <ViewSwitch view={view} onChange={changeView} />
      </div>

      {loading && !data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={180} style={{ borderRadius: 14 }} />)}
        </div>
      )}

      {failed && !data && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: palette.textMuted }}>Roadmap in aggiornamento: riprova tra qualche istante.</span>
            <button type="button" onClick={load} style={secondaryBtn(palette)}>Riprova</button>
          </div>
        </Card>
      )}

      {data && data.items.length === 0 && <Card><EmptyState label="La roadmap è in preparazione" /></Card>}

      {data && data.items.length > 0 && (
        view === "kanban"
          ? <KanbanView items={data.items} {...rowProps} />
          : view === "categoria"
            ? <TableView groups={groupByCategory(data.items)} showCategory={false} {...rowProps} />
            : <TableView groups={groupByMonth(data.items)} showCategory {...rowProps} />
      )}
      <style>{`
        .pf-roadmap-clickable:hover { background: ${palette.buttonHover} !important; }
        .pf-roadmap-clickable:focus-visible, .pf-roadmap-chip:focus-visible { outline: 2px solid ${accentSoft}; outline-offset: 1px; }
        @media (max-width: 640px) { .pf-roadmap-panel { padding-left: 6px !important; } }
        .pf-roadmap-table tbody tr.pf-roadmap-clickable:hover td { background: ${palette.buttonHover}; }
      `}</style>
    </div>
  );
}

function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const { palette } = useTheme();
  return (
    <div role="group" aria-label="Vista della roadmap" style={{
      display: "inline-flex", padding: 3, borderRadius: 10,
      border: `1px solid ${palette.cardBorder}`, background: palette.cardBg,
    }}>
      {VIEWS.map((o) => (
        <button key={o.key} type="button" aria-pressed={view === o.key} onClick={() => onChange(o.key)} style={{
          padding: "0.4rem 0.85rem", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit",
          fontSize: 12, fontWeight: 600,
          background: view === o.key ? palette.buttonHover : "transparent",
          color: view === o.key ? palette.text : palette.textMuted,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

type RowProps = {
  openId: string | null;
  contents: Record<string, ContentState>;
  onToggle: (item: RoadmapItem) => void;
  onRetry: (id: string) => void;
};

// ─── Viste a tabella: per mese (lineare) o per categoria ──────────

type TableGroup = { key: string; label: React.ReactNode; list: RoadmapItem[] };

/** Vista lineare: attività in ordine di scadenza, raggruppate per mese. */
function groupByMonth(items: RoadmapItem[]): TableGroup[] {
  const groups = new Map<string, RoadmapItem[]>();
  for (const it of [...items].sort(byDate)) {
    const key = it.entro ? it.entro.slice(0, 7) : "senza-data";
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups.entries()].map(([key, list]) => {
    const label = key === "senza-data"
      ? "Senza data"
      : parseDay(`${key}-01`).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    return { key, label: label.charAt(0).toUpperCase() + label.slice(1), list };
  });
}

/** Vista per categoria: categorie in ordine alfabetico, attività per scadenza. */
function groupByCategory(items: RoadmapItem[]): TableGroup[] {
  const groups = new Map<string, RoadmapItem[]>();
  for (const it of [...items].sort(byDate)) {
    const key = it.categoria ?? "";
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "it")))
    .map(([key, list]) => {
      const hue = NOTION_TAG_COLORS[list[0].categoriaColor ?? "default"] ?? NOTION_TAG_COLORS.default;
      return {
        key: key || "senza-categoria",
        label: key
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: hue }} />{key}
            </span>
          : "Senza categoria",
        list,
      };
    });
}

function TableView({ groups, showCategory, openId, contents, onToggle, onRetry }: {
  groups: TableGroup[];
  /** Nella vista per categoria la colonna sarebbe ripetitiva. */
  showCategory: boolean;
} & RowProps) {
  const { palette } = useTheme();
  const { clientName } = useNotionUi();
  const ts = tableStyles(palette);
  // Il dettaglio aperto resta a vista anche con la tabella scrollata in orizzontale
  const { ref: wrapRef, width: wrapWidth } = useElementWidth<HTMLDivElement>();
  const columns = ["Entro", "Attività", "Stato", ...(showCategory ? ["Categoria"] : []), "A cura di", ""];

  const td: React.CSSProperties = { ...ts.tdBase, verticalAlign: "middle", fontSize: 12 };

  return (
    <Card>
      <div ref={wrapRef} style={{ overflowX: "auto" }}>
        <table className="pf-roadmap-table" style={ts.table}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i} style={{ ...ts.th, ...(c === "Attività" ? { width: "40%" } : {}), ...(i === columns.length - 1 ? { textAlign: "right" as const } : {}) }}>
                  {c || <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Dettagli</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((m) => (
              <Fragment key={m.key}>
                <tr>
                  <td colSpan={columns.length} style={{
                    padding: "16px 10px 6px", borderBottom: `1px solid ${palette.cardBorder}`,
                    fontSize: 11, fontWeight: 700, color: palette.textDim, letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {m.label} <span style={{ fontWeight: 500 }}>· {m.list.length}</span>
                  </td>
                </tr>
                {m.list.map((it) => {
                  const isOpen = openId === it.id;
                  const done = it.status === "Completata";
                  const panelId = `roadmap-${it.id}`;
                  return (
                    <Fragment key={it.id}>
                      <tr
                        className={it.hasContent ? "pf-roadmap-clickable" : undefined}
                        onClick={it.hasContent ? () => onToggle(it) : undefined}
                        style={{ cursor: it.hasContent ? "pointer" : "default", background: isOpen ? palette.buttonHover : undefined }}
                      >
                        <td style={{ ...td, whiteSpace: "nowrap", fontSize: 11, color: palette.textDim, fontVariantNumeric: "tabular-nums" }}>
                          {it.entro ? fmtDay(it.entro) : "—"}
                        </td>
                        <td style={{ ...td, minWidth: 240, fontSize: 13, fontWeight: 500, color: done ? palette.textMuted : palette.text, lineHeight: 1.35 }}>
                          {it.attivita}
                          {it.priorita === "Alta" && (
                            <span style={{ display: "block", marginTop: 2, fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.03em" }}>Priorità alta</span>
                          )}
                        </td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: statusColor(it.status, palette), fontWeight: 600 }}>
                            <StatusIcon status={it.status} size={13} />{it.status ?? "Da fare"}
                          </span>
                        </td>
                        {showCategory && (
                          <td style={{ ...td, whiteSpace: "nowrap" }}>
                            {it.categoria ? <CategoryTag name={it.categoria} color={it.categoriaColor} /> : "—"}
                          </td>
                        )}
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{it.owner ? ownerLabel(it.owner, clientName) : "—"}</td>
                        <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                          {it.hasContent && (
                            <button type="button" aria-expanded={isOpen} aria-controls={panelId}
                              onClick={(e) => { e.stopPropagation(); onToggle(it); }}
                              className="pf-roadmap-chip"
                              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
                              <DetailChip isOpen={isOpen} />
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={columns.length} style={{ padding: 0, borderBottom: `1px solid ${palette.cardBorder}`, background: palette.divider }}>
                            <div id={panelId} style={{ position: "sticky", left: 0, width: wrapWidth || "100%", boxSizing: "border-box", padding: "14px 18px 18px" }}>
                              <ContentPanel state={contents[it.id]} onRetry={() => onRetry(it.id)} emptyLabel="Nessun dettaglio per questa attività." />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Vista kanban: le attività per fase ───────────────────────────

function KanbanView({ items, ...rowProps }: { items: RoadmapItem[] } & RowProps) {
  const { palette } = useTheme();
  const phases = useMemo(() => {
    const byFase = new Map<string, RoadmapItem[]>();
    for (const it of items) {
      const k = it.fase ?? "Altre attività";
      byFase.set(k, [...(byFase.get(k) ?? []), it]);
    }
    const order = [...FASI, ...[...byFase.keys()].filter((k) => !FASI.includes(k))];
    return order.filter((k) => byFase.has(k)).map((k) => ({ fase: k, list: byFase.get(k)!.sort(byDate) }));
  }, [items]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14, alignItems: "start" }}>
      {phases.map(({ fase, list }, i) => (
        <Card key={fase}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {FASI.includes(fase) ? `Fase ${i + 1}` : "Fase"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: palette.text }}>{fase}</div>
            </div>
            <span style={{ fontSize: 12, color: palette.textDim }}>{list.length} attività</span>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {list.map((it) => <KanbanRow key={it.id} item={it} {...rowProps} />)}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function KanbanRow({ item, openId, contents, onToggle, onRetry }: { item: RoadmapItem } & RowProps) {
  const { palette } = useTheme();
  const { clientName } = useNotionUi();
  const isOpen = openId === item.id;
  const done = item.status === "Completata";
  const panelId = `roadmap-${item.id}`;
  const meta = [
    item.entro ? `entro ${fmtDay(item.entro)}` : null,
    item.owner ? ownerLabel(item.owner, clientName) : null,
  ].filter(Boolean) as string[];

  const body = (
    <>
      <span style={{ marginTop: 2, flexShrink: 0 }}><StatusIcon status={item.status} size={14} /></span>
      <span style={{ flex: 1, minWidth: 0, display: "block" }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: done ? palette.textMuted : palette.text, lineHeight: 1.35 }}>
          {item.attivita}
        </span>
        <span style={{ display: "block", marginTop: 3, fontSize: 11, color: palette.textDim, lineHeight: 1.4 }}>
          <span style={{ color: statusColor(item.status, palette), fontWeight: 600 }}>{item.status ?? "Da fare"}</span>
          {meta.map((m) => <Fragment key={m}> · {m}</Fragment>)}
          {item.priorita === "Alta" && <> · <strong style={{ color: palette.textMuted }}>priorità alta</strong></>}
        </span>
        {(item.categoria || item.hasContent) && (
          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 7 }}>
            {item.categoria && <CategoryTag name={item.categoria} color={item.categoriaColor} />}
            {item.hasContent && <DetailChip isOpen={isOpen} />}
          </span>
        )}
      </span>
    </>
  );

  const rowStyle: React.CSSProperties = {
    width: "100%", display: "flex", gap: 10, padding: "10px 6px", textAlign: "left",
    background: isOpen ? palette.buttonHover : "transparent", border: "none", borderRadius: 8,
    fontFamily: "inherit", color: palette.text,
  };

  return (
    <li style={{ borderTop: `1px solid ${palette.divider}` }}>
      {item.hasContent ? (
        <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => onToggle(item)}
          className="pf-roadmap-clickable" style={{ ...rowStyle, cursor: "pointer" }}>
          {body}
        </button>
      ) : (
        <div style={rowStyle}>{body}</div>
      )}
      {isOpen && (
        <div id={panelId} className="pf-roadmap-panel" style={{ padding: "4px 6px 16px 30px" }}>
          <ContentPanel state={contents[item.id]} onRetry={() => onRetry(item.id)} emptyLabel="Nessun dettaglio per questa attività." />
        </div>
      )}
    </li>
  );
}

/** Etichetta della categoria con il colore dell'opzione in Notion. */
function CategoryTag({ name, color }: { name: string; color: string | null }) {
  const { palette } = useTheme();
  const hue = NOTION_TAG_COLORS[color ?? "default"] ?? NOTION_TAG_COLORS.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
      background: `${hue}1f`, border: `1px solid ${hue}40`, color: palette.text,
    }}>
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "50%", background: hue, flexShrink: 0 }} />
      {name}
    </span>
  );
}

/** Pulsante "Dettagli": segnala le attività che hanno contenuto da aprire. */
function DetailChip({ isOpen }: { isOpen: boolean }) {
  const { palette } = useTheme();
  const { accent, accentSoft } = useNotionUi();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap",
      border: `1px solid ${accentSoft}66`, background: isOpen ? `${accent}29` : `${accent}14`,
      color: palette.text, fontSize: 11, fontWeight: 600,
    }}>
      <svg width="12" height="12" fill="none" stroke={accentSoft} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
      </svg>
      {isOpen ? "Chiudi" : "Dettagli"}
      <svg width="10" height="10" fill="none" stroke={accentSoft} strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"
        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

function StatusIcon({ status, size }: { status: string | null; size: number }) {
  const { palette } = useTheme();
  const color = statusColor(status, palette);
  if (status === "Completata") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block" }}>
        <circle cx="8" cy="8" r="8" fill={color} />
        <path d="M4.5 8.2l2.3 2.3 4.7-4.9" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "In corso" || status === "In review") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block" }}>
        <circle cx="8" cy="8" r="7" fill="none" stroke={color} strokeWidth="2" />
        <path d="M8 3a5 5 0 010 10z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block" }}>
      <circle cx="8" cy="8" r="7" fill="none" stroke={palette.textFaint} strokeWidth="2" />
    </svg>
  );
}
