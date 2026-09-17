"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { useTheme, Skeleton, ACCENT, GOLD, POSITIVE, type Palette } from "./shared";
import type { ContentBlock } from "@/lib/client-roadmap";

// ─── Formati ──────────────────────────────────────────────────────

/** Date di Notion (YYYY-MM-DD) lette come giorno locale, senza slittamenti di fuso. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function fmtDay(iso: string | null, withYear = false): string {
  if (!iso) return "—";
  const d = parseDay(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", ...(withYear || !sameYear ? { year: "numeric" } : {}) });
}

export function fmtDurata(ore: number | null): string {
  if (!ore || ore <= 0) return "—";
  const minuti = Math.round(ore * 60);
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function secondaryBtn(palette: Palette): React.CSSProperties {
  return {
    padding: "0.45rem 0.9rem", borderRadius: 8,
    border: `1px solid ${palette.cardBorder}`, background: palette.buttonHover,
    color: palette.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  };
}

// ─── Caricamento contenuti ────────────────────────────────────────

export type ContentState = { status: "loading" } | { status: "ready"; blocks: ContentBlock[] } | { status: "error" };

/** Contenuto delle pagine da `${baseUrl}/${id}`, caricato una volta sola per pagina. */
export function useNotionContent(baseUrl: string) {
  const [contents, setContents] = useState<Record<string, ContentState>>({});
  const inflight = useRef(new Map<string, Promise<void>>());

  const load = useCallback((id: string, force = false) => {
    const pending = inflight.current.get(id);
    if (pending && !force) return pending;
    const run = (async () => {
      setContents((c) => ({ ...c, [id]: { status: "loading" } }));
      try {
        const res = await fetch(`${baseUrl}/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as { blocks: ContentBlock[] };
        setContents((c) => ({ ...c, [id]: { status: "ready", blocks: json.blocks } }));
      } catch {
        setContents((c) => ({ ...c, [id]: { status: "error" } }));
        inflight.current.delete(id);
      }
    })();
    inflight.current.set(id, run);
    return run;
  }, [baseUrl]);

  return { contents, load };
}

export function ContentPanel({ state, onRetry, emptyLabel }: {
  state: ContentState | undefined; onRetry: () => void; emptyLabel: string;
}) {
  const { palette } = useTheme();
  if (!state || state.status === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width="40%" height={12} /><Skeleton width="90%" height={10} /><Skeleton width="80%" height={10} /><Skeleton width="85%" height={10} />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: palette.textMuted }}>Contenuto in aggiornamento.</span>
        <button type="button" onClick={onRetry} style={secondaryBtn(palette)}>Riprova</button>
      </div>
    );
  }
  if (state.blocks.length === 0) return <span style={{ fontSize: 12, color: palette.textDim }}>{emptyLabel}</span>;
  return <NotionBlocks blocks={state.blocks} />;
}

// ─── Rendering dei blocchi Notion ─────────────────────────────────

export function NotionBlocks({ blocks }: { blocks: ContentBlock[] }) {
  const { palette } = useTheme();
  // Le voci di elenco consecutive diventano un'unica lista
  const groups: { kind: "ul" | "ol" | "todo" | "single"; blocks: ContentBlock[] }[] = [];
  for (const b of blocks) {
    const kind = b.type === "bulleted_list_item" ? "ul" : b.type === "numbered_list_item" ? "ol" : b.type === "to_do" ? "todo" : "single";
    const last = groups[groups.length - 1];
    if (kind !== "single" && last?.kind === kind) last.blocks.push(b);
    else groups.push({ kind, blocks: [b] });
  }
  const text = palette.textMuted;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, color: text, minWidth: 0 }}>
      {groups.map((g, i) => {
        if (g.kind === "ul" || g.kind === "ol") {
          const List = g.kind;
          return (
            <List key={i} style={{ margin: "4px 0", paddingLeft: 20, listStyleType: g.kind === "ol" ? "decimal" : "disc" }}>
              {g.blocks.map((b, j) => (
                <li key={j} style={{ margin: "2px 0" }}>
                  <Spans block={b} />
                  {b.children && <NotionBlocks blocks={b.children} />}
                </li>
              ))}
            </List>
          );
        }
        if (g.kind === "todo") {
          return (
            <ul key={i} style={{ listStyle: "none", margin: "4px 0", padding: 0 }}>
              {g.blocks.map((b, j) => (
                <li key={j} style={{ display: "flex", gap: 8, margin: "3px 0" }}>
                  <span aria-label={b.checked ? "Fatto" : "Da fare"} style={{
                    flexShrink: 0, width: 14, height: 14, marginTop: 4, borderRadius: 3,
                    border: `1.5px solid ${b.checked ? POSITIVE : palette.textFaint}`,
                    background: b.checked ? POSITIVE : "transparent",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {b.checked && <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  <div style={{ minWidth: 0, textDecoration: b.checked ? "line-through" : "none", color: b.checked ? palette.textDim : text }}>
                    <Spans block={b} />
                    {b.children && <NotionBlocks blocks={b.children} />}
                  </div>
                </li>
              ))}
            </ul>
          );
        }
        return <SingleBlock key={i} block={g.blocks[0]} />;
      })}
    </div>
  );
}

function SingleBlock({ block: b }: { block: ContentBlock }) {
  const { palette } = useTheme();
  switch (b.type) {
    case "heading_1":
    case "heading_2":
    case "heading_3": {
      const size = b.type === "heading_1" ? 17 : b.type === "heading_2" ? 15 : 13;
      return (
        <div style={{ fontSize: size, fontWeight: 700, color: palette.text, margin: "16px 0 4px" }}>
          <Spans block={b} />
          {b.children && <NotionBlocks blocks={b.children} />}
        </div>
      );
    }
    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid ${palette.divider}`, margin: "14px 0" }} />;
    case "quote":
    case "callout":
      return (
        <div style={{
          margin: "8px 0", padding: b.type === "callout" ? "8px 12px" : "2px 12px",
          borderLeft: `3px solid ${b.type === "callout" ? GOLD : palette.cardBorder}`,
          background: b.type === "callout" ? palette.divider : "transparent", borderRadius: b.type === "callout" ? 6 : 0,
        }}>
          <Spans block={b} />
          {b.children && <NotionBlocks blocks={b.children} />}
        </div>
      );
    case "toggle":
      return (
        <details style={{ margin: "4px 0" }}>
          <summary style={{ cursor: "pointer" }}><Spans block={b} /></summary>
          <div style={{ paddingLeft: 18 }}>{b.children && <NotionBlocks blocks={b.children} />}</div>
        </details>
      );
    case "code":
      return (
        <pre style={{
          margin: "8px 0", padding: "10px 12px", borderRadius: 8, overflowX: "auto",
          background: palette.divider, border: `1px solid ${palette.cardBorder}`,
          fontSize: 12, lineHeight: 1.5, color: palette.text,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}>{(b.spans ?? []).map((s) => s.text).join("")}</pre>
      );
    case "table":
      return (
        <div style={{ margin: "8px 0", overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: "100%" }}>
            <tbody>
              {(b.rows ?? []).map((row, r) => {
                const isHead = b.header && r === 0;
                return (
                  <tr key={r} style={{ background: isHead ? palette.divider : undefined }}>
                    {row.map((cell, c) => {
                      const Cell = isHead ? "th" : "td";
                      return (
                        <Cell key={c} style={{
                          padding: "6px 10px", border: `1px solid ${palette.cardBorder}`,
                          textAlign: "left", verticalAlign: "top",
                          fontWeight: isHead ? 700 : 400, color: isHead ? palette.text : palette.textMuted,
                        }}>
                          <Spans block={{ type: "paragraph", spans: cell }} />
                        </Cell>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    case "image":
      return b.url ? (
        <figure style={{ margin: "10px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.url} alt={b.spans?.map((s) => s.text).join("") || ""} loading="lazy"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ maxWidth: "100%", borderRadius: 8, border: `1px solid ${palette.cardBorder}` }} />
        </figure>
      ) : null;
    default:
      return (
        <div style={{ margin: "4px 0" }}>
          <Spans block={b} />
          {b.children && <div style={{ paddingLeft: 18 }}><NotionBlocks blocks={b.children} /></div>}
        </div>
      );
  }
}

function Spans({ block }: { block: ContentBlock }) {
  const { palette } = useTheme();
  return (
    <>
      {(block.spans ?? []).map((s, i) => {
        let node: React.ReactNode = s.text;
        if (s.code) node = <code style={{ fontSize: "0.92em", padding: "0 4px", borderRadius: 4, background: palette.divider }}>{node}</code>;
        if (s.bold) node = <strong style={{ color: palette.text }}>{node}</strong>;
        if (s.italic) node = <em>{node}</em>;
        if (s.strike) node = <s>{node}</s>;
        if (s.href) node = <a href={s.href} target="_blank" rel="noopener noreferrer" style={{ color: ACCENT, textDecoration: "underline" }}>{node}</a>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}
