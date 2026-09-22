// WooCommerce di Onlywood, letto in diretta dal negozio.
//
// Qui dentro finiscono i numeri che il cliente riconosce: ordini, fatturato,
// prodotti, categorie, spedizioni, resi, clienti. GA4 vede circa meta' degli
// ordini per via dei consensi, quindi per il business comanda WooCommerce.

const PER_PAGE = 100;
/** Oltre questa soglia si smette di scorrere gli ordini: i totali restano esatti
 *  perche' arrivano dai report, a essere parziali sono solo i dettagli. */
const MAX_ORDER_PAGES = 12;

export type StoreTotals = {
  ordini: number;
  articoli: number;
  fatturato_lordo: number;   // total_sales: quello che entra in cassa
  fatturato_netto: number;   // net_revenue: senza spedizioni, tasse e resi
  spedizioni: number;
  tasse: number;
  resi: number;
  coupon: number;
  scontrino_medio: number;
  articoli_per_ordine: number;
  clienti: number;
};

export type StoreDay = { data: string; ordini: number; fatturato: number; netto: number; articoli: number };

export type StoreProduct = {
  id: number; nome: string; sku: string; prezzo: number | null;
  articoli: number; fatturato: number; ordini: number;
  stock_status: string | null; stock: number | null;
};

export type StoreCategory = { id: number; nome: string; articoli: number; fatturato: number; ordini: number; prodotti: number };

export type StoreBreakdown = { nome: string; ordini: number; fatturato: number; extra?: number };

export type StoreData = {
  range: { from: string; to: string };
  totals: StoreTotals;
  prev: StoreTotals | null;
  giorni: StoreDay[];
  prodotti: StoreProduct[];
  categorie: StoreCategory[];
  varianti: StoreProduct[];
  coupon: StoreBreakdown[];
  stati: { stato: string; ordini: number }[];
  clienti: { nuovi: number; ricorrenti: number; ordini_per_cliente: number };
  spedizioni: {
    ricavo: number;
    incidenza_pct: number;      // quanto pesa la spedizione sul totale pagato
    media_per_ordine: number;
    ordini_senza_spesa: number; // spedizione gratuita o inclusa
    per_metodo: StoreBreakdown[];
    per_regione: StoreBreakdown[];
  };
  pagamenti: StoreBreakdown[];
  resi: { ordini: number; totale: number; elenco: { ordine: string; data: string; totale: number; motivo: string }[] };
  scorte_basse: { nome: string; sku: string; stock: number | null }[];
  ordini_campione: number;      // quanti ordini sono stati letti nel dettaglio
  ordini_totali: number;
  /** Voci che il negozio non ha servito in questa lettura. */
  fonti_mancanti: string[];
  aggiornato: string;
};

// ─── Chiamate al negozio ──────────────────────────────────────────

function auth(): string {
  const ck = process.env.ONLYWOOD_CK;
  const cs = process.env.ONLYWOOD_CS;
  if (!ck || !cs) throw new Error("Chiavi WooCommerce non configurate");
  return "Basic " + Buffer.from(`${ck}:${cs}`).toString("base64");
}

function base(analytics: boolean): string {
  const url = process.env.ONLYWOOD_API_URL;
  if (!url) throw new Error("ONLYWOOD_API_URL non configurato");
  const clean = url.replace(/\/$/, "");
  return analytics ? clean.replace(/\/wc\/v3$/, "/wc-analytics") : clean;
}

type WcResponse<T> = { rows: T; total: number };

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Il negozio sta dietro Cloudflare e sotto sforzo risponde 5xx o 52x invece di
 * servire la richiesta: un paio di tentativi distanziati bastano quasi sempre.
 * L'User-Agent è esplicito perché una richiesta anonima da datacenter è il
 * profilo che i filtri davanti al sito trattano peggio.
 */
async function wc<T>(path: string, params: Record<string, string | number>, analytics = true): Promise<WcResponse<T>> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${base(analytics)}${path}?${qs}`;
  const headers = {
    Authorization: auth(),
    Accept: "application/json",
    "User-Agent": "PerformanceFlows-Dashboard/1.0 (+https://performanceflows.com)",
  };

  let ultimo = "";
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    if (tentativo > 0) await attesa(1500 * tentativo);
    let res: Response;
    try {
      res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(45000) });
    } catch (e) {
      ultimo = e instanceof Error ? e.message : "connessione non riuscita";
      continue;
    }
    if (res.ok) {
      return { rows: (await res.json()) as T, total: Number(res.headers.get("x-wp-total") || 0) };
    }
    const detail = (await res.text()).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    ultimo = `${res.status} · ${detail.slice(0, 120)}`;
    // Su 4xx ritentare non serve: la richiesta è sbagliata o non autorizzata
    if (res.status < 500) break;
  }
  throw new Error(`WooCommerce ${path}: ${ultimo}`);
}

/** Tiene in volo al massimo `limite` richieste: il negozio non regge di più. */
async function aScaglioni<T>(compiti: (() => Promise<T>)[], limite: number): Promise<T[]> {
  const esiti = new Array<T>(compiti.length);
  let prossimo = 0;
  const corsie = Array.from({ length: Math.min(limite, compiti.length) }, async () => {
    while (prossimo < compiti.length) {
      const i = prossimo++;
      esiti[i] = await compiti[i]();
    }
  });
  await Promise.all(corsie);
  return esiti;
}

const n2 = (v: unknown) => Math.round((Number(v) || 0) * 100) / 100;

/**
 * Alcuni gateway scrivono nel titolo del pagamento l'indirizzo email del
 * cliente ("PayPal - mario@example.com"): va tolto, sia perché è un dato
 * personale che non ha ragione di comparire in dashboard, sia perché
 * spezzerebbe lo stesso metodo in una riga per cliente.
 */
function pulisciMetodoPagamento(titolo: string): string {
  const senzaEmail = titolo.replace(/\s*[-–—:]?\s*[^\s@]+@[^\s@]+\.[a-z]{2,}\s*/gi, " ");
  return senzaEmail.replace(/\s{2,}/g, " ").replace(/[\s\-–—:]+$/, "").trim() || "Non indicato";
}

const METODI_SPEDIZIONE: Record<string, string> = {
  flat_rate: "Tariffa fissa",
  free_shipping: "Spedizione gratuita",
  local_pickup: "Ritiro in sede",
  advanced_flat_rate: "Tariffa fissa",
};

function pulisciMetodoSpedizione(titolo: string): string {
  const t = titolo.trim();
  return METODI_SPEDIZIONE[t.toLowerCase()] ?? (t || "Non indicato");
}
const startOf = (d: string) => `${d}T00:00:00`;
const endOf = (d: string) => `${d}T23:59:59`;

// ─── Forme dei dati che arrivano da WooCommerce ───────────────────

type RevenueTotals = {
  orders_count: number; num_items_sold: number; gross_sales: number; total_sales: number;
  coupons: number; refunds: number; taxes: number; shipping: number; net_revenue: number;
  avg_items_per_order: number; avg_order_value: number; total_customers: number;
};
type RevenueStats = { totals: RevenueTotals; intervals: { date_start: string; subtotals: RevenueTotals }[] };
type ReportRow = {
  product_id?: number; variation_id?: number; category_id?: number; coupon_id?: number;
  items_sold?: number; net_revenue?: number; orders_count?: number; products_count?: number; amount?: number;
  extended_info?: { name?: string; sku?: string; price?: number; stock_status?: string; stock_quantity?: number; code?: string };
};
type AnalyticsOrder = { order_id: number; date: string; status: string; customer_type: string; net_total: number; num_items_sold: number };
type WcOrder = {
  id: number; number: string; status: string; date_created: string; total: string;
  shipping_total: string; shipping_tax: string; payment_method_title: string;
  billing?: { state?: string }; shipping?: { state?: string };
  shipping_lines?: { method_title?: string; total?: string }[];
  refunds?: { id: number; reason: string | null; total: string }[];
};
type StockRow = { name: string; sku: string; stock_quantity: number | null };
type ProductInfo = {
  id: number; name?: string; sku?: string; price?: string;
  stock_status?: string; stock_quantity?: number | null;
};

function toTotals(t: RevenueTotals | undefined): StoreTotals {
  return {
    ordini: t?.orders_count ?? 0,
    articoli: t?.num_items_sold ?? 0,
    fatturato_lordo: n2(t?.total_sales),
    fatturato_netto: n2(t?.net_revenue),
    spedizioni: n2(t?.shipping),
    tasse: n2(t?.taxes),
    resi: n2(t?.refunds),
    coupon: n2(t?.coupons),
    scontrino_medio: n2(t?.avg_order_value),
    articoli_per_ordine: n2(t?.avg_items_per_order),
    clienti: t?.total_customers ?? 0,
  };
}

function toProducts(rows: ReportRow[], idKey: "product_id" | "variation_id"): StoreProduct[] {
  return rows.map((r) => ({
    id: Number(r[idKey] ?? 0),
    nome: r.extended_info?.name?.replace(/<[^>]*>/g, "").trim() || `#${r[idKey]}`,
    sku: r.extended_info?.sku ?? "",
    prezzo: r.extended_info?.price != null ? n2(r.extended_info.price) : null,
    articoli: r.items_sold ?? 0,
    fatturato: n2(r.net_revenue),
    ordini: r.orders_count ?? 0,
    stock_status: r.extended_info?.stock_status ?? null,
    stock: r.extended_info?.stock_quantity ?? null,
  }));
}

/**
 * Nome, SKU, prezzo e magazzino dei prodotti venduti.
 *
 * Il report accetta `extended_info=true`, ma sotto carico quella variante passa
 * dai 3 ai 40 secondi perché WooCommerce risolve un prodotto per volta. Costa
 * molto meno chiedere il report nudo e poi i dettagli in un'unica chiamata.
 */
async function fetchProducts(window: { after: string; before: string }): Promise<StoreProduct[]> {
  const report = await wc<ReportRow[]>("/reports/products", {
    ...window, per_page: 50, orderby: "net_revenue", order: "desc",
  });
  const prodotti = toProducts(report.rows, "product_id");
  const ids = prodotti.map((p) => p.id).filter((id) => id > 0);
  if (ids.length === 0) return prodotti;

  try {
    const info = await wc<ProductInfo[]>("/products", {
      include: ids.join(","), per_page: 100,
      _fields: "id,name,sku,price,stock_status,stock_quantity",
    }, false);
    const byId = new Map(info.rows.map((p) => [p.id, p]));
    return prodotti.map((p) => {
      const d = byId.get(p.id);
      if (!d) return p;
      return {
        ...p,
        nome: d.name?.replace(/<[^>]*>/g, "").trim() || p.nome,
        sku: d.sku ?? "",
        prezzo: d.price ? n2(d.price) : null,
        stock_status: d.stock_status ?? null,
        stock: d.stock_quantity ?? null,
      };
    });
  } catch {
    // Senza i dettagli restano fatturato e pezzi: meglio di niente
    return prodotti;
  }
}

/** Somma per chiave, ordinata per fatturato. */
function groupBy<T>(items: T[], key: (x: T) => string, value: (x: T) => number, extra?: (x: T) => number): StoreBreakdown[] {
  const m = new Map<string, StoreBreakdown>();
  for (const it of items) {
    const k = key(it) || "Non indicato";
    const cur = m.get(k) ?? { nome: k, ordini: 0, fatturato: 0, extra: 0 };
    cur.ordini += 1;
    cur.fatturato = n2(cur.fatturato + value(it));
    if (extra) cur.extra = n2((cur.extra ?? 0) + extra(it));
    m.set(k, cur);
  }
  return [...m.values()].sort((a, b) => b.fatturato - a.fatturato);
}

/** Ordini nel dettaglio: servono per spedizioni, pagamenti e resi. */
async function fetchOrders(from: string, to: string): Promise<{ orders: WcOrder[]; total: number }> {
  const first = await wc<WcOrder[]>("/orders", {
    after: startOf(from), before: endOf(to), per_page: PER_PAGE, page: 1,
    orderby: "date", order: "desc",
  }, false);
  const total = first.total;
  const pages = Math.min(Math.ceil(total / PER_PAGE), MAX_ORDER_PAGES);
  // Le pagine successive due per volta: sono le risposte piu' pesanti di tutte
  const rest = await aScaglioni(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => () =>
      wc<WcOrder[]>("/orders", {
        after: startOf(from), before: endOf(to), per_page: PER_PAGE, page: i + 2,
        orderby: "date", order: "desc",
      }, false).then((r) => r.rows).catch(() => [] as WcOrder[]),
    ),
    2,
  );
  return { orders: [first.rows, ...rest].flat(), total };
}

// ─── Dato completo per la dashboard ───────────────────────────────

export async function fetchStoreData(from: string, to: string, prevFrom?: string, prevTo?: string): Promise<StoreData> {
  const window = { after: startOf(from), before: endOf(to) };

  // Ogni blocco è indipendente: se il negozio non serve una voce, le altre
  // arrivano lo stesso e la dashboard dice cosa manca invece di non aprirsi.
  const mancanti: string[] = [];
  function conRete<T>(nome: string, fallback: T) {
    return async (p: Promise<T>): Promise<T> => {
      try { return await p; }
      catch { mancanti.push(nome); return fallback; }
    };
  }

  // Le prime due servono i totali: senza quelle non c'è dashboard.
  const stats = await wc<RevenueStats>("/reports/revenue/stats", { ...window, interval: "day", per_page: 100 });

  const vuoto = { rows: [] as ReportRow[], total: 0 };
  const [prevStats, products, categories, variations, coupons, analyticsOrders, ordersDetail, stock] =
    await aScaglioni<unknown>([
      () => conRete<WcResponse<RevenueStats> | null>("periodo di confronto", null)(
        prevFrom && prevTo
          ? wc<RevenueStats>("/reports/revenue/stats", { after: startOf(prevFrom), before: endOf(prevTo), interval: "year", per_page: 1 })
          : Promise.resolve(null),
      ),
      () => conRete<StoreProduct[]>("prodotti", [])(fetchProducts(window)),
      () => conRete("categorie", vuoto)(wc<ReportRow[]>("/reports/categories", { ...window, per_page: 30, orderby: "net_revenue", order: "desc", extended_info: "true" })),
      () => conRete("varianti", vuoto)(wc<ReportRow[]>("/reports/variations", { ...window, per_page: 30, orderby: "net_revenue", order: "desc", extended_info: "true" })),
      () => conRete("coupon", vuoto)(wc<ReportRow[]>("/reports/coupons", { ...window, per_page: 20, orderby: "amount", order: "desc", extended_info: "true" })),
      () => conRete("tipo cliente e stati", { rows: [] as AnalyticsOrder[], total: 0 })(wc<AnalyticsOrder[]>("/reports/orders", { ...window, per_page: 100, orderby: "date", order: "desc" })),
      () => conRete("dettaglio ordini", { orders: [] as WcOrder[], total: 0 })(fetchOrders(from, to)),
      () => conRete("magazzino", { rows: [] as StockRow[], total: 0 })(wc<StockRow[]>("/reports/stock", { per_page: 20, status: "lowstock", orderby: "stock_quantity", order: "asc" })),
    ], 3) as [
      WcResponse<RevenueStats> | null, StoreProduct[],
      WcResponse<ReportRow[]>, WcResponse<ReportRow[]>, WcResponse<ReportRow[]>,
      WcResponse<AnalyticsOrder[]>, { orders: WcOrder[]; total: number }, WcResponse<StockRow[]>,
    ];

  const totals = toTotals(stats.rows.totals);

  // Andamento giornaliero
  const giorni: StoreDay[] = (stats.rows.intervals ?? []).map((i) => ({
    data: String(i.date_start).slice(0, 10),
    ordini: i.subtotals.orders_count ?? 0,
    fatturato: n2(i.subtotals.total_sales),
    netto: n2(i.subtotals.net_revenue),
    articoli: i.subtotals.num_items_sold ?? 0,
  }));

  // Stati e tipo cliente arrivano dal report ordini: e' esatto e non serve scorrere tutto
  const stati = groupBy(analyticsOrders.rows, (o) => o.status, () => 0)
    .map((s) => ({ stato: s.nome, ordini: s.ordini }))
    .sort((a, b) => b.ordini - a.ordini);
  const nuovi = analyticsOrders.rows.filter((o) => o.customer_type === "new").length;
  const ricorrenti = analyticsOrders.rows.filter((o) => o.customer_type === "returning").length;

  // Dettagli che esistono solo sull'ordine singolo
  const orders = ordersDetail.orders;
  const spedGross = (o: WcOrder) => n2(Number(o.shipping_total || 0) + Number(o.shipping_tax || 0));
  const ricavoSpedizione = n2(orders.reduce((s, o) => s + spedGross(o), 0));
  const totalePagato = n2(orders.reduce((s, o) => s + Number(o.total || 0), 0));
  const regioneDi = (o: WcOrder) => o.shipping?.state || o.billing?.state || "";

  const resiOrdini = orders.filter((o) => (o.refunds ?? []).length > 0);
  const resiTotale = n2(resiOrdini.reduce((s, o) => s + (o.refunds ?? []).reduce((r, x) => r + Math.abs(Number(x.total || 0)), 0), 0));

  return {
    range: { from, to },
    totals,
    prev: prevStats ? toTotals(prevStats.rows.totals) : null,
    giorni,
    prodotti: products,
    categorie: categories.rows.map((r) => ({
      id: Number(r.category_id ?? 0),
      nome: r.extended_info?.name ?? `#${r.category_id}`,
      articoli: r.items_sold ?? 0,
      fatturato: n2(r.net_revenue),
      ordini: r.orders_count ?? 0,
      prodotti: r.products_count ?? 0,
    })),
    varianti: toProducts(variations.rows, "variation_id"),
    coupon: coupons.rows.map((r) => ({
      nome: r.extended_info?.code ?? `#${r.coupon_id}`,
      ordini: r.orders_count ?? 0,
      fatturato: n2(r.amount),
    })),
    stati,
    clienti: {
      nuovi,
      ricorrenti,
      ordini_per_cliente: totals.clienti > 0 ? n2(totals.ordini / totals.clienti) : 0,
    },
    spedizioni: {
      ricavo: ricavoSpedizione,
      incidenza_pct: totalePagato > 0 ? n2((ricavoSpedizione / totalePagato) * 100) : 0,
      media_per_ordine: orders.length > 0 ? n2(ricavoSpedizione / orders.length) : 0,
      ordini_senza_spesa: orders.filter((o) => spedGross(o) === 0).length,
      per_metodo: groupBy(
        orders.filter((o) => (o.shipping_lines ?? []).length > 0),
        (o) => pulisciMetodoSpedizione(o.shipping_lines?.[0]?.method_title ?? ""),
        (o) => spedGross(o),
        (o) => Number(o.total || 0),
      ),
      per_regione: groupBy(orders, regioneDi, (o) => Number(o.total || 0), (o) => spedGross(o)),
    },
    pagamenti: groupBy(orders, (o) => pulisciMetodoPagamento(o.payment_method_title || ""), (o) => Number(o.total || 0)),
    resi: {
      ordini: resiOrdini.length,
      totale: resiTotale,
      elenco: resiOrdini.slice(0, 20).map((o) => ({
        ordine: o.number,
        data: o.date_created.slice(0, 10),
        totale: n2((o.refunds ?? []).reduce((s, x) => s + Math.abs(Number(x.total || 0)), 0)),
        motivo: (o.refunds ?? []).map((r) => r.reason).filter(Boolean).join(" · ") || "",
      })),
    },
    scorte_basse: stock.rows.map((s) => ({ nome: s.name, sku: s.sku, stock: s.stock_quantity })),
    ordini_campione: orders.length,
    ordini_totali: ordersDetail.total,
    fonti_mancanti: mancanti,
    aggiornato: new Date().toISOString(),
  };
}
