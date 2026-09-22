"use client";

import { useMemo, useState } from "react";
import type { StoreProduct } from "@/lib/onlywood-store";
import {
  OnlywoodData, useDateRange, useStore, useTheme,
  eur, eur0, integer, num, pctStr, fmtDate,
  Card, CardHeader, KpiTile, SectionTitle, EmptyState, Pill,
  tableStyles, useTableSort, SortTh, ratio, mean, AVG_TITLE, avgRowStyle,
  calcDelta,
} from "./shared";
import { StoreSection } from "./StoreSection";
import { kicker, kpiGrid } from "./PanoramicaTab";
import { WOOD } from "../config";

export function ProdottiTab({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const { range } = useDateRange();
  const { store } = useStore();

  const topShare = useMemo(() => {
    if (!store || store.prodotti.length === 0) return null;
    const tot = store.prodotti.reduce((s, p) => s + p.fatturato, 0);
    const top10 = store.prodotti.slice(0, 10).reduce((s, p) => s + p.fatturato, 0);
    return tot > 0 ? (top10 / tot) * 100 : null;
  }, [store]);

  const prezzoMedio = store && store.totals.articoli > 0
    ? store.totals.fatturato_netto / store.totals.articoli
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle sub={`${fmtDate(range.start)} – ${fmtDate(range.end)} · venduto da WooCommerce, interesse da Google Analytics`}>
        Prodotti
      </SectionTitle>

      <div>
        <p style={kicker(palette.textDim)}>Il venduto</p>
        <div style={kpiGrid}>
          <KpiTile label="Articoli venduti" accent={WOOD}
            value={store ? integer(store.totals.articoli) : "…"}
            delta={calcDelta(store?.totals.articoli, store?.prev?.articoli)}
            info="Pezzi usciti dal magazzino nel periodo, secondo WooCommerce." />
          <KpiTile label="Prodotti con almeno una vendita"
            value={store ? integer(store.prodotti.length) : "…"}
            sub="i primi 50 per fatturato"
            info="WooCommerce restituisce i 50 prodotti più venduti del periodo: se il catalogo vende più a lungo di questa lista, la coda resta fuori dalla tabella ma non dai totali." />
          <KpiTile label="Prezzo medio per pezzo"
            value={prezzoMedio != null ? eur(prezzoMedio) : "…"}
            info="Fatturato netto diviso per i pezzi venduti: dice se il mix si sta spostando su articoli più o meno costosi." />
          <KpiTile label="Peso dei primi 10"
            value={topShare != null ? pctStr(topShare, 1) : "…"}
            sub="sul fatturato dei prodotti in lista"
            info="Quanto del venduto arriva dai dieci prodotti principali. Un valore alto dice che il fatturato dipende da pochi articoli." />
        </div>
      </div>

      <StoreSection height={420}>
        {(s) => <ProdottiWooTable prodotti={s.prodotti} />}
      </StoreSection>

      <InteresseGa4 data={data} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 16 }}>
        <StoreSection height={260}>
          {(s) => <VariantiCard varianti={s.varianti} />}
        </StoreSection>
        <StoreSection height={260}>
          {(s) => <ScorteCard scorte={s.scorte_basse} />}
        </StoreSection>
      </div>

      <GoogleShoppingCard data={data} />
    </div>
  );
}

// ─── Tabella prodotti WooCommerce ───────────────────────────────

function ProdottiWooTable({ prodotti }: { prodotti: StoreProduct[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  const totale = prodotti.reduce((s, p) => s + p.fatturato, 0);

  const { sorted, sort, toggle } = useTableSort<StoreProduct>(
    prodotti,
    (p, k) => {
      switch (k) {
        case "nome": return p.nome;
        case "sku": return p.sku;
        case "prezzo": return p.prezzo;
        case "articoli": return p.articoli;
        case "ordini": return p.ordini;
        case "fatturato": return p.fatturato;
        case "medio": return p.articoli > 0 ? p.fatturato / p.articoli : null;
        case "stock": return p.stock;
        default: return null;
      }
    },
    { key: "fatturato", dir: "desc" },
  );

  const media = {
    prezzo: mean(sorted.map((p) => p.prezzo).filter((x): x is number => x != null)),
    articoli: mean(sorted.map((p) => p.articoli)),
    ordini: mean(sorted.map((p) => p.ordini)),
    fatturato: mean(sorted.map((p) => p.fatturato)),
    medio: ratio(sorted.reduce((s, p) => s + p.fatturato, 0), sorted.reduce((s, p) => s + p.articoli, 0)),
  };

  if (prodotti.length === 0) {
    return <Card><EmptyState label="Nessun prodotto venduto nel periodo" /></Card>;
  }

  return (
    <Card>
      <CardHeader title="Cosa ha venduto il negozio"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>clicca una colonna per ordinare</span>} />
      <div style={{ overflowX: "auto" }}>
        <table style={ts.table}>
          <thead>
            <tr>
              <SortTh label="Prodotto" sortKey="nome" sort={sort} onSort={toggle} />
              <SortTh label="SKU" sortKey="sku" sort={sort} onSort={toggle} />
              <SortTh label="Prezzo" sortKey="prezzo" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Pezzi" sortKey="articoli" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Ordini" sortKey="ordini" sort={sort} onSort={toggle} align="right" />
              <SortTh label="Fatturato" sortKey="fatturato" sort={sort} onSort={toggle} align="right" />
              <th style={{ ...ts.th, ...ts.thRight }}>Quota</th>
              <SortTh label="Valore per pezzo" sortKey="medio" sort={sort} onSort={toggle} align="right"
                title="Fatturato del prodotto diviso per i pezzi venduti" />
              <SortTh label="Magazzino" sortKey="stock" sort={sort} onSort={toggle} align="right" />
            </tr>
          </thead>
          <tbody>
            <tr style={avgRowStyle(palette)} title={AVG_TITLE}>
              <td style={{ ...ts.tdBase, fontWeight: 700, fontStyle: "italic", color: palette.text }}>Media</td>
              <td style={ts.tdBase} />
              <AvgTd>{media.prezzo != null ? eur(media.prezzo) : "—"}</AvgTd>
              <AvgTd>{media.articoli != null ? num(media.articoli, 1) : "—"}</AvgTd>
              <AvgTd>{media.ordini != null ? num(media.ordini, 1) : "—"}</AvgTd>
              <AvgTd strong>{media.fatturato != null ? eur0(media.fatturato) : "—"}</AvgTd>
              <td style={{ ...ts.tdBase, ...ts.tdRight }} />
              <AvgTd>{media.medio != null ? eur(media.medio) : "—"}</AvgTd>
              <td style={{ ...ts.tdBase, ...ts.tdRight }} />
            </tr>
            {sorted.map((p) => (
              <tr key={`${p.id}-${p.sku}`}>
                <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 320 }}>
                  <span title={p.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.nome}
                  </span>
                </td>
                <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textDim }}>{p.sku || "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{p.prezzo != null ? eur(p.prezzo) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.articoli)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.ordini)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(p.fatturato)}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight, fontSize: 11 }}>
                  {totale > 0 ? pctStr((p.fatturato / totale) * 100, 1) : "—"}
                </td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>{p.articoli > 0 ? eur(p.fatturato / p.articoli) : "—"}</td>
                <td style={{ ...ts.tdBase, ...ts.tdRight }}>
                  <StockCell status={p.stock_status} stock={p.stock} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function StockCell({ status, stock }: { status: string | null; stock: number | null }) {
  const { palette } = useTheme();
  if (stock != null) {
    const basso = stock <= 3;
    return <span style={{ color: basso ? "#f59e0b" : palette.textMuted, fontWeight: basso ? 700 : 400 }}>{integer(stock)}</span>;
  }
  if (status === "outofstock") return <span style={{ color: palette.negative }}>esaurito</span>;
  if (status === "onbackorder") return <span style={{ color: "#f59e0b" }}>su ordinazione</span>;
  if (status === "instock") return <span style={{ color: palette.textDim }}>disponibile</span>;
  return <span style={{ color: palette.textDim }}>—</span>;
}

function AvgTd({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: strong ? 700 : 600, fontStyle: "italic" }}>{children}</td>;
}

// ─── Interesse dai dati di Analytics ────────────────────────────

type Ga4Prod = { nome: string; viste: number; atc: number; acquisti: number; revenue: number };

function InteresseGa4({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const [win, setWin] = useState<"w30" | "w90">("w30");
  const ts = tableStyles(palette);

  const righe: Ga4Prod[] = useMemo(() => {
    const src = win === "w30" ? data.ga4?.prodotti_w30 : data.ga4?.prodotti_w90;
    return (src ?? []).map((r) => ({
      nome: String(r[0] ?? ""),
      viste: Number(r[1]) || 0,
      atc: Number(r[2]) || 0,
      acquisti: Number(r[3]) || 0,
      revenue: Number(r[4]) || 0,
    }));
  }, [data.ga4?.prodotti_w30, data.ga4?.prodotti_w90, win]);

  const { sorted, sort, toggle } = useTableSort<Ga4Prod>(
    righe,
    (p, k) => {
      switch (k) {
        case "nome": return p.nome;
        case "viste": return p.viste;
        case "atc": return p.atc;
        case "tasso": return p.viste > 0 ? (p.atc / p.viste) * 100 : null;
        case "acquisti": return p.acquisti;
        case "chiusura": return p.atc > 0 ? (p.acquisti / p.atc) * 100 : null;
        default: return null;
      }
    },
    { key: "viste", dir: "desc" },
  );

  // Molto guardati, poco messi nel carrello: è lì che si lavora sulla scheda
  const attenzione = useMemo(() => {
    const conViste = righe.filter((p) => p.viste >= 200);
    if (conViste.length < 4) return [];
    const tassoMedio = conViste.reduce((s, p) => s + p.atc, 0) / conViste.reduce((s, p) => s + p.viste, 0);
    return conViste
      .filter((p) => p.viste > 0 && p.atc / p.viste < tassoMedio * 0.5)
      .sort((a, b) => b.viste - a.viste)
      .slice(0, 5)
      .map((p) => ({ ...p, indice: (p.atc / p.viste) * 100, medio: tassoMedio * 100 }));
  }, [righe]);

  return (
    <Card>
      <CardHeader
        title="Quanto interesse raccoglie ogni prodotto"
        right={
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: palette.textDim }}>finestra fissa di Analytics</span>
            <Pill active={win === "w30"} onClick={() => setWin("w30")}>30 giorni</Pill>
            <Pill active={win === "w90"} onClick={() => setWin("w90")}>90 giorni</Pill>
          </div>
        }
      />
      <p style={{ margin: "0 0 12px", fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
        Queste righe arrivano da Google Analytics e non seguono il periodo scelto in alto: la finestra è
        sempre di {win === "w30" ? "30" : "90"}{" "}giorni fino a ieri. Le viste e le aggiunte al carrello
        risentono del consenso ai cookie, quindi servono a confrontare i prodotti fra loro, non a contare
        quanti pezzi sono usciti: per quello c&apos;è la tabella di WooCommerce qui sopra.
        Viste e carrelli contano <strong style={{ color: palette.textMuted }}>pezzi</strong>, non visite:
        per questo l&apos;indice può superare quota 100, ad esempio sui materiali che si comprano a
        bancale o al metro, o quando il prodotto si aggiunge direttamente dalla pagina di elenco.
      </p>

      {attenzione.length > 0 && (
        <div style={{
          marginBottom: 14, padding: "0.7rem 0.85rem", borderRadius: 10,
          background: `${WOOD}14`, border: `1px solid ${WOOD}44`,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: palette.text }}>
            Molto guardati, poco messi nel carrello
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, listStyleType: "disc", fontSize: 11.5, color: palette.textMuted, lineHeight: 1.6 }}>
            {attenzione.map((p) => (
              <li key={p.nome}>
                <span style={{ color: palette.text }}>{p.nome}</span>: {integer(p.viste)} pezzi visti e{" "}
                {num(p.indice, 1)} carrelli ogni 100 viste, contro una media di {num(p.medio, 1)}.
              </li>
            ))}
          </ul>
        </div>
      )}

      {sorted.length === 0 ? <EmptyState label="Analytics non ha ancora dati di prodotto" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <SortTh label="Prodotto" sortKey="nome" sort={sort} onSort={toggle} />
                <SortTh label="Pezzi visti" sortKey="viste" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Pezzi nel carrello" sortKey="atc" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Carrelli / 100 viste" sortKey="tasso" sort={sort} onSort={toggle} align="right"
                  title="Pezzi messi nel carrello ogni 100 pezzi visti. Può superare 100 quando un prodotto si compra in più pezzi o si aggiunge dalla pagina di elenco." />
                <SortTh label="Pezzi acquistati" sortKey="acquisti" sort={sort} onSort={toggle} align="right" />
                <SortTh label="Acquisti / 100 carrelli" sortKey="chiusura" sort={sort} onSort={toggle} align="right" />
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 30).map((p) => (
                <tr key={p.nome}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 360 }}>
                    <span title={p.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.viste)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.atc)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>
                    {p.viste > 0 ? num((p.atc / p.viste) * 100, 1) : "—"}
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.acquisti)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{p.atc > 0 ? num((p.acquisti / p.atc) * 100, 1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Varianti e magazzino ───────────────────────────────────────

function VariantiCard({ varianti }: { varianti: StoreProduct[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <Card>
      <CardHeader title="Varianti più vendute"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>misure e finiture</span>} />
      {varianti.length === 0 ? <EmptyState label="Nessuna variante venduta nel periodo" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Variante</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Pezzi</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Fatturato</th>
              </tr>
            </thead>
            <tbody>
              {varianti.slice(0, 12).map((v) => (
                <tr key={`${v.id}-${v.sku}`}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 260 }}>
                    <span title={v.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(v.articoli)}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(v.fatturato)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ScorteCard({ scorte }: { scorte: { nome: string; sku: string; stock: number | null }[] }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);
  return (
    <Card>
      <CardHeader title="Scorte in esaurimento"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>stato attuale del magazzino</span>} />
      {scorte.length === 0 ? <EmptyState label="Nessun prodotto sotto la soglia di riordino" /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={ts.table}>
            <thead>
              <tr>
                <th style={ts.th}>Prodotto</th>
                <th style={ts.th}>SKU</th>
                <th style={{ ...ts.th, ...ts.thRight }}>Pezzi rimasti</th>
              </tr>
            </thead>
            <tbody>
              {scorte.map((s) => (
                <tr key={`${s.sku}-${s.nome}`}>
                  <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 260 }}>
                    <span title={s.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nome}</span>
                  </td>
                  <td style={{ ...ts.tdBase, fontSize: 11, color: palette.textDim }}>{s.sku || "—"}</td>
                  <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: s.stock != null && s.stock <= 2 ? palette.negative : palette.text }}>
                    {s.stock != null ? integer(s.stock) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Rendimento del catalogo su Google Shopping ─────────────────

function GoogleShoppingCard({ data }: { data: OnlywoodData }) {
  const { palette } = useTheme();
  const ts = tableStyles(palette);

  const righe = useMemo(() => {
    const m = new Map<string, { nome: string; costo: number; click: number; conv: number }>();
    for (const r of data.gads_products_w30 ?? []) {
      const nome = String(r[1] ?? "");
      const cur = m.get(nome) ?? { nome, costo: 0, click: 0, conv: 0 };
      cur.costo += Number(r[4]) || 0;
      cur.click += Number(r[5]) || 0;
      cur.conv += Number(r[6]) || 0;
      m.set(nome, cur);
    }
    return [...m.values()].sort((a, b) => b.costo - a.costo);
  }, [data.gads_products_w30]);

  const { sorted, sort, toggle } = useTableSort(
    righe,
    (p, k) => {
      switch (k) {
        case "nome": return p.nome;
        case "costo": return p.costo;
        case "click": return p.click;
        case "conv": return p.conv;
        case "cpa": return p.conv > 0 ? p.costo / p.conv : null;
        default: return null;
      }
    },
    { key: "costo", dir: "desc" },
  );

  const spesaSenzaConv = righe.filter((r) => r.conv === 0).reduce((s, r) => s + r.costo, 0);
  const spesaTot = righe.reduce((s, r) => s + r.costo, 0);

  return (
    <Card>
      <CardHeader title="Dove va il budget di Google Shopping"
        right={<span style={{ fontSize: 11, color: palette.textDim }}>ultimi 30 giorni, finestra fissa</span>} />
      {sorted.length === 0 ? (
        <EmptyState label="Nessun dato di prodotto da Google Ads: servono campagne Shopping o Performance Max con il Merchant Center collegato" />
      ) : (
        <>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: palette.textDim, lineHeight: 1.5 }}>
            {spesaTot > 0 && (
              <>Su {eur0(spesaTot)} investiti sul catalogo, {eur0(spesaSenzaConv)} ({pctStr((spesaSenzaConv / spesaTot) * 100, 0)})
              sono andati su articoli che in questi 30 giorni non hanno portato conversioni. </>
            )}
            Le conversioni sono quelle dichiarate da Google Ads, che attribuisce anche i clic dei giorni precedenti.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={ts.table}>
              <thead>
                <tr>
                  <SortTh label="Articolo" sortKey="nome" sort={sort} onSort={toggle} />
                  <SortTh label="Costo" sortKey="costo" sort={sort} onSort={toggle} align="right" />
                  <SortTh label="Click" sortKey="click" sort={sort} onSort={toggle} align="right" />
                  <SortTh label="Conversioni" sortKey="conv" sort={sort} onSort={toggle} align="right" />
                  <SortTh label="Costo per conversione" sortKey="cpa" sort={sort} onSort={toggle} align="right" first="asc" />
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 25).map((p) => (
                  <tr key={p.nome}>
                    <td style={{ ...ts.tdBase, color: palette.text, maxWidth: 380 }}>
                      <span title={p.nome} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, fontWeight: 700, color: palette.text }}>{eur0(p.costo)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{integer(p.click)}</td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight, color: p.conv === 0 ? palette.textDim : palette.textMuted }}>
                      {num(p.conv, 1)}
                    </td>
                    <td style={{ ...ts.tdBase, ...ts.tdRight }}>{p.conv > 0 ? eur(p.costo / p.conv) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
