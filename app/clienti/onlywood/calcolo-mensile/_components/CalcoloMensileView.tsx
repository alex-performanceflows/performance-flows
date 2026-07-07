"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { OnlyWoodOrder, OnlyWoodResponse, OnlyWoodSummary } from "@/app/api/onlywood/orders/route";

// ─── Formatting ───────────────────────────────────────────────────

const EUR = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});
const NUM2 = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

function eur(n: number): string {
  return EUR.format(n || 0);
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  completed:  { bg: "rgba(22,163,74,0.12)",  color: "#16a34a", label: "Completato" },
  processing: { bg: "rgba(37,99,235,0.12)",  color: "#2563eb", label: "In lavorazione" },
  "on-hold":  { bg: "rgba(217,119,6,0.12)",  color: "#d97706", label: "In attesa" },
  pending:    { bg: "rgba(107,114,128,0.12)",color: "#6b7280", label: "Pending" },
};

const CLIENT_INFO = {
  ragione: "OnlyWood S.r.l.",
  indirizzo: "Piazza della Libertà 7 int.14",
  citta: "15061 Arquata Scrivia (AL)",
  piva: "02065100063",
};

const IVA_RATE = 0.22;

function excludedKey(month: string) {
  return `pf.calcOw.excluded.${month}`;
}

function readExcluded(month: string): Set<number> {
  try {
    const raw = localStorage.getItem(excludedKey(month));
    if (!raw) return new Set();
    return new Set((JSON.parse(raw) as number[]) ?? []);
  } catch {
    return new Set();
  }
}

function writeExcluded(month: string, s: Set<number>) {
  try {
    localStorage.setItem(excludedKey(month), JSON.stringify(Array.from(s)));
  } catch {}
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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

  useEffect(() => {
    setManuallyExcluded(readExcluded(month));
  }, [month]);

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
    } finally {
      setLoading(false);
    }
  }, [month]);

  function toggleExclude(orderId: number) {
    setManuallyExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
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

  const summary: OnlyWoodSummary = useMemo(() => {
    if (!data) return {
      total_orders: 0, included_orders: 0, excluded_marketplace: 0,
      items_net_all: 0, net_subtotal: 0, shipping_net_all: 0, refunds_net_all: 0,
      fee_variable: 0, fee_fixed: 1000, fee_total: 1000,
    };
    const included = orders.filter(isIncluded);
    const items_net_all = orders.reduce((a, o) => a + o.items_net, 0);
    const net_subtotal = included.reduce((a, o) => a + o.net_items_for_fee, 0);
    const shipping_net_all = orders.reduce((a, o) => a + o.shipping_net, 0);
    const refunds_net_all = orders.reduce((a, o) => a + o.refunds_net, 0);
    const fee_variable = included.reduce((a, o) => a + o.fee, 0);
    const fee_fixed = 1000;
    return {
      total_orders: orders.length,
      included_orders: included.length,
      excluded_marketplace: orders.filter((o) => o.marketplace).length,
      items_net_all: round2(items_net_all),
      net_subtotal: round2(net_subtotal),
      shipping_net_all: round2(shipping_net_all),
      refunds_net_all: round2(refunds_net_all),
      fee_variable: round2(fee_variable),
      fee_fixed,
      fee_total: round2(fee_fixed + fee_variable),
    };
  }, [data, orders, isIncluded]);

  const ivaRemovedTotal = useMemo(
    () => orders.reduce((a, o) => a + o.iva_removed, 0),
    [orders]
  );

  const manuallyExcludedCount = useMemo(
    () => orders.filter((o) => !o.marketplace && manuallyExcluded.has(o.id)).length,
    [orders, manuallyExcluded]
  );

  const invoiceText = useMemo(() => buildInvoiceText(month, summary), [month, summary]);

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
      ["Numero", "Data", "Stato", "Cliente", "Città", "Prov", "Email", "Imponibile items €", "Spedizione €", "IVA €", "Totale €", "Rimborsi (imp.) €", "Netto items €", "Fee 2,5% €"],
      ...included.map((o) => [
        o.number,
        o.date,
        o.status,
        o.customer_name,
        o.billing_city,
        o.billing_state,
        o.customer_email,
        NUM2.format(o.items_net),
        NUM2.format(o.shipping_net),
        NUM2.format(o.iva_removed),
        NUM2.format(o.total),
        NUM2.format(o.refunds_attributed_to_items),
        NUM2.format(o.net_items_for_fee),
        NUM2.format(o.fee),
      ]),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calcolo-onlywood-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f7f6f4", fontFamily: "Inter, sans-serif", color: "#0d0e1f" }}>
      {/* Header */}
      <header className="pf-noprint" style={{
        background: "#1a2580",
        padding: "0 1.5rem",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 30,
        boxShadow: "0 1px 8px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image
            src="/images/logo-white.webp"
            alt="Performance Flows"
            width={194}
            height={80}
            priority
            style={{ height: 32, width: "auto", display: "block" }}
          />
          <div style={{ width: 1, height: 26, background: "rgba(255,255,255,0.22)", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
            {clientName} · Calcolo fee mensile
          </p>
        </div>
      </header>

      {/* Controls */}
      <div className="pf-noprint" style={{
        background: "#ffffff",
        borderBottom: "1px solid #e8e6e3",
        padding: "1rem 1.5rem",
        position: "sticky",
        top: 60,
        zIndex: 25,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <label style={{ fontSize: 12, color: "#5c5f6e", fontWeight: 600 }}>Mese</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "0.45rem 0.65rem",
            border: "1.5px solid #dcdad7",
            borderRadius: 8,
            fontSize: 14,
            background: "#f7f6f4",
            color: "#0d0e1f",
            fontFamily: "inherit",
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
            Caricamento ordini in corso…
          </div>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}>
              <SummaryCard
                label="Ordini inclusi"
                value={String(summary.included_orders)}
                sub={`${summary.excluded_marketplace} marketplace esclusi${manuallyExcludedCount > 0 ? ` · ${manuallyExcludedCount} manuali` : ""}`}
              />
              <SummaryCard
                label="Vendite nette (imponibile)"
                value={eur(summary.net_subtotal)}
                sub={summary.refunds_net_all > 0 ? `Rimborsi: ${eur(summary.refunds_net_all)}` : "Nessun rimborso"}
              />
              <SummaryCard
                label="IVA rimossa"
                value={eur(ivaRemovedTotal)}
                sub="Somma per tutti gli ordini"
              />
              <SummaryCard
                label="Fee variabile (2,5%)"
                value={eur(summary.fee_variable)}
                sub="Solo ordini inclusi"
              />
              <SummaryCard
                label="Fee totale da fatturare"
                value={eur(summary.fee_total)}
                sub={`Fisso ${eur(summary.fee_fixed)} + var. ${eur(summary.fee_variable)}`}
                highlight
              />
            </div>

            <p style={{ fontSize: 13, color: "#5c5f6e", margin: "0 0 20px", lineHeight: 1.6 }}>
              Base di calcolo: <strong style={{ color: "#0d0e1f" }}>imponibile netto IVA</strong>. Fattura da emettere: <strong style={{ color: "#0d0e1f" }}>{eur(summary.fee_fixed)}</strong> (fisso) + <strong style={{ color: "#0d0e1f" }}>{eur(summary.fee_variable)}</strong> (2,5% su <strong style={{ color: "#0d0e1f" }}>{eur(summary.net_subtotal)}</strong>) = <strong style={{ color: "#1a2580" }}>{eur(summary.fee_total)} + IVA 22%</strong>
            </p>

            {/* Filters */}
            <div className="pf-noprint" style={{
              display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
              marginBottom: 12, fontSize: 13,
            }}>
              <span style={{ color: "#5c5f6e", fontWeight: 600 }}>Filtra:</span>
              {[
                { v: "all", l: "Tutti" },
                { v: "completed", l: "Completati" },
                { v: "processing", l: "In lavorazione" },
                { v: "on-hold", l: "In attesa" },
                { v: "pending", l: "Pending" },
              ].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setStatusFilter(f.v)}
                  style={pillBtn(statusFilter === f.v)}
                >
                  {f.l}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showExcluded}
                  onChange={(e) => setShowExcluded(e.target.checked)}
                />
                <span style={{ color: "#5c5f6e" }}>Mostra esclusi</span>
              </label>
            </div>

            <OrdersTable orders={displayedOrders} isIncluded={isIncluded} onToggle={toggleExclude} />

            <InvoiceRecap
              month={month}
              summary={summary}
              from={data.from}
              to={data.to}
              onCopy={copyInvoice}
              copied={copied}
            />
          </>
        )}

        {!data && !loading && !error && (
          <div style={{
            textAlign: "center", padding: "3rem 1rem",
            color: "#9c9a97", fontSize: 14,
          }}>
            Seleziona un mese e clicca <strong>Carica ordini</strong> per iniziare.
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 720px) {
          .pf-hide-mobile { display: none !important; }
        }
        @media print {
          .pf-noprint { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Summary card ─────────────────────────────────────────────────

function SummaryCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div style={{
      background: highlight ? "#1a2580" : "#ffffff",
      color: highlight ? "#ffffff" : "#0d0e1f",
      border: highlight ? "none" : "1px solid #e8e6e3",
      borderRadius: 12,
      padding: "1.1rem 1.2rem",
      boxShadow: highlight ? "0 4px 14px rgba(26,37,128,0.18)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <p style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        color: highlight ? "rgba(255,255,255,0.7)" : "#9c9a97",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>{label}</p>
      <p style={{
        margin: "0.35rem 0 0", fontSize: highlight ? 26 : 22,
        fontWeight: 700, letterSpacing: "-0.02em",
      }}>{value}</p>
      {sub && (
        <p style={{
          margin: "0.3rem 0 0", fontSize: 12,
          color: highlight ? "rgba(255,255,255,0.75)" : "#5c5f6e",
        }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Orders table ─────────────────────────────────────────────────

function OrdersTable({
  orders,
  isIncluded,
  onToggle,
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
              <th style={{ ...th(), textAlign: "right" }}>Imponibile</th>
              <th style={{ ...th(), textAlign: "right" }} className="pf-hide-mobile">Spedizione</th>
              <th style={{ ...th(), textAlign: "right" }} className="pf-hide-mobile">IVA</th>
              <th style={{ ...th(), textAlign: "right" }}>Rimborsi</th>
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
                    <ToggleSwitch checked={included} onChange={() => onToggle(o.id)} disabled={!!o.marketplace} title={o.marketplace ? "Marketplace: escluso automaticamente" : included ? "Escludi" : "Includi"} />
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
                  <td style={{ ...td(), textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {eur(o.items_net)}
                  </td>
                  <td style={{ ...td(), textAlign: "right", color: "#9c9a97", fontVariantNumeric: "tabular-nums" }} className="pf-hide-mobile">
                    {eur(o.shipping_net)}
                  </td>
                  <td style={{ ...td(), textAlign: "right", color: "#5c5f6e", fontVariantNumeric: "tabular-nums" }} className="pf-hide-mobile">
                    {eur(o.iva_removed)}
                  </td>
                  <td
                    style={{ ...td(), textAlign: "right", color: o.refunds_net > 0 ? "#dc2626" : "#9c9a97", fontVariantNumeric: "tabular-nums" }}
                    title={o.refunds_net > 0 ? `Attribuiti a items: ${eur(o.refunds_attributed_to_items)}` : ""}
                  >
                    {o.refunds_net > 0 ? `− ${eur(o.refunds_net)}` : "—"}
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
      onClick={onChange}
      disabled={disabled}
      title={title}
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

function InvoiceRecap({
  month, summary, from, to, onCopy, copied,
}: {
  month: string; summary: OnlyWoodSummary; from: string; to: string;
  onCopy: () => void; copied: boolean;
}) {
  const imponibile = summary.fee_total;
  const iva = round2(imponibile * IVA_RATE);
  const totale = round2(imponibile + iva);

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
              {summary.included_orders} ordini inclusi · {summary.excluded_marketplace} marketplace esclusi
            </div>
          </div>
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "1rem 1.25rem",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 1.9,
      }}>
        <RecapLine label="Quota fissa mensile" value={eur(summary.fee_fixed)} />
        <RecapLine label={`Quota variabile 2,5% su ${eur(summary.net_subtotal)}`} value={eur(summary.fee_variable)} />
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "0.35rem 0" }} />
        <RecapLine label="TOTALE IMPONIBILE" value={eur(imponibile)} strong />
        <RecapLine label="IVA 22%" value={eur(iva)} />
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "0.35rem 0" }} />
        <RecapLine label="TOTALE DA PAGARE" value={eur(totale)} strong highlight />
      </div>

      <p style={{ margin: "1rem 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
        Base di calcolo: imponibile WooCommerce (netto IVA), al netto di rimborsi (attribuiti proporzionalmente alla quota items dell'ordine) e ordini marketplace.
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

function buildInvoiceText(month: string, s: OnlyWoodSummary): string {
  const label = monthLabel(month);
  const imponibile = s.fee_total;
  const iva = round2(imponibile * IVA_RATE);
  const totale = round2(imponibile + iva);
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
    `  ${pad("Quota fissa mensile", 40)} ${eur(s.fee_fixed)}`,
    `  ${pad(`Quota variabile 2,5% su ${eur(s.net_subtotal)}`, 40)} ${eur(s.fee_variable)}`,
    `  ─────────────────────────────────────────────────────`,
    `  ${pad("TOTALE IMPONIBILE", 40)} ${eur(imponibile)}`,
    `  ${pad("IVA 22%", 40)} ${eur(iva)}`,
    `  ─────────────────────────────────────────────────────`,
    `  ${pad("TOTALE DA PAGARE", 40)} ${eur(totale)}`,
    ``,
    `Note: base di calcolo imponibile netto IVA WooCommerce,`,
    `al netto di rimborsi e ordini marketplace.`,
    `Ordini inclusi: ${s.included_orders} · esclusi marketplace: ${s.excluded_marketplace}`,
  ].join("\n");
}

function csvCell(v: string): string {
  const s = String(v ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.55rem 1rem",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#e2e0dc" : "#1a2580",
    color: disabled ? "#9c9a97" : "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}

function btnGhost(disabled: boolean): React.CSSProperties {
  return {
    padding: "0.5rem 0.9rem",
    borderRadius: 8,
    border: "1.5px solid #dcdad7",
    background: "#ffffff",
    color: disabled ? "#9c9a97" : "#0d0e1f",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
  };
}

function pillBtn(active: boolean): React.CSSProperties {
  return {
    padding: "0.35rem 0.75rem",
    borderRadius: 20,
    border: "1px solid " + (active ? "#1a2580" : "#dcdad7"),
    background: active ? "#1a2580" : "#ffffff",
    color: active ? "#ffffff" : "#5c5f6e",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

function th(): React.CSSProperties {
  return {
    padding: "0.65rem 0.75rem",
    fontSize: 11,
    fontWeight: 700,
    color: "#9c9a97",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderBottom: "1px solid #e8e6e3",
    whiteSpace: "nowrap",
  };
}

function td(): React.CSSProperties {
  return {
    padding: "0.65rem 0.75rem",
    verticalAlign: "middle",
  };
}
