import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────

type WcLineItem = {
  id: number;
  name: string;
  quantity: number;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
};

type WcRefundSummary = {
  id: number;
  reason: string | null;
  total: string;
};

type WcOrder = {
  id: number;
  number: string;
  status: string;
  date_created: string;
  customer_note: string | null;
  payment_method: string;
  payment_method_title: string;
  discount_total: string;
  shipping_total: string;
  shipping_tax: string;
  total: string;
  total_tax: string;
  billing: {
    first_name?: string;
    last_name?: string;
    email?: string;
    city?: string;
    state?: string;
  };
  line_items: WcLineItem[];
  refunds: WcRefundSummary[];
};

type WcAnalyticsStats = {
  orders_count: number;
  num_items_sold: number;
  gross_sales: number;
  total_sales: number;
  coupons: number;
  coupons_count: number;
  refunds: number;
  taxes: number;
  shipping: number;
  net_revenue: number;
};

export type OnlyWoodOrder = {
  id: number;
  number: string;
  date: string;
  status: string;
  customer_name: string;
  customer_email: string;
  billing_city: string;
  billing_state: string;
  payment_method: string;
  marketplace: string | null;

  // Numeri "come li mostra il cliente" (IVA inclusa)
  subtotal_gross: number;      // pre-coupon (line_items.subtotal + subtotal_tax)
  discount_gross: number;       // order.discount_total
  refunds_gross: number;        // sum of order.refunds[].total (abs)
  shipping_gross: number;       // shipping_total + shipping_tax
  total: number;                // order.total (customer-paid)
  iva_removed: number;          // IVA totale rimossa dall'ordine (items + shipping)

  // Contributo net (post-coupon, post-refund) IVA inclusa e imponibile
  net_contribution_gross: number;   // subtotal_gross - discount_gross - refunds_gross
  net_contribution_net: number;     // ex-IVA (base fee per questo ordine)

  fee: number;
  items_count: number;
  items_summary: string;
  order_url: string;
};

export type WcTotalsReport = {
  gross_sales: number;      // vendite lorde
  coupons: number;          // codici promozionali
  refunds: number;          // resi
  net_revenue: number;      // vendite nette (base per fee)
  taxes: number;            // imposte registrate da WC
  shipping: number;         // spedizione
  total_sales: number;      // totale delle vendite
  orders_count: number;
};

export type OnlyWoodSummary = {
  // WC dashboard (fonte di verità)
  wc: WcTotalsReport;
  wc_net_revenue_ex_iva: number;  // net_revenue equivalente ex-IVA (base fee sana)

  // Ordini marketplace (esclusi dal fee)
  marketplace_orders: number;
  marketplace_net_gross: number;
  marketplace_net_ex_iva: number;

  // Override manuali (contati dalla UI, qui a 0)
  manually_excluded_net_gross: number;
  manually_excluded_net_ex_iva: number;

  // Base fee finale (WC net revenue - marketplace - override, ex-IVA)
  fee_base: number;
  fee_variable: number;
  fee_fixed: number;
  fee_total: number;
};

export type OnlyWoodResponse = {
  month: string;
  from: string;
  to: string;
  wc: WcTotalsReport;
  orders: OnlyWoodOrder[];
  summary: OnlyWoodSummary;
};

const MARKETPLACE_KEYWORDS = [
  { key: "manomano", label: "ManoMano" },
  { key: "amazon", label: "Amazon" },
  { key: "ebay", label: "eBay" },
  { key: "marketplace", label: "Marketplace" },
];

// Statuti allineati a WooCommerce Analytics dashboard
const INCLUDED_STATUSES = ["processing", "completed", "refunded"];

const FEE_FIXED = 1000;
const FEE_RATE = 0.025;

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isFinite(n) ? n : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function detectMarketplace(order: WcOrder): string | null {
  const haystack = `${order.payment_method_title ?? ""} ${order.customer_note ?? ""}`.toLowerCase();
  for (const { key, label } of MARKETPLACE_KEYWORDS) {
    if (haystack.includes(key)) return label;
  }
  return null;
}

function monthBounds(month: string): { after: string; before: string; from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstDay = `${y}-${pad(m)}-01`;
  const lastDate = new Date(Date.UTC(y, m, 0));
  const lastDay = `${y}-${pad(m)}-${pad(lastDate.getUTCDate())}`;
  return {
    after: `${firstDay}T00:00:00`,
    before: `${lastDay}T23:59:59`,
    from: firstDay,
    to: lastDay,
  };
}

function wcAuth(): string {
  const ck = process.env.ONLYWOOD_CK;
  const cs = process.env.ONLYWOOD_CS;
  if (!ck || !cs) throw new Error("Credenziali OnlyWood mancanti nell'env");
  return "Basic " + Buffer.from(`${ck}:${cs}`).toString("base64");
}

async function fetchAnalyticsStats(month: string): Promise<WcTotalsReport> {
  const auth = wcAuth();
  const { after, before } = monthBounds(month);
  const base = process.env.ONLYWOOD_API_URL?.replace(/\/wc\/v3\/?$/, "/wc-analytics");
  const url = `${base}/reports/revenue/stats?after=${after}&before=${before}&interval=month`;
  const res = await fetch(url, { headers: { Authorization: auth }, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WC Analytics ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { totals: WcAnalyticsStats };
  const t = data.totals;
  return {
    gross_sales: round2(t.gross_sales),
    coupons: round2(t.coupons),
    refunds: round2(t.refunds),
    net_revenue: round2(t.net_revenue),
    taxes: round2(t.taxes),
    shipping: round2(t.shipping),
    total_sales: round2(t.total_sales),
    orders_count: t.orders_count,
  };
}

async function fetchAllOrders(month: string): Promise<WcOrder[]> {
  const auth = wcAuth();
  const base = process.env.ONLYWOOD_API_URL;
  const { after, before } = monthBounds(month);

  const orders: WcOrder[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const params = new URLSearchParams({
      status: INCLUDED_STATUSES.join(","),
      after,
      before,
      per_page: String(perPage),
      page: String(page),
      orderby: "date",
      order: "desc",
    });
    const url = `${base}/orders?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: auth, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WooCommerce ${res.status}: ${text.slice(0, 200)}`);
    }
    const batch = (await res.json()) as WcOrder[];
    orders.push(...batch);
    if (batch.length < perPage) break;
    page++;
    if (page > 50) break;
  }
  return orders;
}

function effectiveTaxRate(o: WcOrder): number {
  const orderTotal = num(o.total);
  const orderTax = num(o.total_tax) + (o.line_items ?? []).reduce((a, li) => a + num(li.total_tax), 0);
  // WC restituisce spesso o.total_tax = shipping_tax + line_items.total_tax già aggregato,
  // ma sommiamo indipendenti per robustezza — se WC lo raddoppia, non importa: usiamo il max ragionevole.
  const usedTax = Math.min(num(o.total_tax) || orderTax, orderTax);
  const net = orderTotal - usedTax;
  if (usedTax > 0 && net > 0) return usedTax / net;
  return 0.22; // fallback: prezzi WC senza tax class → IVA embedded 22%
}

function mapOrder(o: WcOrder): OnlyWoodOrder {
  const marketplace = detectMarketplace(o);

  // Numeri gross (IVA inclusa, come li vede il cliente)
  const subtotalGrossItems = (o.line_items ?? []).reduce(
    (a, li) => a + num(li.subtotal) + num(li.subtotal_tax),
    0
  );
  const discountGross = num(o.discount_total);
  const shippingGross = num(o.shipping_total) + num(o.shipping_tax);
  const orderTotal = num(o.total);

  let refundsGross = 0;
  for (const r of o.refunds ?? []) refundsGross += Math.abs(num(r.total));

  // Aliquota effettiva per convertire in imponibile
  const rate = effectiveTaxRate(o);

  // Ex-IVA per singole componenti
  const subtotalNetItems = subtotalGrossItems / (1 + rate);
  const shippingNet = shippingGross / (1 + rate);
  const discountNet = discountGross / (1 + rate);
  const refundsNet = refundsGross / (1 + rate);

  // Contributo netto dell'ordine alle "vendite nette":
  //   gross: subtotale items pre-coupon - coupon - rimborsi (IVA inclusa)
  //   net:   ex-IVA equivalente
  const netContributionGross = Math.max(0, subtotalGrossItems - discountGross - refundsGross);
  const netContributionNet = Math.max(0, subtotalNetItems - discountNet - refundsNet);

  // IVA rimossa dall'ordine = items IVA + shipping IVA (per informazione tabella)
  const ivaItems = subtotalGrossItems - subtotalNetItems;
  const ivaShipping = shippingGross - shippingNet;
  const ivaRemoved = ivaItems + ivaShipping;

  // Fee per singolo ordine: 2,5% sul contributo netto ex-IVA (se non marketplace)
  const fee = marketplace ? 0 : netContributionNet * FEE_RATE;

  const items = o.line_items ?? [];
  const itemsCount = items.reduce((a, i) => a + (i.quantity ?? 0), 0);
  const itemsSummary =
    items.slice(0, 3).map((i) => `${i.name} × ${i.quantity}`).join(", ") +
    (items.length > 3 ? ` +${items.length - 3} altri` : "");

  const customerName = `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim();

  return {
    id: o.id,
    number: o.number,
    date: o.date_created?.slice(0, 10) ?? "",
    status: o.status,
    customer_name: customerName || "—",
    customer_email: o.billing?.email ?? "",
    billing_city: o.billing?.city ?? "",
    billing_state: o.billing?.state ?? "",
    payment_method: o.payment_method_title || o.payment_method || "",
    marketplace,
    subtotal_gross: round2(subtotalGrossItems),
    discount_gross: round2(discountGross),
    refunds_gross: round2(refundsGross),
    shipping_gross: round2(shippingGross),
    total: round2(orderTotal),
    iva_removed: round2(ivaRemoved),
    net_contribution_gross: round2(netContributionGross),
    net_contribution_net: round2(netContributionNet),
    fee: round2(fee),
    items_count: itemsCount,
    items_summary: itemsSummary,
    order_url: `https://www.onlywood.it/wp-admin/post.php?post=${o.id}&action=edit`,
  };
}

function summarize(wc: WcTotalsReport, orders: OnlyWoodOrder[]): OnlyWoodSummary {
  const marketplace = orders.filter((o) => o.marketplace);
  const marketplace_net_gross = round2(marketplace.reduce((a, o) => a + o.net_contribution_gross, 0));
  const marketplace_net_ex_iva = round2(marketplace.reduce((a, o) => a + o.net_contribution_net, 0));

  // WC net_revenue è in "subtotali WC" che per OnlyWood sono per lo più IVA-inclusi (nessuna tax class).
  // Ex-IVA aggregato = somma dei net_contribution_net di tutti gli ordini processing/completed/refunded
  // (approssima wc.net_revenue / 1.22 con precisione, senza doppie divisioni).
  const total_net_ex_iva = round2(orders.reduce((a, o) => a + o.net_contribution_net, 0));

  const fee_base = round2(Math.max(0, total_net_ex_iva - marketplace_net_ex_iva));
  const fee_variable = round2(fee_base * FEE_RATE);

  return {
    wc,
    wc_net_revenue_ex_iva: total_net_ex_iva,
    marketplace_orders: marketplace.length,
    marketplace_net_gross,
    marketplace_net_ex_iva,
    manually_excluded_net_gross: 0,
    manually_excluded_net_ex_iva: 0,
    fee_base,
    fee_variable,
    fee_fixed: FEE_FIXED,
    fee_total: round2(FEE_FIXED + fee_variable),
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = url.searchParams.get("month") ?? defaultMonth;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Parametro 'month' non valido (formato YYYY-MM)" }, { status: 400 });
    }

    const [wc, raw] = await Promise.all([
      fetchAnalyticsStats(month),
      fetchAllOrders(month),
    ]);
    const mapped = raw.map(mapOrder);
    const summary = summarize(wc, mapped);
    const { from, to } = monthBounds(month);

    const body: OnlyWoodResponse = { month, from, to, wc, orders: mapped, summary };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
