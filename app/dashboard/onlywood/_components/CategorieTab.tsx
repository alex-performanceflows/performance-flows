"use client";

import { useMemo } from "react";
import type { StoreCategory } from "@/lib/onlywood-store";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from "recharts";
import {
  OnlywoodData, useDateRange, useStore, useTheme,
  eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState,
  tableStyles, useTableSort, SortTh,
} from "./shared";
import { StoreSection } from "./StoreSection";
import { kicker, kpiGrid, tooltipBox } from "./PanoramicaTab";
import { ACCENT, WOOD } from "../config";

type Ga4Cat = { nome: string; viste: number; atc: number; acquisti: number; revenue: number };

export function CategorieTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const { store } = useStore();

  const ga4Cat: Ga4Cat[] = useMemo(() => (data.ga4?.categorie_w30 ?? []).map((r) => ({
    nome: String(r[0] ?? ""),
    viste: Number(r[1]) || 0,
    atc: Number(r[2]) || 0,
    acquisti: Number(r[3]) || 0,
    revenue: Number(r[4]) || 0,
  })), [data.ga4?.categorie_w30]);

  const totFatturato = store?.categorie.reduce((s, c) => s + c.fatturato, 0) ?? 0;
  const prima = store?.categorie[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · venduto da WooCommerce, interesse da Google Analytics`}>
        Categorie
      </SectionTitle>

      <div>
        <p style={kicker(palette.textDim)}>Il mix di catalogo</p>
        <div style={kpiGrid}>
          <KpiTile label="Categorie con vendite" accent={WOOD}
            value={store ? integer(store.categorie.length) : "…"}
            info="Categorie di prodotto che hanno registrato almeno una vendita nel periodo." />
          <KpiTile label="Categoria principale"
            value={prima ? prima.nome : "…"}
            sub={prima && totFatturato > 0 ? `${pctStr((prima.fatturato / totFatturato) * 100, 0)} del fatturato` : undefined}
            info="La categoria che ha fatturato di più nel periodo." />
          <KpiTile label="Peso delle prime tre"
            value={store && totFatturato > 0
              ? pctStr((store.categorie.slice(0, 3).reduce((s, c) => s + c.fatturato, 0) / totFatturato) * 100, 0)
              : "…"}
            info="Quanto del fatturato arriva dalle tre categorie principali: misura la concentrazione del venduto." />
          <KpiTile label="Ordine medio della prima"
            value={prima && prima.ordini > 0 ? eur(prima.fatturato / prima.ordini) : "…"}
            info="Valore medio per ordine nella categoria che fattura di più." />
        </div>
      </div>

      <StoreSection height={320}>
        {(s) => <CategorieChart categorie={s.categorie} />}
      </StoreSection>

      <StoreSection height={360}>
        {(s) => <CategorieWooTable categorie={s.categorie} />}
      </StoreSection>

      <ConfrontoInteresse categorie={store?.categorie ?? []} ga4={ga4Cat} />

      <Ga4CategorieTable righe={ga4Cat} />
    </div>
  );
}

// ─── Grafico: fatturato per categoria ───────────────────────────

function CategorieChart({ categorie }: { categorie: StoreCategory[] }) {
  const { palette } = useTheme();
  const righe = categorie.slice(0, 10).map((c) => ({ ...c, breve: c.nome.length > 28 ? `${c.nome.slice(0, 27)}…` : c.nome }));
  if (righe.length === 0) return <Card><EmptyState label="Nessuna categoria con vendite nel periodo" /></Card>;

  return (
    <Card>
      <CardHeader title="Fatturato per categoria"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>prime {righe.length} del periodo</span>} />
      <div style={{ width: "100%", height: Math.max(220, righe.length * 34) }}>
        <ResponsiveContainer>
          <BarChart data={righe} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={palette.grid} horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => eur0(Number(v))} tick={{ fill: palette.axis, fontSize: 10 }}
              axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="breve" width={190} tick={{ fill: palette.axis, fontSize: 11 }}
              axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: palette.buttonHover }}
              content={({ active, payload }) => {
                const p = active && payload?.[0]?.payload as (typeof righe)[number] | undefined;
                if (!p) return null;
                return (
                  <div style={tooltipBox(palette)}>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>{p.nome}</div>
                    <div>Fatturato: <strong>{eur0(p.fatturato)}</strong></div>
                    <div>{integer(p.articoli)} pezzi · {integer(p.ordini)} ordini</div>
                    <div style={{ color: palette.textDim }}>{integer(p.prodotti)} prodotti in catalogo</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="fatturato" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
              {righe.map((_, i) => <Cell key={i} fill={WOOD} fillOpacity={1 - i * 0.055} />)}
              <LabelList dataKey="fatturato" position="right"
                formatter={(v: unknown) => eur0(Number(v))}
                style={{ fill: palette.textMuted, fontSize: 10 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Tabella WooCommerce ────────────────────────────────────────

function CategorieWooTable({ categorie }: { categorie: StoreCategory[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const totale = categorie.reduce((s, c) => s + c.fatturato, 0);

  const { sorted, sort, toggle } = useTableSort<StoreCategory>(
    categorie,
    (c, k) => {
      switch (k) {
        case "nome": return c.nome;
        case "prodotti": return c.prodotti;
        case "articoli": return c.articoli;
        case "ordini": return c.ordini;
        case "fatturato": return c.fatturato;
        case "medio": return c.ordini > 0 ? c.fatturato / c.ordini : null;
        default: return null;
      }
    },
    { key: "fatturato", dir: "desc" },
  );

  if (categorie.length === 0) return <Card><EmptyState label="Nessuna categoria con vendite nel periodo" /></Card>;

  return (
    <Card>
      <CardHeader title="Le categorie nel dettaglio"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>clicca una colonna per ordinare</span>} />
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <SortTh label="Categoria" sortKey="nome" sort={sort} onSort={toggle} />
              <SortTh label="Prodotti" sortKey="prodotti" sort={sort} onSort={toggle} align="right"
                title="Prodotti della categoria che hanno venduto nel periodo" />
              <SortTh label="Pezzi" sortKey="articoli" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Ordini" sortKey="ordini" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Fatturato" sortKey="fatturato" sort={sort} onSort={toggle} align="right" />
              <th style={{ ...ts.th, ...ts.thRight }}>Quota</th>
              <SortTh label="Valore per ordine" sortKey="medio" sort={sort} onSort={toggle} align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={`${c.id}-${c.nome}`}>
                <td style={{ ...ts.tdBase, color: palette.text }}>{c.nome}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.prodotti)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.articoli)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.ordini)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(c.fatturato)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontSize: 11 }}>
                  {totale > 0 ? pctStr((c.fatturato / totale) * 100, 1) : "—"}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.ordini > 0 ? eur(c.fatturato / c.ordini) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Interesse contro venduto ───────────────────────────────────

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function ConfrontoInteresse({ categorie, ga4 }: { categorie: StoreCategory[]; ga4: Ga4Cat[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);

  const righe = useMemo(() => {
    const totViste = ga4.reduce((s, c) => s + c.viste, 0);
    const totFatt = categorie.reduce((s, c) => s + c.fatturato, 0);
    if (totViste === 0 || totFatt === 0) return [];
    const byName = new Map(ga4.map((c) => [normalize(c.nome), c]));
    return categorie
      .map((c) => {
        const g = byName.get(normalize(c.nome));
        if (!g) return null;
        return {
          nome: c.nome,
          quotaInteresse: (g.viste / totViste) * 100,
          quotaFatturato: (c.fatturato / totFatt) * 100,
          viste: g.viste,
          fatturato: c.fatturato,
          atcRate: g.viste > 0 ? (g.atc / g.viste) * 100 : null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .sort((a, b) => (b.quotaInteresse + b.quotaFatturato) - (a.quotaInteresse + a.quotaFatturato))
      .slice(0, 12);
  }, [categorie, ga4]);

  if (righe.length < 3) return null;

  return (
    <Card>
      <CardHeader title="Dove si guarda e dove si compra"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>interesse: ultimi 30 giorni di Analytics</span>} />
      <p style={{ margin: "0 0 12px", fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
        A sinistra quanto pesa ogni categoria sulle schede viste, a destra quanto pesa sul fatturato del
        periodo. Le due colonne coprono finestre diverse — l&apos;interesse è sempre a 30 giorni — quindi
        vanno lette come proporzioni, non come valori assoluti.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <th style={ts.th}>Categoria</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Quota interesse</th>
              <th style={{ ...ts.th, ...ts.thRight }}>Quota fatturato</th>
              <th style={ts.th}>Confronto</th>
              <th style={{ ...ts.th, ...ts.thRight }} title="Pezzi messi nel carrello ogni 100 pezzi visti">Carrelli / 100 viste</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((r) => {
              const max = Math.max(...righe.map((x) => Math.max(x.quotaInteresse, x.quotaFatturato)));
              return (
                <tr key={r.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 240 }}>
                    <span title={r.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{pctStr(r.quotaInteresse, 1)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{pctStr(r.quotaFatturato, 1)}</td>
                  <td style={{ ...ts.tdBase, minWidth: 160 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <Bar2 value={r.quotaInteresse} max={max} color={ACCENT} />
                      <Bar2 value={r.quotaFatturato} max={max} color={WOOD} />
                    </div>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{r.atcRate != null ? num(r.atcRate, 1) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: palette.textDim }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 4, borderRadius: 2, background: ACCENT }} /> quota interesse
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 4, borderRadius: 2, background: WOOD }} /> quota fatturato
        </span>
      </div>
    </Card>
  );
}

function Bar2({ value, max, color }: { value: number; max: number; color: string }) {
  const { palette } = useTheme();
  return (
    <div style={{ height: 5, borderRadius: 3, background: palette.buttonHover, overflow: "hidden" }}>
      <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

// ─── Tabella interesse da Analytics ─────────────────────────────

function Ga4CategorieTable({ righe }: { righe: Ga4Cat[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const { sorted, sort, toggle } = useTableSort<Ga4Cat>(
    righe,
    (c, k) => {
      switch (k) {
        case "nome": return c.nome;
        case "viste": return c.viste;
        case "atc": return c.atc;
        case "tasso": return c.viste > 0 ? (c.atc / c.viste) * 100 : null;
        case "acquisti": return c.acquisti;
        case "revenue": return c.revenue;
        default: return null;
      }
    },
    { key: "viste", dir: "desc" },
  );

  return (
    <Card>
      <CardHeader title="Categorie più viste sul sito"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>Google Analytics · ultimi 30 giorni, finestra fissa</span>} />
      {sorted.length === 0 ? <EmptyState label="Analytics non ha ancora dati di categoria" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label="Categoria" sortKey="nome" sort={sort} onSort={toggle} />
                <SortTh label="Pezzi visti" sortKey="viste" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Pezzi nel carrello" sortKey="atc" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Carrelli / 100 viste" sortKey="tasso" sort={sort} onSort={toggle} align="right"
                  title="Pezzi messi nel carrello ogni 100 pezzi visti. Può superare 100 sui materiali che si comprano a bancale o al metro." />
                <SortTh label="Acquisti" sortKey="acquisti" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Valore" sortKey="revenue" sort={sort} onSort={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text }}>{c.nome}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.viste)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.atc)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>
                    {c.viste > 0 ? num((c.atc / c.viste) * 100, 1) : "—"}
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(c.acquisti)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{c.revenue > 0 ? eur0(c.revenue) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ margin: "12px 0 0", fontSize: 10, color: palette.textFaint, lineHeight: 1.5 }}>
        Le categorie qui sopra sono quelle che il sito passa ad Analytics con l&apos;articolo: possono avere
        nomi diversi da quelli del catalogo WooCommerce, e i numeri risentono del consenso ai cookie.
        Per quanto si è venduto davvero vale la tabella di WooCommerce.
      </p>
    </Card>
  );
}
