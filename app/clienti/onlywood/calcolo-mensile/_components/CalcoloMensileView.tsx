"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { OnlyWoodOrder, OnlyWoodResponse, WcTotalsReport } from "@/app/api/onlywood/orders/route";

// ─── Formatting ───────────────────────────────────────────────────

const EUR = new Intl.NumberFormat("it-IT", {
  style: "currency", currency: "EUR",
  minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always",
});
const NUM2 = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always",
});

const FEE_RATE = 0.025;
const FEE_FIXED = 1000;

function eur(n: number): string { return EUR.format(n || 0); }
function fmtDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}
function round2(n: number): number { return Math.round(n * 100) / 100; }

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  completed:  { bg: "rgba(22,163,74,0.12)",  color: "#16a34a", label: "Completato" },
  processing: { bg: "rgba(37,99,235,0.12)",  color: "#2563eb", label: "In lavorazione" },
  refunded:   { bg: "rgba(220,38,38,0.12)",  color: "#dc2626", label: "Rimborsato" },
};

const CLIENT_INFO = {
  ragione: "OnlyWood S.r.l.",
  indirizzo: "Piazza della Libertà 7 int.14",
  citta: "15061 Arquata Scrivia (AL)",
  piva: "02065100063",
};

function excludedKey(month: string) { return `pf.calcOw.excluded.${month}`; }
function readExcluded(month: string): Set<number> {
  try {
    const raw = localStorage.getItem(excludedKey(month));
    if (!raw) return new Set();
    return new Set((JSON.parse(raw) as number[]) ?? []);
  } catch { return new Set(); }
}
function writeExcluded(month: string, s: Set<number>) {
  try { localStorage.setItem(excludedKey(month), JSON.stringify(Array.from(s))); } catch {}
}

// ─── Main view ────────────────────────────────────────────────────

type Props = { clientName: string; defaultMonth: string };

export function CalcoloMensileView({ clientName, defaultMonth }: Props) {
  const [month, setMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnlyWoodResponse | null>(null);
  const [manuallyExcluded, setManuallyExcluded] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showExcluded, setShowExcluded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => { setManuallyExcluded(readExcluded(month)); }, [month]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/onlywood/orders?month=${month}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Errore caricamento");
      setData(json as OnlyWoodResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
      setData(null);
    } finally { setLoading(false); }
  }, [month]);

  function toggleExclude(orderId: number) {
    setManuallyExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      writeExcluded(month, next);
      return next;
    });
  }

  const orders = data?.orders ?? [];

  const isIncluded = useCallback(
    (o: OnlyWoodOrder) => !o.marketplace && !manuallyExcluded.has(o.id),
    [manuallyExcluded]
  );

  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!showExcluded && !isIncluded(o)) return false;
      return true;
    });
  }, [orders, statusFilter, showExcluded, isIncluded]);

  const wc: WcTotalsReport = data?.wc ?? {
    gross_sales: 0, coupons: 0, refunds: 0, net_revenue: 0,
    taxes: 0, shipping: 0, total_sales: 0, orders_count: 0,
  };

  // Calcolo fee live con override manuali
  const feeCalc = useMemo(() => {
    const totalNetExIva = orders.reduce((a, o) => a + o.net_contribution_net, 0);
    const marketplaceNetExIva = orders
      .filter((o) => o.marketplace)
      .reduce((a, o) => a + o.net_contribution_net, 0);
    const manuallyExcludedNetExIva = orders
      .filter((o) => !o.marketplace && manuallyExcluded.has(o.id))
      .reduce((a, o) => a + o.net_contribution_net, 0);
    const feeBase = Math.max(0, totalNetExIva - marketplaceNetExIva - manuallyExcludedNetExIva);
    const feeVariable = round2(feeBase * FEE_RATE);
    return {
      totalNetExIva: round2(totalNetExIva),
      marketplaceNetExIva: round2(marketplaceNetExIva),
      manuallyExcludedNetExIva: round2(manuallyExcludedNetExIva),
      manuallyExcludedCount: orders.filter((o) => !o.marketplace && manuallyExcluded.has(o.id)).length,
      marketplaceCount: orders.filter((o) => o.marketplace).length,
      includedCount: orders.filter(isIncluded).length,
      feeBase: round2(feeBase),
      feeVariable,
      feeFixed: FEE_FIXED,
      feeTotal: round2(FEE_FIXED + feeVariable),
    };
  }, [orders, manuallyExcluded, isIncluded]);

  const invoiceText = useMemo(() => buildInvoiceText(month, feeCalc), [month, feeCalc]);

  async function copyInvoice() {
    try {
      await navigator.clipboard.writeText(invoiceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function exportCsv() {
    const included = orders.filter(isIncluded);
    const rows = [
      ["Numero", "Data", "Stato", "Cliente", "Città", "Prov", "Email", "Totale €", "Subtotale €", "Sconto €", "Rimborsi €", "Contributo netto (imp.) €", "Fee 2,5% €"],
      ...included.map((o) => [
        o.number, o.date, o.status, o.customer_name, o.billing_city, o.billing_state, o.customer_email,
        NUM2.format(o.total),
        NUM2.format(o.subtotal_gross),
        NUM2.format(o.discount_gross),
        NUM2.format(o.refunds_gross),
        NUM2.format(o.net_contribution_net),
        NUM2.format(o.fee),
      ]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `calcolo-onlywood-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f7f6f4", fontFamily: "Inter, sans-serif", color: "#0d0e1f" }}>
      {/* Header */}
      <header className="pf-noprint" style={{
        background: "#1a2580", padding: "0 1.5rem", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 30,
        boxShadow: "0 1px 8px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image src="/images/logo-white.webp" alt="Performance Flows" width={194} height={80} priority style={{ height: 32, width: "auto", display: "block" }} />
          <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.22)" }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            {clientName} · Calcolo fee mensile
          </p>
        </div>
      </header>

      {/* Controls */}
      <div className="pf-noprint" style={{
        background: "#ffffff", borderBottom: "1px solid #e8e6e3",
        padding: "1rem 1.5rem",
        position: "sticky", top: 60, zIndex: 25,
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
      }}>
        <label style={{ fontSize: 12, color: "#5c5f6e", fontWeight: 600 }}>Mese</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "0.45rem 0.65rem", border: "1.5px solid #dcdad7",
            borderRadius: 8, fontSize: 14, background: "#f7f6f4",
            color: "#0d0e1f", fontFamily: "inherit",
          }}
        />
        <button onClick={loadOrders} disabled={loading} style={btnPrimary(loading)}>
          {loading ? "Caricamento…" : data ? "Ricarica" : "Carica ordini"}
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={exportCsv} disabled={!data || orders.length === 0} style={btnGhost(!data || orders.length === 0)}>
          Esporta CSV
        </button>
        <button onClick={() => window.print()} disabled={!data} style={btnGhost(!data)}>
          Stampa / PDF
        </button>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
        {error && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
            padding: "0.9rem 1rem", borderRadius: 10, marginBottom: 16, fontSize: 14,
          }}>
            <strong>Errore:</strong> {error}
          </div>
        )}

        {loading && !data && (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#9c9a97" }}>
            Caricamento in corso…
          </div>
        )}

        {data && (
          <>
            {/* Card group: WooCommerce dashboard mirror */}
            <SectionHeader
              title="Report WooCommerce (giugno 2026)"
              subtitle={`Numeri identici a wp-admin › Analytics › Fatturato · ${wc.orders_count} ordini (processing + completed + refunded)`}
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10, marginBottom: 24,
            }}>
              <WcCard label="Vendite lorde" value={eur(wc.gross_sales)} />
              <WcCard label="Codici promozionali" value={`− ${eur(wc.coupons)}`} negative />
              <WcCard label="Resi" value={`− ${eur(wc.refunds)}`} negative />
              <WcCard label="Vendite nette" value={eur(wc.net_revenue)} accent />
              <WcCard label="Imposte" value={eur(wc.taxes)} muted />
              <WcCard label="Spedizione" value={eur(wc.shipping)} muted />
              <WcCard label="Totale vendite" value={eur(wc.total_sales)} muted />
            </div>

            {/* Card group: fee calc */}
            <SectionHeader
              title="Calcolo fee Performance Flows"
              subtitle="Base: vendite nette WC ex-IVA, meno ordini marketplace"
              onInfoClick={() => setInfoOpen(true)}
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12, marginBottom: 12,
            }}>
              <FeeCard
                label="Vendite nette (ex-IVA)"
                value={eur(feeCalc.totalNetExIva)}
                sub="Somma imponibile ordini WC"
              />
              <FeeCard
                label="Marketplace esclusi"
                value={`− ${eur(feeCalc.marketplaceNetExIva)}`}
                sub={`${feeCalc.marketplaceCount} ordini marketplace`}
                negative
              />
              {feeCalc.manuallyExcludedCount > 0 && (
                <FeeCard
                  label="Esclusi manualmente"
                  value={`− ${eur(feeCalc.manuallyExcludedNetExIva)}`}
                  sub={`${feeCalc.manuallyExcludedCount} ordini`}
                  negative
                />
              )}
              <FeeCard
                label="Base fee (imponibile)"
                value={eur(feeCalc.feeBase)}
                sub="× 2,5%"
                accent
              />
              <FeeCard
                label="Fee totale da fatturare"
                value={eur(feeCalc.feeTotal)}
                sub={`Fisso ${eur(feeCalc.feeFixed)} + var. ${eur(feeCalc.feeVariable)}`}
                highlight
              />
            </div>

            <p style={{ fontSize: 13, color: "#5c5f6e", margin: "0 0 20px", lineHeight: 1.6 }}>
              Base di calcolo: <strong style={{ color: "#0d0e1f" }}>vendite nette WooCommerce ex-IVA</strong>, al netto degli ordini marketplace. Fattura da emettere: <strong style={{ color: "#0d0e1f" }}>{eur(feeCalc.feeFixed)}</strong> (fisso) + <strong style={{ color: "#0d0e1f" }}>{eur(feeCalc.feeVariable)}</strong> (2,5% su <strong style={{ color: "#0d0e1f" }}>{eur(feeCalc.feeBase)}</strong>) = <strong style={{ color: "#1a2580" }}>{eur(feeCalc.feeTotal)} + IVA 22%</strong>
            </p>

            {/* Filters */}
            <div className="pf-noprint" style={{
              display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
              marginBottom: 12, fontSize: 13,
            }}>
              <span style={{ color: "#5c5f6e", fontWeight: 600 }}>Filtra:</span>
              {[
                { v: "all", l: "Tutti" },
                { v: "processing", l: "In lavorazione" },
                { v: "completed", l: "Completati" },
                { v: "refunded", l: "Rimborsati" },
              ].map((f) => (
                <button key={f.v} onClick={() => setStatusFilter(f.v)} style={pillBtn(statusFilter === f.v)}>
                  {f.l}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={showExcluded} onChange={(e) => setShowExcluded(e.target.checked)} />
                <span style={{ color: "#5c5f6e" }}>Mostra esclusi</span>
              </label>
            </div>

            <OrdersTable orders={displayedOrders} isIncluded={isIncluded} onToggle={toggleExclude} />

            <InvoiceRecap
              month={month}
              feeCalc={feeCalc}
              from={data.from}
              to={data.to}
              onCopy={copyInvoice}
              copied={copied}
            />
          </>
        )}

        {!data && !loading && !error && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9c9a97", fontSize: 14 }}>
            Seleziona un mese e clicca <strong>Carica ordini</strong> per iniziare.
          </div>
        )}
      </main>

      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />

      <style>{`
        @media (max-width: 720px) { .pf-hide-mobile { display: none !important; } }
        @media print {
          .pf-noprint { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────

function SectionHeader({ title, subtitle, onInfoClick }: {
  title: string; subtitle?: string; onInfoClick?: () => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "#0d0e1f" }}>
          {title}
        </h2>
        {onInfoClick && (
          <button
            type="button"
            onClick={onInfoClick}
            aria-label="Come viene calcolata la fee"
            title="Come viene calcolata la fee"
            className="pf-noprint"
            style={{
              width: 22, height: 22, borderRadius: "50%",
              border: "1.5px solid #c7ccec",
              background: "rgba(26,37,128,0.06)",
              color: "#1a2580",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
              fontSize: 12, fontWeight: 700, fontFamily: "'Times New Roman', serif",
              fontStyle: "italic",
              lineHeight: 1,
            }}
          >
            i
          </button>
        )}
      </div>
      {subtitle && (
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9c9a97" }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─── Info modal ───────────────────────────────────────────────────

function InfoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="pf-noprint"
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(13,14,31,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 14,
          maxWidth: 640, width: "100%", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          padding: "1.75rem 1.75rem 2rem",
          color: "#0d0e1f",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#9c9a97", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Come funziona
            </p>
            <h3 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Come viene calcolata la fee
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            style={{
              width: 30, height: 30, borderRadius: 8, border: "none",
              background: "#f7f6f4", color: "#5c5f6e",
              cursor: "pointer", fontSize: 18, fontWeight: 500, lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.65, color: "#0d0e1f" }}>
          <p style={{ margin: "0 0 1rem" }}>
            Il compenso mensile di Performance Flows su OnlyWood è composto da:
          </p>
          <ul style={{ margin: "0 0 1.25rem", paddingLeft: "1.2rem" }}>
            <li><strong>€1.000 fissi</strong> al mese</li>
            <li><strong>+ 2,5% variabile</strong> sulle vendite nette OnlyWood, calcolato come descritto sotto</li>
          </ul>

          <InfoStep n={1} title="Ordini considerati">
            Statuti WooCommerce: <code>processing</code>, <code>completed</code>, <code>refunded</code>. Sono gli stessi che WooCommerce Analytics usa nel report Fatturato — puoi verificarli in <em>wp-admin → Analytics → Fatturato</em>.
          </InfoStep>

          <InfoStep n={2} title="Vendite nette (WooCommerce)">
            Partiamo dalla <strong>&laquo;Vendite nette&raquo; del dashboard WooCommerce</strong>, calcolata come:
            <div style={infoFormula}>
              Vendite lorde &minus; Codici promozionali &minus; Resi
            </div>
            Le spese di spedizione e le imposte sono già escluse. Il numero mostrato in alto nella pagina è identico a quello che vedi in Analytics.
          </InfoStep>

          <InfoStep n={3} title="Conversione ex-IVA">
            Le vendite nette WooCommerce sono IVA-inclusa (perché onlywood.it vende con prezzi IVA inclusi). Il 2,5% si applica sull'<strong>imponibile</strong>:
            <div style={infoFormula}>
              Imponibile = Vendite nette &divide; 1,22
            </div>
            Se un ordine ha l'IVA registrata a livello WooCommerce (raro), viene usata quella specifica aliquota invece del 22% standard.
          </InfoStep>

          <InfoStep n={4} title="Ordini marketplace esclusi">
            Gli ordini provenienti da ManoMano, Amazon, eBay o altri marketplace non entrano nella base di calcolo (per contratto). Vengono rilevati automaticamente cercando parole chiave nel metodo di pagamento e nelle note dell'ordine. Puoi verificare quali ordini sono marketplace nella tabella (badge arancione).
          </InfoStep>

          <InfoStep n={5} title="Formula finale">
            <div style={infoFormula}>
              Base fee = Imponibile &minus; Ordini marketplace<br />
              Fee variabile = Base fee &times; 2,5%<br />
              Fee totale = €1.000 + Fee variabile
            </div>
            La fee mostrata è l'<strong>imponibile</strong> — sulla fattura si aggiunge poi il 22% di IVA.
          </InfoStep>

          <InfoStep n={6} title="Esclusioni manuali">
            Con il pulsante verde nella tabella puoi escludere manualmente un ordine specifico dal calcolo (utile per casi particolari — ordini di test, resi che non compaiono nei report ecc.). Le esclusioni valgono solo per la tua sessione e sono salvate nel browser.
          </InfoStep>

          <p style={{ margin: "1.5rem 0 0", padding: "0.85rem 1rem", background: "#faf9f7", borderRadius: 10, fontSize: 13, color: "#5c5f6e", lineHeight: 1.6 }}>
            <strong style={{ color: "#0d0e1f" }}>Nota sui rimborsi.</strong> WooCommerce Analytics conta i rimborsi per data del rimborso stesso (non della vendita), quindi un rimborso emesso a giugno su un ordine di maggio compare in giugno. La nostra pagina rispetta la stessa logica.
          </p>
        </div>
      </div>
    </div>
  );
}

const infoFormula: React.CSSProperties = {
  margin: "0.6rem 0 0",
  padding: "0.75rem 1rem",
  background: "#f7f6f4",
  border: "1px solid #e8e6e3",
  borderRadius: 8,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 13,
  color: "#0d0e1f",
  lineHeight: 1.7,
};

function InfoStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.1rem", display: "flex", gap: 12 }}>
      <div style={{
        flexShrink: 0,
        width: 26, height: 26, borderRadius: "50%",
        background: "#1a2580", color: "#ffffff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700,
        marginTop: 1,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 0.35rem", fontSize: 14, fontWeight: 700, color: "#0d0e1f", letterSpacing: "-0.01em" }}>
          {title}
        </h4>
        <div style={{ fontSize: 13, color: "#3a3d4d", lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────

function WcCard({ label, value, accent, muted, negative }: {
  label: string; value: string; accent?: boolean; muted?: boolean; negative?: boolean;
}) {
  return (
    <div style={{
      background: accent ? "rgba(26,37,128,0.06)" : "#ffffff",
      border: `1px solid ${accent ? "#c7ccec" : "#e8e6e3"}`,
      borderRadius: 10, padding: "0.75rem 0.9rem",
    }}>
      <p style={{
        margin: 0, fontSize: 10, fontWeight: 700, color: "#9c9a97",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>{label}</p>
      <p style={{
        margin: "0.3rem 0 0",
        fontSize: accent ? 18 : muted ? 14 : 15,
        fontWeight: accent ? 700 : 600,
        color: negative ? "#dc2626" : muted ? "#5c5f6e" : accent ? "#1a2580" : "#0d0e1f",
        letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums",
      }}>{value}</p>
    </div>
  );
}

function FeeCard({ label, value, sub, accent, highlight, negative }: {
  label: string; value: string; sub?: string;
  accent?: boolean; highlight?: boolean; negative?: boolean;
}) {
  return (
    <div style={{
      background: highlight ? "#1a2580" : accent ? "rgba(26,37,128,0.06)" : "#ffffff",
      color: highlight ? "#ffffff" : "#0d0e1f",
      border: highlight ? "none" : `1px solid ${accent ? "#c7ccec" : "#e8e6e3"}`,
      borderRadius: 12, padding: "1rem 1.15rem",
      boxShadow: highlight ? "0 4px 14px rgba(26,37,128,0.18)" : "none",
    }}>
      <p style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        color: highlight ? "rgba(255,255,255,0.7)" : "#9c9a97",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>{label}</p>
      <p style={{
        margin: "0.3rem 0 0",
        fontSize: highlight ? 24 : accent ? 20 : 18,
        fontWeight: 700, letterSpacing: "-0.02em",
        color: negative ? "#dc2626" : undefined,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</p>
      {sub && (
        <p style={{
          margin: "0.3rem 0 0", fontSize: 11,
          color: highlight ? "rgba(255,255,255,0.75)" : "#5c5f6e",
        }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Orders table ─────────────────────────────────────────────────

function OrdersTable({
  orders, isIncluded, onToggle,
}: {
  orders: OnlyWoodOrder[];
  isIncluded: (o: OnlyWoodOrder) => boolean;
  onToggle: (id: number) => void;
}) {
  if (orders.length === 0) {
    return (
      <div style={{
        background: "#ffffff", border: "1px solid #e8e6e3", borderRadius: 12,
        padding: "2.5rem 1rem", textAlign: "center", color: "#9c9a97", fontSize: 14,
      }}>
        Nessun ordine per i filtri selezionati.
      </div>
    );
  }
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e8e6e3", borderRadius: 12,
      overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 24,
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#faf9f7", textAlign: "left" }}>
              <th style={th()}></th>
              <th style={th()}>#</th>
              <th style={th()}>Data</th>
              <th style={th()}>Stato</th>
              <th style={th()}>Cliente</th>
              <th style={th()}>MP</th>
              <th style={{ ...th(), textAlign: "right" }}>Totale</th>
              <th style={{ ...th(), textAlign: "right" }} className="pf-hide-mobile">Subtotale</th>
              <th style={{ ...th(), textAlign: "right" }} className="pf-hide-mobile">Sconto</th>
              <th style={{ ...th(), textAlign: "right" }} className="pf-hide-mobile">Rimborsi</th>
              <th style={{ ...th(), textAlign: "right" }}>Contributo imp.</th>
              <th style={{ ...th(), textAlign: "right" }}>Fee 2,5%</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const included = isIncluded(o);
              const s = STATUS_STYLE[o.status] ?? { bg: "rgba(107,114,128,0.12)", color: "#6b7280", label: o.status };
              return (
                <tr key={o.id} style={{
                  borderTop: "1px solid #f0ede9",
                  opacity: included ? 1 : 0.55,
                  background: !included ? "#faf9f7" : undefined,
                }}>
                  <td style={td()}>
                    <ToggleSwitch checked={included} onChange={() => onToggle(o.id)} disabled={!!o.marketplace}
                      title={o.marketplace ? "Marketplace: escluso automaticamente" : included ? "Escludi" : "Includi"} />
                  </td>
                  <td style={td()}>
                    <a href={o.order_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1a2580", textDecoration: "none", fontWeight: 600 }}>
                      #{o.number}
                    </a>
                  </td>
                  <td style={td()}>{fmtDate(o.date)}</td>
                  <td style={td()}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 20,
                      background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
                    }}>{s.label}</span>
                  </td>
                  <td style={td()}>
                    <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                    {(o.billing_city || o.billing_state) && (
                      <div style={{ fontSize: 11, color: "#9c9a97" }}>
                        {o.billing_city}{o.billing_state ? ` (${o.billing_state})` : ""}
                      </div>
                    )}
                  </td>
                  <td style={td()}>
                    {o.marketplace ? (
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 20,
                        background: "rgba(234,88,12,0.12)", color: "#ea580c",
                        fontSize: 11, fontWeight: 600,
                      }}>{o.marketplace}</span>
                    ) : ""}
                  </td>
                  <td style={{ ...td(), textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {eur(o.total)}
                  </td>
                  <td style={{ ...td(), textAlign: "right", color: "#5c5f6e", fontVariantNumeric: "tabular-nums" }} className="pf-hide-mobile">
                    {eur(o.subtotal_gross)}
                  </td>
                  <td style={{ ...td(), textAlign: "right", color: o.discount_gross > 0 ? "#dc2626" : "#9c9a97", fontVariantNumeric: "tabular-nums" }} className="pf-hide-mobile">
                    {o.discount_gross > 0 ? `− ${eur(o.discount_gross)}` : "—"}
                  </td>
                  <td style={{ ...td(), textAlign: "right", color: o.refunds_gross > 0 ? "#dc2626" : "#9c9a97", fontVariantNumeric: "tabular-nums" }} className="pf-hide-mobile">
                    {o.refunds_gross > 0 ? `− ${eur(o.refunds_gross)}` : "—"}
                  </td>
                  <td style={{ ...td(), textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                    title={`IVA rimossa: ${eur(o.iva_removed)}`}>
                    {eur(o.net_contribution_net)}
                  </td>
                  <td style={{ ...td(), textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {included ? eur(o.fee) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled, title }: {
  checked: boolean; onChange: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onChange} disabled={disabled} title={title}
      style={{
        width: 34, height: 20, borderRadius: 20, border: "none",
        background: disabled ? "#e2e0dc" : checked ? "#16a34a" : "#dcdad7",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s", padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 16 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.15s",
      }} />
    </button>
  );
}

// ─── Invoice recap ────────────────────────────────────────────────

type FeeCalc = {
  totalNetExIva: number;
  marketplaceNetExIva: number;
  manuallyExcludedNetExIva: number;
  manuallyExcludedCount: number;
  marketplaceCount: number;
  includedCount: number;
  feeBase: number;
  feeVariable: number;
  feeFixed: number;
  feeTotal: number;
};

function InvoiceRecap({
  month, feeCalc, from, to, onCopy, copied,
}: {
  month: string; feeCalc: FeeCalc; from: string; to: string;
  onCopy: () => void; copied: boolean;
}) {
  const imponibile = feeCalc.feeTotal;

  return (
    <section style={{
      background: "#0d0e1f", color: "#ffffff", borderRadius: 14,
      padding: "1.75rem", marginTop: 20,
      boxShadow: "0 6px 20px rgba(13,14,31,0.18)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Riepilogo fattura
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
            {monthLabel(month)}
          </h2>
        </div>
        <div className="pf-noprint" style={{ display: "flex", gap: 8 }}>
          <button onClick={onCopy} style={{
            padding: "0.55rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)",
            background: copied ? "#16a34a" : "rgba(255,255,255,0.06)", color: "#ffffff",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s",
          }}>
            {copied ? "Copiato ✓" : "Copia testo"}
          </button>
          <button onClick={() => window.print()} style={{
            padding: "0.55rem 1rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.06)", color: "#ffffff",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            Esporta PDF
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Cliente</p>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>
            <div style={{ fontWeight: 600 }}>{CLIENT_INFO.ragione}</div>
            <div>{CLIENT_INFO.indirizzo}</div>
            <div>{CLIENT_INFO.citta}</div>
            <div>P.IVA {CLIENT_INFO.piva}</div>
          </div>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Competenza</p>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>
            <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{monthLabel(month)}</div>
            <div>{fmtDate(from)} – {fmtDate(to)}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              {feeCalc.includedCount} ordini inclusi · {feeCalc.marketplaceCount} marketplace esclusi
              {feeCalc.manuallyExcludedCount > 0 ? ` · ${feeCalc.manuallyExcludedCount} esclusi manualmente` : ""}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.06)", borderRadius: 10,
        padding: "1rem 1.25rem",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 13, lineHeight: 1.9,
      }}>
        <RecapLine label="Quota fissa mensile" value={eur(feeCalc.feeFixed)} />
        <RecapLine label={`Quota variabile 2,5% su ${eur(feeCalc.feeBase)}`} value={eur(feeCalc.feeVariable)} />
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "0.35rem 0" }} />
        <RecapLine label="Totale da fatturare (imponibile)" value={`${eur(imponibile)} + IVA 22%`} strong highlight />
      </div>

      <p style={{ margin: "1rem 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
        Base: vendite nette WooCommerce Analytics (statuti processing + completed + refunded) ex-IVA, al netto degli ordini marketplace.
      </p>
    </section>
  );
}

function RecapLine({ label, value, strong, highlight }: {
  label: string; value: string; strong?: boolean; highlight?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      color: highlight ? "#f59e0b" : strong ? "#ffffff" : "rgba(255,255,255,0.85)",
      fontWeight: strong ? 700 : 400,
    }}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function buildInvoiceText(month: string, feeCalc: FeeCalc): string {
  const label = monthLabel(month);
  const imponibile = feeCalc.feeTotal;
  const pad = (str: string, len: number) => str.padEnd(len, " ");
  return [
    `RIEPILOGO FATTURA — ${label}`,
    ``,
    `Cliente:      ${CLIENT_INFO.ragione}`,
    `              ${CLIENT_INFO.indirizzo}`,
    `              ${CLIENT_INFO.citta}`,
    `              P.IVA ${CLIENT_INFO.piva}`,
    ``,
    `Voci:`,
    `  ${pad("Quota fissa mensile", 40)} ${eur(feeCalc.feeFixed)}`,
    `  ${pad(`Quota variabile 2,5% su ${eur(feeCalc.feeBase)}`, 40)} ${eur(feeCalc.feeVariable)}`,
    `  ─────────────────────────────────────────────────────`,
    `  ${pad("Totale da fatturare (imponibile)", 40)} ${eur(imponibile)} + IVA 22%`,
    ``,
    `Note: base di calcolo vendite nette WooCommerce Analytics ex-IVA`,
    `(statuti processing + completed + refunded), meno ordini marketplace.`,
    `Ordini inclusi: ${feeCalc.includedCount} · marketplace: ${feeCalc.marketplaceCount}`,
  ].join("\n");
}

function csvCell(v: string): string {
  const s = String(v ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.55rem 1rem", borderRadius: 8, border: "none",
    background: disabled ? "#e2e0dc" : "#1a2580",
    color: disabled ? "#9c9a97" : "#ffffff",
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}

function btnGhost(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.5rem 0.9rem", borderRadius: 8,
    border: "1.5px solid #dcdad7", background: "#ffffff",
    color: disabled ? "#9c9a97" : "#0d0e1f",
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}

function pillBtn(active: boolean): React.CSSProperties {
  return {
    padding: "0.35rem 0.75rem", borderRadius: 20,
    border: "1px solid " + (active ? "#1a2580" : "#dcdad7"),
    background: active ? "#1a2580" : "#ffffff",
    color: active ? "#ffffff" : "#5c5f6e",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit",
  };
}

function th(): React.CSSProperties {
  return {
    padding: "0.65rem 0.75rem", fontSize: 11, fontWeight: 700,
    color: "#9c9a97", letterSpacing: "0.05em", textTransform: "uppercase",
    borderBottom: "1px solid #e8e6e3", whiteSpace: "nowrap",
  };
}

function td(): React.CSSProperties {
  return { padding: "0.65rem 0.75rem", verticalAlign: "middle" };
}
