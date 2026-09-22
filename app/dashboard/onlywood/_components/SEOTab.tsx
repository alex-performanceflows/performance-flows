"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  OnlywoodData, useDateRange, useTheme,
  calcDelta, invertDeltaColor, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill,
  sumInRange, dailyInRange,
  tableStyles, useTableSort, SortTh,
  useDailyMaps, buildSpark, useSparkProps,
  type DateRange,
} from "./shared";
import { kicker, kpiGrid, tooltipBox } from "./PanoramicaTab";
import { ACCENT, WOOD } from "../config";

type GscRow = { nome: string; click: number; impression: number; ctr: number; posizione: number };

function gscTotals(data: OnlywoodData, range: DateRange) {
  const click = sumInRange(data.gsc?.daily, range, 1);
  const impression = sumInRange(data.gsc?.daily, range, 2);
  // La posizione media va pesata sulle impression, non mediata giorno per giorno
  let posNum = 0;
  for (const r of data.gsc?.daily ?? []) {
    const d = String(r[0]); if (d < range.start || d > range.end) continue;
    posNum += (Number(r[4]) || 0) * (Number(r[2]) || 0);
  }
  return {
    click, impression,
    ctr: impression > 0 ? (click / impression) * 100 : 0,
    posizione: impression > 0 ? posNum / impression : 0,
  };
}

export function SEOTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range, compareRange } = useDateRange();
  const ultimo = data.gsc?.ultimo_giorno ?? null;

  const cur = useMemo(() => gscTotals(data, range), [data, range]);
  const prev = useMemo(() => compareRange ? gscTotals(data, compareRange) : null, [data, compareRange]);

  const dm = useDailyMaps(data);
  const spark = useSparkProps(ACCENT);
  const sp = useMemo(() => ({
    click: buildSpark(range, { num: [dm.gscClicks], to: dm.gscLast }),
    impression: buildSpark(range, { num: [dm.gscImpr], to: dm.gscLast }),
    ctr: buildSpark(range, { num: [dm.gscClicks], den: [dm.gscImpr], scale: 100, to: dm.gscLast }),
    pos: buildSpark(range, { num: [dm.gscPosWeighted], den: [dm.gscImpr], to: dm.gscLast }),
  }), [dm, range]);

  const serie = useMemo(() => dailyInRange(data.gsc?.daily, range).map((r) => ({
    data: String(r[0]),
    click: Number(r[1]) || 0,
    impression: Number(r[2]) || 0,
    ctr: Number(r[3]) || 0,
    posizione: Number(r[4]) || 0,
  })), [data.gsc?.daily, range]);

  const tagliato = ultimo && range.end > ultimo;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`Search Console · ${fmtDate(range.start)} – ${fmtDate(ultimo && range.end > ultimo ? ultimo : range.end)}`}>
        SEO
      </SectionTitle>

      {tagliato && (
        <Card padding={14}>
          <p style={{ margin: 0, fontSize: 12, color: palette.textMuted }}>
            Search Console rilascia i dati con qualche giorno di ritardo: l&apos;ultimo disponibile è il{" "}
            <strong style={{ color: palette.text }}>{fmtDate(ultimo!)}</strong>. I giorni successivi non
            compaiono nei totali, così da non far sembrare un calo quello che è solo un dato non ancora
            pubblicato.
          </p>
        </Card>
      )}

      <div>
        <p style={kicker(palette.textDim)}>Presenza su Google</p>
        <div style={kpiGrid}>
          <KpiTile label="Click organici" accent={ACCENT}
            value={integer(cur.click)} delta={calcDelta(cur.click, prev?.click)}
            info="Visite arrivate dai risultati di ricerca non a pagamento."
            {...spark(sp.click, integer)} />
          <KpiTile label="Impression"
            value={integer(cur.impression)} delta={calcDelta(cur.impression, prev?.impression)}
            info="Quante volte il sito è comparso in una pagina di risultati."
            {...spark(sp.impression, integer)} />
          <KpiTile label="CTR"
            value={pctStr(cur.ctr, 2)} delta={calcDelta(cur.ctr, prev?.ctr)}
            info="Click diviso impression: quanto spesso chi vede il risultato lo apre."
            {...spark(sp.ctr, (v) => pctStr(v, 2))} />
          <KpiTile label="Posizione media"
            value={cur.posizione > 0 ? num(cur.posizione, 1) : "—"}
            delta={invertDeltaColor(calcDelta(cur.posizione, prev?.posizione))}
            sub="più bassa è meglio"
            info="Posizione media pesata sulle impression. Scendere di numero significa salire nei risultati."
            {...spark(sp.pos, (v) => num(v, 1))} />
        </div>
      </div>

      <Card>
        <CardHeader title="Click e impression giorno per giorno"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>le impression sono nel tooltip</span>} />
        {serie.length === 0 ? <EmptyState label="Nessun giorno con dati nel periodo" /> : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ow-seo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="data" tickFormatter={fmtDate} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fill: palette.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof serie)[number];
                    return (
                      <div style={tooltipBox(palette)}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDate(String(label))}</div>
                        <div>Click: <strong>{integer(p.click)}</strong></div>
                        <div>Impression: <strong>{integer(p.impression)}</strong></div>
                        <div style={{ color: palette.textDim }}>CTR {pctStr(p.ctr, 2)} · posizione {num(p.posizione, 1)}</div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="click" stroke={ACCENT} strokeWidth={2} fill="url(#ow-seo)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Posizione media nel tempo"
          right={<span style={{ fontSize: 11, color: palette.textDim }}>asse invertito: in alto si sta meglio</span>} />
        {serie.length === 0 ? <EmptyState /> : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="data" tickFormatter={fmtDate} tick={{ fill: palette.axis, fontSize: 10 }}
                  axisLine={{ stroke: palette.cardBorder }} tickLine={false} minTickGap={24} />
                <YAxis reversed domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={(v) => num(Number(v), 0)}
                  tick={{ fill: palette.axis, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof serie)[number];
                    return (
                      <div style={tooltipBox(palette)}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{fmtDate(String(label))}</div>
                        <div>Posizione media: <strong>{num(p.posizione, 1)}</strong></div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="posizione" stroke={WOOD} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <QueryCard data={data} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 16 }}>
        <GscTable titolo="Pagine che portano traffico" righe={data.gsc?.pages_w30} etichetta="Pagina" />
        <GscTable titolo="Da quali dispositivi" righe={data.gsc?.devices_w30} etichetta="Dispositivo" compatta />
      </div>
    </div>
  );
}

function QueryCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const [win, setWin] = useState<"w30" | "w90">("w30");
  const ts = tableStyles(palette);

  const righe: GscRow[] = useMemo(() => {
    const src = win === "w30" ? data.gsc?.queries_w30 : data.gsc?.queries_w90;
    return (src ?? []).map((r) => ({
      nome: String(r[0] ?? ""),
      click: Number(r[1]) || 0,
      impression: Number(r[2]) || 0,
      ctr: Number(r[3]) || 0,
      posizione: Number(r[4]) || 0,
    }));
  }, [data.gsc?.queries_w30, data.gsc?.queries_w90, win]);

  const { sorted, sort, toggle } = useTableSort<GscRow>(
    righe,
    (r, k) => {
      switch (k) {
        case "nome": return r.nome;
        case "click": return r.click;
        case "impression": return r.impression;
        case "ctr": return r.ctr;
        case "posizione": return r.posizione > 0 ? r.posizione : null;
        default: return null;
      }
    },
    { key: "click", dir: "desc" },
  );

  // Molte impression, pochi click: il risultato compare ma non convince
  const daMigliorare = useMemo(
    () => righe
      .filter((r) => r.impression >= 1000 && r.posizione > 0 && r.posizione <= 20 && r.ctr < 1)
      .sort((a, b) => b.impression - a.impression)
      .slice(0, 4),
    [righe],
  );

  return (
    <Card>
      <CardHeader
        title="Che cosa cercano le persone"
        right={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: palette.textDim }}>finestra fissa</span>
            <Pill active={win === "w30"} onClick={() => setWin("w30")}>30 giorni</Pill>
            <Pill active={win === "w90"} onClick={() => setWin("w90")}>90 giorni</Pill>
          </div>
        }
      />
      {daMigliorare.length > 0 && (
        <div style={{
          marginBottom: 14, padding: "0.7rem 0.85rem", borderRadius: 10,
          background: `${WOOD}14`, border: `1px solid ${WOOD}44`,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: palette.text }}>
            Ricerche in cui il sito compare molto ma viene cliccato poco
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, listStyleType: "disc", fontSize: 11.5, color: palette.textMuted, lineHeight: 1.6 }}>
            {daMigliorare.map((r) => (
              <li key={r.nome}>
                <span style={{ color: palette.text }}>{r.nome}</span>: {integer(r.impression)} impression,
                posizione media {num(r.posizione, 1)}, CTR {pctStr(r.ctr, 2)}.
              </li>
            ))}
          </ul>
        </div>
      )}
      {sorted.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label="Ricerca" sortKey="nome" sort={sort} onSort={toggle} />
                <SortTh label="Click" sortKey="click" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Impression" sortKey="impression" sort={sort} onSort={toggle} align="right" />
                <SortTh label="CTR" sortKey="ctr" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Posizione" sortKey="posizione" sort={sort} onSort={toggle} align="right" first="asc" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 320 }}>
                    <span title={r.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{integer(r.click)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.impression)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctr, 2)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.posizione > 0 ? num(r.posizione, 1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function GscTable({ titolo, righe, etichetta, compatta }: {
  titolo: string; righe: (string | number)[][] | undefined; etichetta: string; compatta?: boolean;
}) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const dati: GscRow[] = (righe ?? []).map((r) => ({
    nome: String(r[0] ?? ""),
    click: Number(r[1]) || 0,
    impression: Number(r[2]) || 0,
    ctr: Number(r[3]) || 0,
    posizione: Number(r[4]) || 0,
  })).sort((a, b) => b.click - a.click);

  return (
    <Card>
      <CardHeader title={titolo}
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>} />
      {dati.length === 0 ? <EmptyState /> : (
        <div style={{ overflowX: "auto", maxHeight: compatta ? undefined : 400, overflowY: compatta ? undefined : "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>{etichetta}</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Click</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Impr.</th>
                <th style={{ ...ts.th, ...ts.thRight }}>CTR</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Pos.</th>
              </tr>
            </thead>
            <tbody>
              {dati.map((r) => (
                <tr key={r.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 240, textTransform: compatta ? "capitalize" : "none" }}>
                    <span title={r.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {compatta ? r.nome.toLowerCase() : r.nome}
                    </span>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{integer(r.click)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(r.impression)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.ctr, 2)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.posizione > 0 ? num(r.posizione, 1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
