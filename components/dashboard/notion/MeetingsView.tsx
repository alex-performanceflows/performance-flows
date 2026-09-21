"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme, fmtDateTime, Card, CardHeader, EmptyState, Skeleton } from "@/app/dashboard/vitaedna/_components/shared";
import { ContentPanel, fmtDay, fmtDurata, secondaryBtn, useNotionContent } from "./notionContent";
import type { ClientMeeting } from "@/lib/client-roadmap";

type MeetingsPayload = { meetings: ClientMeeting[]; aggiornato: string };

/** Call con il cliente: elenco e note, dai meeting non interni di Notion. */
export default function MeetingsView({ endpoint }: { endpoint: string }) {
  const { palette } = useTheme();
  const [data, setData] = useState<MeetingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { contents, load: loadContent } = useNotionContent(endpoint);

  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json() as MeetingsPayload);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  // Le note si preparano in sottofondo, dalla call più recente: all'apertura sono già pronte
  const meetings = data?.meetings;
  useEffect(() => {
    if (!meetings) return;
    let cancelled = false;
    (async () => {
      for (const m of meetings) {
        if (cancelled) return;
        await loadContent(m.id);
      }
    })();
    return () => { cancelled = true; };
  }, [meetings, loadContent]);

  const oreTotali = (meetings ?? []).reduce((s, m) => s + (m.durataOre ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>Meetings</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: palette.textDim, lineHeight: 1.5 }}>
          Le call strategiche con il team Performance Flows: clicca su una call per leggere il riepilogo.
          {data?.aggiornato && <> Aggiornato {fmtDateTime(data.aggiornato)}.</>}
        </p>
      </div>

      {loading && !data && <Skeleton height={420} style={{ borderRadius: 14 }} />}

      {failed && !data && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: palette.textMuted }}>Meeting in aggiornamento: riprova tra qualche istante.</span>
            <button type="button" onClick={load} style={secondaryBtn(palette)}>Riprova</button>
          </div>
        </Card>
      )}

      {meetings && (
        <Card>
          <CardHeader
            title="Call strategiche"
            right={meetings.length > 0
              ? <span style={{ fontSize: 11, color: palette.textDim }}>{meetings.length} call · {fmtDurata(oreTotali)} in totale</span>
              : undefined}
          />
          {meetings.length === 0 ? <EmptyState label="Nessuna call registrata" /> : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {meetings.map((m) => {
                const isOpen = openId === m.id;
                const panelId = `meeting-${m.id}`;
                return (
                  <div key={m.id} style={{ borderTop: `1px solid ${palette.divider}` }}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => { setOpenId(isOpen ? null : m.id); if (!isOpen) loadContent(m.id); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 4px", background: isOpen ? palette.buttonHover : "transparent",
                        border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left",
                        fontFamily: "inherit", color: palette.text,
                      }}
                    >
                      <span style={{ width: 64, flexShrink: 0, fontSize: 11, color: palette.textDim, fontVariantNumeric: "tabular-nums", paddingLeft: 6 }}>
                        {fmtDay(m.data)}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.titolo}>
                        {m.titolo}
                      </span>
                      <span style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 600, color: palette.textMuted,
                        padding: "2px 8px", borderRadius: 20, background: palette.divider, fontVariantNumeric: "tabular-nums",
                      }}>{fmtDurata(m.durataOre)}</span>
                      <svg width="12" height="12" fill="none" stroke={palette.textDim} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
                        style={{ flexShrink: 0, marginRight: 6, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div id={panelId} className="pf-meeting-panel" style={{ padding: "6px 6px 18px 84px" }}>
                        <div style={{ fontSize: 11, color: palette.textDim, marginBottom: 10 }}>
                          {fmtDay(m.data, true)} · durata {fmtDurata(m.durataOre)}
                        </div>
                        <ContentPanel state={contents[m.id]} onRetry={() => loadContent(m.id, true)} emptyLabel="Nessuna nota per questa call." />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
      <style>{`@media (max-width: 640px) { .pf-meeting-panel { padding-left: 6px !important; } }`}</style>
    </div>
  );
}
