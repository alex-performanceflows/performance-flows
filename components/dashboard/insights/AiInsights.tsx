"use client";

import { Card, CardHeader, EmptyState, useTheme } from "@/app/dashboard/vitaedna/_components/shared";
import type { Insight, InsightTone } from "@/lib/creative-insights";

const TONE_COLOR: Record<InsightTone, string> = {
  positive: "#22c55e",
  attention: "#f59e0b",
  neutral: "#94a3b8",
};

/**
 * Letture automatiche delle creatività del periodo.
 *
 * I numeri arrivano da `buildCreativeInsights`: qui si impagina soltanto.
 * I testi descrivono cosa dicono i dati, non cosa fare: questa sezione la
 * guarda anche il cliente.
 */
export default function AiInsights({
  insights,
  accent,
  periodo,
}: {
  insights: Insight[];
  accent: string;
  /** Periodo a cui si riferiscono, scritto in chiaro (es. "ultimi 30 giorni"). */
  periodo?: string;
}) {
  const { palette } = useTheme();

  return (
    <Card>
      <CardHeader
        title="AI Insights"
        right={
          <span style={{ fontSize: 11, color: palette.textDim }}>
            letture automatiche{periodo ? ` · ${periodo}` : ""}
          </span>
        }
      />

      {insights.length === 0 ? (
        <EmptyState label="Nessuna lettura per il periodo selezionato" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 12, alignItems: "start" }}>
          {insights.map((insight) => (
            <article
              key={insight.id}
              style={{
                border: `1px solid ${palette.cardBorder}`,
                borderTop: `2px solid ${TONE_COLOR[insight.tone]}`,
                borderRadius: 10,
                padding: "0.95rem 1.05rem",
                background: palette.cardBg,
                height: "100%",
              }}
            >
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: palette.text, letterSpacing: "-0.01em", lineHeight: 1.35 }}>
                {insight.title}
              </h4>
              <p style={{ margin: "7px 0 0", fontSize: 12.5, lineHeight: 1.6, color: palette.textMuted }}>
                {insight.body}
              </p>

              {insight.items && insight.items.length > 0 && (
                <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
                  {insight.items.map((item, i) => (
                    <li
                      key={`${item.label}-${i}`}
                      style={{ padding: "8px 0", borderTop: `1px solid ${palette.divider}` }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: accent, flexShrink: 0, marginTop: 5 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: palette.text, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                            {item.label}
                          </p>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: palette.textDim, lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      <p style={{ margin: "14px 0 0", fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
        Letture calcolate sui dati delle creatività del periodo selezionato: costi confrontati con la media del periodo,
        percentuali con la mediana delle creatività video.
      </p>
    </Card>
  );
}
