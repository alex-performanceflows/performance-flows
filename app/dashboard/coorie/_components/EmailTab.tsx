"use client";

import {
  CoorieData, useTheme,
  integer, fmtDate, fmtDateTime,
  Card, CardHeader, EmptyState, SectionTitle, tableStyles,
  ACCENT, POSITIVE,
} from "./shared";

export function EmailTab({ data }: { data: CoorieData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionTitle sub="Flussi e campagne da Klaviyo">Email</SectionTitle>
      <KlaviyoBlock data={data} />
    </div>
  );
}

function KlaviyoBlock({ data }: { data: CoorieData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const k = data.klaviyo;
  const active = k?.active ?? false;

  if (!active) {
    return (
      <Card>
        <CardHeader title="Klaviyo · email" />
        <div style={{
          padding: "1.5rem 1rem", textAlign: "center",
          background: palette.divider, borderRadius: 10,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: palette.textMuted }}>
            <strong style={{ color: palette.text }}>Klaviyo collegato, flussi non ancora attivi.</strong><br />
            <span style={{ fontSize: 12, color: palette.textDim }}>La sezione si popola da sola quando partono.</span>
          </p>
        </div>
      </Card>
    );
  }

  const flows = k?.flows ?? [];
  const campaigns = k?.campaigns ?? [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
      <Card>
        <CardHeader title={`Flussi Klaviyo · ${integer(flows.length)}`} />
        {flows.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Nome</th>
                <th style={ts.th}>Stato</th>
                <th style={ts.th}>Trigger</th>
                <th style={ts.th}>Ultimo agg.</th>
              </tr></thead>
              <tbody>
                {flows.map((r, i) => {
                  const stato = String(r[1]);
                  const isLive = /live/i.test(stato);
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
                      <td style={ts.tdBase}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20,
                          background: isLive ? `${POSITIVE}25` : palette.divider,
                          color: isLive ? POSITIVE : palette.textDim,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                        }}>{stato}</span>
                      </td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>{String(r[2])}</td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>
                        {r[3] ? fmtDate(String(r[3])) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={`Campagne Klaviyo · ${integer(campaigns.length)}`} />
        {campaigns.length === 0 ? <EmptyState /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead><tr>
                <th style={ts.th}>Oggetto</th>
                <th style={ts.th}>Stato</th>
                <th style={ts.th}>Inviata il</th>
              </tr></thead>
              <tbody>
                {campaigns.map((r, i) => {
                  const stato = String(r[1]);
                  const isSent = /sent/i.test(stato);
                  return (
                    <tr key={i}>
                      <td style={{ ...ts.tdBase, color: palette.text, fontWeight: 500 }}>{String(r[0])}</td>
                      <td style={ts.tdBase}>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20,
                          background: isSent ? `${ACCENT}25` : palette.divider,
                          color: isSent ? ACCENT : palette.textDim,
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                        }}>{stato}</span>
                      </td>
                      <td style={{ ...ts.tdBase, color: palette.textDim, fontSize: 11 }}>
                        {r[2] ? fmtDateTime(String(r[2])) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
