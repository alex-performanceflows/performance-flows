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
  shipping_total: string;
  shipping_tax: string;
  total: string;
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
  items_net: number;
  shipping_net: number;
  iva_removed: number;
  refunds_total_incl_tax: number;
  refunds_net: number;
  refunds_attributed_to_items: number;
  net_items_for_fee: number;
  total: number;
  fee: number;
  items_count: number;
  items_summary: string;
  order_url: string;
};

export type OnlyWoodSummary = {
  total_orders: number;
  included_orders: number;
  excluded_marketplace: number;
  items_net_all: number;
  net_subtotal: number;
  shipping_net_all: number;
  refunds_net_all: number;
  fee_variable: number;
  fee_fixed: number;
  fee_total: number;
};

export type OnlyWoodResponse = {
  month: string;
  from: string;
  to: string;
  orders: OnlyWoodOrder[];
  summary: OnlyWoodSummary;
};

const MARKETPLACE_KEYWORDS = [
  { key: "manomano", label: "ManoMano" },
  { key: "amazon", label: "Amazon" },
  { key: "ebay", label: "eBay" },
  { key: "marketplace", label: "Marketplace" },
];

const INCLUDED_STATUSES = ["pending", "processing", "on-hold", "completed"];

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return isFinite(n) ? n : 0;
}

function detectMarketplace(order: WcOrder): string | null {
  const haystack = `${order.payment_method_title ?? ""} ${order.customer_note ?? ""}`.toLowerCase();
  for (const { key, label } of MARKETPLACE_KEYWORDS) {
    if (haystack.includes(key)) return label;
  }
  return null;
}

// Bordi mese in timezone Europe/Rome, restituiti come stringhe locali senza offset
// (WooCommerce interpreta le date senza tz secondo il timezone del sito, che è Europe/Rome)
function monthBounds(month: string): { after: string; before: string; from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstDay = `${y}-${pad(m)}-01`;
  // Ultimo giorno del mese: setto il giorno 0 del mese successivo
  const lastDate = new Date(Date.UTC(y, m, 0));
  const lastDay = `${y}-${pad(m)}-${pad(lastDate.getUTCDate())}`;
  return {
    after: `${firstDay}T00:00:00`,
    before: `${lastDay}T23:59:59`,
    from: firstDay,
    to: lastDay,
  };
}

async function fetchAllOrders(month: string): Promise<WcOrder[]> {
  const base = process.env.ONLYWOOD_API_URL;
  const ck = process.env.ONLYWOOD_CK;
  const cs = process.env.ONLYWOOD_CS;
  if (!base || !ck || !cs) throw new Error("Credenziali OnlyWood mancanti nell'env");

  const auth = "Basic " + Buffer.from(`${ck}:${cs}`).toString("base64");
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
    if (page > 50) break; // safety
  }
  return orders;
}

function mapOrder(o: WcOrder): OnlyWoodOrder {
  const marketplace = detectMarketplace(o);

  // Somme grezze da WooCommerce
  const itemsRaw = (o.line_items ?? []).reduce((a, li) => a + num(li.total), 0);
  const itemsWcTax = (o.line_items ?? []).reduce((a, li) => a + num(li.total_tax), 0);
  const shippingRaw = num(o.shipping_total);
  const shippingWcTax = num(o.shipping_tax);
  const orderTotal = num(o.total);
  const orderWcTax = itemsWcTax + shippingWcTax;

  // Aliquota effettiva: se WC ha registrato tax, la deduco; altrimenti assumo 22%
  const orderNetForRate = orderTotal - orderWcTax;
  const orderTaxRate = orderWcTax > 0 && orderNetForRate > 0
    ? orderWcTax / orderNetForRate
    : 0.22;

  // Netto items (imponibile): se WC ha già separato il tax uso raw, altrimenti divido
  const itemsNet = itemsWcTax > 0
    ? itemsRaw
    : itemsRaw / (1 + orderTaxRate);
  const shippingNet = shippingWcTax > 0
    ? shippingRaw
    : shippingRaw / (1 + orderTaxRate);

  // IVA totale rimossa dall'ordine (items + spedizione)
  const ivaItems = itemsWcTax > 0 ? itemsWcTax : Math.max(0, itemsRaw - itemsNet);
  const ivaShipping = shippingWcTax > 0 ? shippingWcTax : Math.max(0, shippingRaw - shippingNet);
  const ivaRemoved = ivaItems + ivaShipping;

  // Rimborsi WC (refunds.total è sempre IVA-inclusa)
  let refundsSumInclTax = 0;
  for (const r of o.refunds ?? []) refundsSumInclTax += num(r.total);
  const refundsTotalInclTax = Math.abs(refundsSumInclTax);
  const refundsTotalNet = refundsTotalInclTax / (1 + orderTaxRate);

  // Attribuzione proporzionale del rimborso alla quota items
  const orderNetForShare = itemsNet + shippingNet;
  const itemsShare = orderNetForShare > 0 ? itemsNet / orderNetForShare : 1;
  const refundsAttributedToItems = refundsTotalNet * itemsShare;

  const netItemsForFee = Math.max(0, itemsNet - refundsAttributedToItems);

  // Fee 2,5% solo se non marketplace
  const fee = marketplace ? 0 : netItemsForFee * 0.025;

  const items = o.line_items ?? [];
  const itemsCount = items.reduce((acc, i) => acc + (i.quantity ?? 0), 0);
  const itemsSummary = items
    .slice(0, 3)
    .map((i) => `${i.name} × ${i.quantity}`)
    .join(", ") + (items.length > 3 ? ` +${items.length - 3} altri` : "");

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
    items_net: round2(itemsNet),
    shipping_net: round2(shippingNet),
    iva_removed: round2(ivaRemoved),
    refunds_total_incl_tax: round2(refundsTotalInclTax),
    refunds_net: round2(refundsTotalNet),
    refunds_attributed_to_items: round2(refundsAttributedToItems),
    net_items_for_fee: round2(netItemsForFee),
    total: round2(num(o.total)),
    fee: round2(fee),
    items_count: itemsCount,
    items_summary: itemsSummary,
    order_url: `https://www.onlywood.it/wp-admin/post.php?post=${o.id}&action=edit`,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function summarize(orders: OnlyWoodOrder[]): OnlyWoodSummary {
  const included = orders.filter((o) => !o.marketplace);
  const items_net_all = round2(orders.reduce((a, o) => a + o.items_net, 0));
  const net_subtotal = round2(included.reduce((a, o) => a + o.net_items_for_fee, 0));
  const shipping_net_all = round2(orders.reduce((a, o) => a + o.shipping_net, 0));
  const refunds_net_all = round2(orders.reduce((a, o) => a + o.refunds_net, 0));
  const fee_variable = round2(included.reduce((a, o) => a + o.fee, 0));
  const fee_fixed = 1000;
  return {
    total_orders: orders.length,
    included_orders: included.length,
    excluded_marketplace: orders.length - included.length,
    items_net_all,
    net_subtotal,
    shipping_net_all,
    refunds_net_all,
    fee_variable,
    fee_fixed,
    fee_total: round2(fee_fixed + fee_variable),
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

    const raw = await fetchAllOrders(month);
    const mapped = raw.map(mapOrder);
    const summary = summarize(mapped);
    const { from, to } = monthBounds(month);

    const body: OnlyWoodResponse = { month, from, to, orders: mapped, summary };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
