"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientData = {
  id: string;
  nome: string;
  calendly: string;
  googleDrive: string;
  lookerStudio: string;
  altriLink: string;
  crmId: string | null;
};

type Task = {
  id: string;
  nome: string;
  stato: string;
  priorita: string;
  scadenza: string | null;
  assignedTo: string[];
  cliente: string[];
  durata?: number;
  content?: string;
};

type Meeting = {
  id: string;
  titolo: string;
  data: string | null;
  tipo: string;
  durata?: number;
  content?: string;
};

type LinkedItem = {
  id: string;
  nome: string;
  tipo: "Task" | "Meeting" | "Internal Review";
  data: string | null;
  durata: number | null;
};

type Pacchetto = {
  id: string;
  nome: string;
  oreAcquistate: number;
  oreUsate: number;
  oreRimanenti: number;
  linkedItems: LinkedItem[];
};

type Fattura = {
  id: string;
  nome: string;
  dataEmissione: string | null;
  emessa: boolean;
};

type LinkRapido = {
  label: string;
  url: string;
};

type Props = {
  client: ClientData;
  tasks: Task[];
  meetings: Meeting[];
  fatture: Fattura[];
  pacchetti: Pacchetto[];
  linkRapidi: LinkRapido[];
  slug: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMPLETED_STATI = ["fatto", "completato", "done", "completata", "✅ fatto"];

function isCompleted(stato: string) {
  return COMPLETED_STATI.includes(stato.toLowerCase());
}

function isInCorso(stato: string) {
  const s = stato.toLowerCase();
  return s === "in corso" || s === "in progress" || s === "in lavorazione";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

type PriorityColor = { dot: string; bg: string; text: string };

function priorityStyle(p: string): PriorityColor {
  const lower = p.toLowerCase();
  if (lower === "alta" || lower === "urgente") return { dot: "#ef4444", bg: "rgba(239,68,68,0.1)", text: "#dc2626" };
  if (lower === "media") return { dot: "#f59e0b", bg: "rgba(245,158,11,0.1)", text: "#b45309" };
  if (lower === "bassa") return { dot: "#3b82f6", bg: "rgba(59,130,246,0.1)", text: "#2563eb" };
  return { dot: "#9ca3af", bg: "rgba(156,163,175,0.1)", text: "#6b7280" };
}

function statoStyle(stato: string): { bg: string; color: string } {
  const s = stato.toLowerCase();
  if (s === "in corso" || s === "in progress") return { bg: "rgba(59,130,246,0.1)", color: "#2563eb" };
  if (s === "in review") return { bg: "rgba(139,92,246,0.1)", color: "#7c3aed" };
  if (s === "bloccato" || s === "blocked") return { bg: "rgba(239,68,68,0.1)", color: "#dc2626" };
  return { bg: "rgba(107,114,128,0.1)", color: "#374151" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: 12,
      border: "1px solid #e8e6e3",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid #f0ede9",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ color: "#1a2580" }}>{icon}</span>
        <h2 style={{ color: "#0d0e1f", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Tab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.45rem 0.9rem",
        borderRadius: 7,
        border: "none",
        background: active ? "#1a2580" : "transparent",
        color: active ? "#ffffff" : "#5c5f6e",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.15s",
      }}
    >
      {label}
      <span style={{
        padding: "1px 6px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: active ? "rgba(255,255,255,0.2)" : "#f0ede9",
        color: active ? "#fff" : "#5c5f6e",
      }}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: "2.5rem 1.25rem", textAlign: "center", color: "#9c9a97", fontSize: 14 }}>
      {message}
    </div>
  );
}

// ─── Tasks Section ────────────────────────────────────────────────────────────

function TasksSection({ tasks }: { tasks: Task[] }) {
  const [tab, setTab] = useState<"attive" | "completate">("attive");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleTask(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const active = tasks.filter((t) => !isCompleted(t.stato));
  const completed = tasks.filter((t) => isCompleted(t.stato));
  const inCorso = active.filter((t) => isInCorso(t.stato));
  const daFare = active.filter((t) => !isInCorso(t.stato));
  const displayed = tab === "attive" ? active : completed;

  function TaskRow({ task }: { task: Task }) {
    const overdue = !isCompleted(task.stato) && isOverdue(task.scadenza);
    const sStyle = statoStyle(task.stato);
    const isOpen = expanded.has(task.id);
    const hasContent = !!task.content?.trim();

    return (
      <div style={{ borderBottom: "1px solid #f5f3f0" }}>
        <div
          onClick={() => hasContent && toggleTask(task.id)}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: "0.75rem",
            alignItems: "center",
            padding: "0.75rem 1.25rem",
            cursor: hasContent ? "pointer" : "default",
          }}
        >
          {/* Name + assigned */}
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 14, fontWeight: 500, color: "#0d0e1f", margin: 0,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {task.nome || "—"}
            </p>
            {task.assignedTo.length > 0 && (
              <p style={{ fontSize: 12, color: "#9c9a97", margin: "2px 0 0" }}>
                {task.assignedTo.join(", ")}
              </p>
            )}
          </div>

          {/* Stato badge */}
          {!isCompleted(task.stato) && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px",
              borderRadius: 20, background: sStyle.bg, color: sStyle.color, whiteSpace: "nowrap",
            }}>
              {task.stato}
            </span>
          )}

          {/* Scadenza */}
          <span style={{
            fontSize: 12, whiteSpace: "nowrap",
            color: overdue ? "#dc2626" : "#5c5f6e",
            fontWeight: overdue ? 600 : 400,
          }}>
            {task.scadenza ? formatDate(task.scadenza) : "—"}
          </span>

          {/* Expand chevron */}
          {hasContent ? (
            <svg width="14" height="14" fill="none" stroke="#9c9a97" strokeWidth="2" viewBox="0 0 24 24"
              style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : <span />}
        </div>

        {isOpen && hasContent && (
          <div style={{ padding: "0 1.25rem 0.75rem" }}>
            <p style={{
              margin: 0, fontSize: 13, color: "#0d0e1f", lineHeight: 1.7,
              whiteSpace: "pre-wrap", background: "#faf9f7",
              padding: "0.75rem 1rem", borderRadius: 8, border: "1px solid #ede9e4",
            }}>
              {task.content}
            </p>
          </div>
        )}
      </div>
    );
  }

  function GroupLabel({ label }: { label: string }) {
    return (
      <div style={{
        padding: "0.4rem 1.25rem", fontSize: 11, fontWeight: 700,
        color: "#9c9a97", letterSpacing: "0.06em", textTransform: "uppercase",
        background: "#faf9f7", borderBottom: "1px solid #f0ede9",
      }}>
        {label}
      </div>
    );
  }

  return (
    <SectionCard title="Task" icon={
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    }>
      <div style={{ padding: "0.75rem 1.25rem", display: "flex", gap: 6, borderBottom: "1px solid #f0ede9" }}>
        <Tab label="Attive" count={active.length} active={tab === "attive"} onClick={() => setTab("attive")} />
        <Tab label="Completate" count={completed.length} active={tab === "completate"} onClick={() => setTab("completate")} />
      </div>

      {displayed.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto auto auto",
          gap: "0.75rem", padding: "0.5rem 1.25rem",
          fontSize: 11, fontWeight: 700, color: "#9c9a97",
          letterSpacing: "0.05em", textTransform: "uppercase",
          background: "#faf9f7", borderBottom: "1px solid #f0ede9",
        }}>
          <span>Nome</span>
          <span>Stato</span>
          <span>Scadenza</span>
          <span />
        </div>
      )}

      {tab === "attive" ? (
        active.length === 0 ? <EmptyState message="Nessun task attivo" /> : (
          <>
            {inCorso.length > 0 && <><GroupLabel label="In corso" />{inCorso.map((t) => <TaskRow key={t.id} task={t} />)}</>}
            {daFare.length > 0 && <><GroupLabel label="Da fare" />{daFare.map((t) => <TaskRow key={t.id} task={t} />)}</>}
          </>
        )
      ) : (
        completed.length === 0 ? <EmptyState message="Nessun task completato" /> :
          completed.map((t) => <TaskRow key={t.id} task={t} />)
      )}
    </SectionCard>
  );
}

// ─── Meetings Section ─────────────────────────────────────────────────────────

function MeetingsSection({ meetings }: { meetings: Meeting[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <SectionCard title="Call e Incontri" icon={
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    }>
      {meetings.length === 0 ? (
        <EmptyState message="Nessuna call registrata" />
      ) : (
        meetings.map((m) => {
          const isOpen = expanded.has(m.id);
          const hasContent = !!m.content?.trim();
          return (
            <div key={m.id} style={{ borderBottom: "1px solid #f5f3f0" }}>
              <div
                onClick={() => hasContent && toggle(m.id)}
                style={{
                  padding: "0.9rem 1.25rem",
                  cursor: hasContent ? "pointer" : "default",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#5c5f6e", fontWeight: 500 }}>
                      {formatDate(m.data)}
                    </span>
                    {m.tipo && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px",
                        borderRadius: 20, background: "rgba(26,37,128,0.08)", color: "#1a2580",
                      }}>
                        {m.tipo}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: "#0d0e1f", fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                    {m.titolo || "Call"}
                  </p>
                </div>
                {hasContent && (
                  <svg
                    width="16" height="16" fill="none" stroke="#9c9a97" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ flexShrink: 0, marginTop: 2, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </div>
              {isOpen && hasContent && (
                <div style={{
                  padding: "0 1.25rem 1rem",
                  borderTop: "1px solid #f5f3f0",
                }}>
                  <p style={{
                    margin: "0.75rem 0 0",
                    fontSize: 13,
                    color: "#0d0e1f",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    background: "#faf9f7",
                    padding: "0.75rem 1rem",
                    borderRadius: 8,
                    border: "1px solid #ede9e4",
                  }}>
                    {m.content}
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </SectionCard>
  );
}

// ─── Pacchetti Ore Section ────────────────────────────────────────────────────

const TIPO_STYLE: Record<LinkedItem["tipo"], { bg: string; color: string }> = {
  "Task":            { bg: "rgba(26,37,128,0.08)",   color: "#1a2580" },
  "Meeting":         { bg: "rgba(196,123,34,0.1)",   color: "#b45309" },
  "Internal Review": { bg: "rgba(139,92,246,0.1)",   color: "#7c3aed" },
};

function PacchettiSection({ pacchetti }: { pacchetti: Pacchetto[] }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  if (pacchetti.length === 0) return null;

  function toggle(id: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      {pacchetti.map((p) => {
        const pct = p.oreAcquistate > 0
          ? Math.min(100, Math.round((p.oreUsate / p.oreAcquistate) * 100))
          : 0;
        const overBudget = p.oreRimanenti < 0;
        const isOpen = openItems.has(p.id);

        return (
          <SectionCard key={p.id} title={`Pacchetto ore — ${p.nome}`} icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }>
            {/* Stats */}
            <div style={{ padding: "1.25rem 1.25rem 1.25rem" }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1rem" }}>
                {[
                  { label: "Acquistate", value: p.oreAcquistate, color: "#1a2580" },
                  { label: "Utilizzate", value: p.oreUsate, color: "#c47b22" },
                  { label: "Rimanenti", value: p.oreRimanenti, color: overBudget ? "#dc2626" : "#16a34a" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    flex: "1 1 80px", background: "#faf9f7",
                    border: "1px solid #e8e6e3", borderRadius: 10,
                    padding: "0.75rem 1rem", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
                      {value}h
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9c9a97", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#5c5f6e" }}>Utilizzo</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: overBudget ? "#dc2626" : "#0d0e1f" }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ height: 8, background: "#e8e6e3", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, borderRadius: 99,
                    background: overBudget ? "#dc2626" : pct > 80 ? "#f59e0b" : "#1a2580",
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            </div>

            {/* Collapsible linked items */}
            {p.linkedItems.length > 0 && (
              <>
                <button
                  onClick={() => toggle(p.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "0.6rem 1.25rem",
                    background: "#faf9f7", border: "none", borderTop: "1px solid #f0ede9",
                    cursor: "pointer", fontSize: 12, fontWeight: 700,
                    color: "#5c5f6e", letterSpacing: "0.05em", textTransform: "uppercase",
                  }}
                >
                  <span>Attività collegate ({p.linkedItems.length})</span>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <>
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr auto auto auto",
                      gap: "0.75rem", padding: "0.5rem 1.25rem",
                      fontSize: 11, fontWeight: 700, color: "#9c9a97",
                      letterSpacing: "0.05em", textTransform: "uppercase",
                      background: "#faf9f7", borderBottom: "1px solid #f0ede9",
                    }}>
                      <span>Nome</span>
                      <span>Tipologia</span>
                      <span>Data</span>
                      <span>Durata</span>
                    </div>
                    {p.linkedItems.map((item) => {
                      const ts = TIPO_STYLE[item.tipo];
                      return (
                        <div key={item.id} style={{
                          display: "grid", gridTemplateColumns: "1fr auto auto auto",
                          gap: "0.75rem", alignItems: "center",
                          padding: "0.65rem 1.25rem", borderBottom: "1px solid #f5f3f0",
                        }}>
                          <p title={item.nome} style={{
                            fontSize: 13, fontWeight: 500, color: "#0d0e1f", margin: 0,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {item.nome || "—"}
                          </p>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 8px",
                            borderRadius: 20, whiteSpace: "nowrap",
                            background: ts.bg, color: ts.color,
                          }}>
                            {item.tipo}
                          </span>
                          <span style={{ fontSize: 12, color: "#5c5f6e", whiteSpace: "nowrap" }}>
                            {item.data ? formatDate(item.data) : "—"}
                          </span>
                          <span style={{ fontSize: 12, color: "#5c5f6e", whiteSpace: "nowrap" }}>
                            {item.durata != null ? `${item.durata}h` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </SectionCard>
        );
      })}
    </>
  );
}

// ─── Fatturazioni Section ─────────────────────────────────────────────────────

function FatturazioniSection({ fatture }: { fatture: Fattura[] }) {
  return (
    <SectionCard title="Fatturazioni" icon={
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    }>
      {fatture.length === 0 ? (
        <EmptyState message="Nessuna fattura trovata" />
      ) : (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto auto",
            gap: "0.75rem", padding: "0.5rem 1.25rem",
            fontSize: 11, fontWeight: 700, color: "#9c9a97",
            letterSpacing: "0.05em", textTransform: "uppercase",
            background: "#faf9f7", borderBottom: "1px solid #f0ede9",
          }}>
            <span>Descrizione</span>
            <span>Data</span>
            <span>Stato</span>
          </div>
          {fatture.map((f) => (
            <div key={f.id} style={{
              display: "grid", gridTemplateColumns: "1fr auto auto",
              gap: "0.75rem", alignItems: "center",
              padding: "0.75rem 1.25rem", borderBottom: "1px solid #f5f3f0",
            }}>
              <p title={f.nome} style={{ fontSize: 14, fontWeight: 500, color: "#0d0e1f", margin: 0,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {f.nome || "—"}
              </p>
              <span style={{ fontSize: 12, color: "#5c5f6e", whiteSpace: "nowrap" }}>
                {formatDate(f.dataEmissione)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                whiteSpace: "nowrap",
                background: f.emessa ? "rgba(22,163,74,0.1)" : "rgba(245,158,11,0.1)",
                color: f.emessa ? "#16a34a" : "#b45309",
              }}>
                {f.emessa ? "Emessa" : "In attesa"}
              </span>
            </div>
          ))}
        </>
      )}
    </SectionCard>
  );
}

// ─── Contacts Section ─────────────────────────────────────────────────────────

const CONTACTS = [
  {
    name: "Alex Duma",
    role: "Strategia & Performance",
    email: "alex@performanceflows.com",
    calendly: "https://calendly.com/alex-performanceflows",
    initials: "AD",
    color: "#1a2580",
  },
];

function ContactsSection() {
  return (
    <SectionCard title="I tuoi referenti" icon={
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    }>
      <div style={{ padding: "1rem 1.25rem", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {CONTACTS.map((c) => (
          <div key={c.email} style={{
            flex: "1 1 220px",
            padding: "1.25rem",
            borderRadius: 10,
            border: "1px solid #e8e6e3",
            background: "#faf9f7",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "0.75rem" }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: c.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}>
                {c.initials}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0d0e1f" }}>{c.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#5c5f6e" }}>{c.role}</p>
              </div>
            </div>
            <a
              href={`mailto:${c.email}`}
              style={{ display: "block", fontSize: 13, color: "#1a2580", textDecoration: "none", marginBottom: "0.6rem" }}
            >
              {c.email}
            </a>
            <a
              href={c.calendly}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0.4rem 0.8rem",
                borderRadius: 7,
                border: "1px solid",
                borderColor: c.color,
                color: c.color,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Prenota call
            </a>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Link Rapidi Section ──────────────────────────────────────────────────────

function getLinkHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function LinkRapidiSection({ links }: { links: LinkRapido[] }) {
  if (links.length === 0) return null;
  return (
    <SectionCard title="Link Rapidi" icon={
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    }>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem",
        padding: "0.5rem 1.25rem", fontSize: 11, fontWeight: 700, color: "#9c9a97",
        letterSpacing: "0.05em", textTransform: "uppercase",
        background: "#faf9f7", borderBottom: "1px solid #f0ede9",
      }}>
        <span>Documento</span>
        <span>Link</span>
      </div>
      {links.map((l, i) => (
        <div key={`${l.url}-${i}`} style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem",
          alignItems: "center", padding: "0.75rem 1.25rem",
          borderBottom: i === links.length - 1 ? "none" : "1px solid #f5f3f0",
        }}>
          <p title={l.label} style={{
            fontSize: 14, fontWeight: 500, color: "#0d0e1f", margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {l.label || "—"}
          </p>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            title={l.url}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0.35rem 0.75rem", borderRadius: 7,
              border: "1px solid #1a2580", color: "#1a2580",
              fontSize: 12, fontWeight: 600, textDecoration: "none",
              whiteSpace: "nowrap", maxWidth: 220,
              overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{getLinkHostname(l.url)}</span>
          </a>
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Calcolo mensile CTA (OnlyWood) ───────────────────────────────────────────

function CalcoloMensileCta() {
  return (
    <a
      href="/clienti/onlywood/calcolo-mensile"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: "linear-gradient(135deg, #1a2580 0%, #262f8f 100%)",
        color: "#ffffff",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(26,37,128,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Report mensile
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Calcolo fee del mese
          </p>
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
        Apri →
      </span>
    </a>
  );
}

// ─── Main Portal View ─────────────────────────────────────────────────────────

export function PortalView({ client, tasks, meetings, fatture, pacchetti, linkRapidi, slug }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/clienti/login", { method: "DELETE" });
    router.refresh();
  }

  const calendlyUrl = client.calendly || "https://calendly.com/alex-performanceflows";

  return (
    <div style={{ minHeight: "100dvh", background: "#f7f6f4", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <header style={{
        background: "#1a2580",
        padding: "0 1.5rem",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 8px rgba(0,0,0,0.18)",
      }}>
        {/* Left: logo + client name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image
            src="/images/logo-white.webp"
            alt="Performance Flows"
            width={194}
            height={80}
            priority
            style={{ height: 32, width: "auto", display: "block" }}
          />
          <div style={{
            width: 1, height: 26,
            background: "rgba(255,255,255,0.22)",
            flexShrink: 0,
          }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            {client.nome}
          </p>
        </div>

        {/* Right: Calendly CTA + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0.45rem 0.9rem",
              borderRadius: 7,
              background: "#c47b22",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="pf-hide-mobile">Prenota una call</span>
          </a>
          <button
            onClick={handleLogout}
            title="Esci"
            style={{
              width: 34,
              height: 34,
              borderRadius: 7,
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 940, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
        {/* Welcome bar */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0d0e1f", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Ciao, {client.nome} 👋
          </h1>
          <p style={{ fontSize: 14, color: "#5c5f6e", margin: 0 }}>
            Ecco il riepilogo aggiornato del tuo progetto.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {slug === "onlywood" && <CalcoloMensileCta />}
          <LinkRapidiSection links={linkRapidi} />
          <TasksSection tasks={tasks} />
          <MeetingsSection meetings={meetings} />
          <PacchettiSection pacchetti={pacchetti} />
          <FatturazioniSection fatture={fatture} />
          <ContactsSection />
        </div>
      </main>

      {/* Mobile responsive helper */}
      <style>{`
        @media (max-width: 500px) {
          .pf-hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
