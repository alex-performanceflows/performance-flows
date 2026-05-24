import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints/common";
import type { QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints/data-sources";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// ─── Database IDs ─────────────────────────────────────────────────
export const DB = {
  crm:            "32737be1-b168-8032-9ff8-000ba768a3dd",
  contratti:      "32a37be1-b168-802c-adc5-000bfee5408b",
  task:           "32b37be1-b168-8000-8901-000be0b23a40",
  fatturazioni:   "33137be1-b168-802b-84a8-000b23309617",
  touchpoints:    "33137be1-b168-8096-9326-000b40fb0df5",
  pipeline:       "32b37be1-b168-8045-8956-000b336fe6cd",
  contatti:       "32b37be1-b168-80a2-96f9-000ba0b49105",
  // Portale Clienti
  portaleClienti: "36037be1-b168-80f6-b70c-ff67ab12e4e0",
  portalTask:     "32b37be1-b168-80a2-8b90-d0475facc951",
  portalMeetings: "33137be1-b168-8098-9c5a-d5298d05eb4e",
  pacchetti:         "36337be1-b168-8062-be7d-c9fcd96e222f",
  internalReviews:   "34737be1-b168-8032-b4f6-fd5f2bd1a153",
} as const;

export type DatabaseKey = keyof typeof DB;

// ─── Generic query helper (data sources API — for existing DBs) ───
type QueryOptions = Omit<QueryDataSourceParameters, "data_source_id">;

export async function queryDatabase(
  databaseId: string,
  options: QueryOptions = {}
): Promise<PageObjectResponse[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.dataSources.query({
      data_source_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
      ...options,
    });

    for (const r of res.results) {
      if (r.object === "page" && "properties" in r) {
        results.push(r as PageObjectResponse);
      }
    }

    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return results;
}

// ─── Fetch page block content as plain text ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBlockText(block: any): string {
  const types = ["paragraph","heading_1","heading_2","heading_3",
    "bulleted_list_item","numbered_list_item","to_do","callout","quote"];
  for (const t of types) {
    if (block.type === t && block[t]?.rich_text) {
      return block[t].rich_text.map((r: { plain_text: string }) => r.plain_text).join("");
    }
  }
  return "";
}

export async function fetchPageContent(pageId: string): Promise<string> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
      },
    }
  );
  if (!res.ok) return "";
  const data = await res.json();
  return (data.results as unknown[])
    .map(extractBlockText)
    .filter(Boolean)
    .join("\n");
}

// ─── Link Rapidi (tabella in pagina Portale Cliente) ──────────────
export type LinkRapido = { label: string; url: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = any;

async function fetchBlockChildren(blockId: string): Promise<Block[]> {
  const results: Block[] = [];
  let cursor: string | undefined;
  do {
    const qs = cursor ? `?page_size=100&start_cursor=${cursor}` : `?page_size=100`;
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${blockId}/children${qs}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );
    if (!res.ok) return results;
    const data = await res.json();
    results.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

function richTextPlain(rt: Block[]): string {
  return (rt ?? []).map((r) => r.plain_text ?? "").join("").trim();
}

function richTextUrl(rt: Block[]): string {
  for (const r of rt ?? []) {
    if (r.href) return r.href;
    if (r.text?.link?.url) return r.text.link.url;
  }
  return "";
}

function extractLinksFromTableRows(rows: Block[]): LinkRapido[] {
  const out: LinkRapido[] = [];
  rows.forEach((row, i) => {
    if (row.type !== "table_row") return;
    const cells: Block[][] = row.table_row?.cells ?? [];
    const labelText = richTextPlain(cells[0] ?? []);
    const linkRt = cells[1] ?? [];
    const linkText = richTextPlain(linkRt);
    const url = richTextUrl(linkRt) || (/^https?:\/\//i.test(linkText) ? linkText : "");
    if (i === 0) {
      const lower = `${labelText} ${linkText}`.toLowerCase();
      if (!url && (lower.includes("documento") || lower.includes("link") || lower.includes("nome"))) return;
    }
    if (!url) return;
    out.push({ label: labelText || linkText || url, url });
  });
  return out;
}

function extractLinksFromBlocks(blocks: Block[]): LinkRapido[] {
  const out: LinkRapido[] = [];
  const textTypes = ["paragraph", "bulleted_list_item", "numbered_list_item", "to_do", "toggle"];
  for (const b of blocks) {
    if (!textTypes.includes(b.type)) continue;
    const rt: Block[] = b[b.type]?.rich_text ?? [];
    const url = richTextUrl(rt);
    if (!url) continue;
    const label = richTextPlain(rt) || url;
    out.push({ label, url });
  }
  return out;
}

export async function fetchLinkRapidi(pageId: string): Promise<LinkRapido[]> {
  const blocks = await fetchBlockChildren(pageId);
  const headingIdx = blocks.findIndex((b) => {
    const t = b.type as string | undefined;
    if (!t || !t.startsWith("heading_")) return false;
    return richTextPlain(b[t]?.rich_text ?? []).toLowerCase() === "link rapidi";
  });
  if (headingIdx === -1) return [];

  const heading = blocks[headingIdx];
  const headingType = heading.type as string;
  const isToggle = heading[headingType]?.is_toggleable === true;

  if (isToggle && heading.has_children) {
    const children = await fetchBlockChildren(heading.id);
    const tableChild = children.find((c) => c.type === "table" && c.has_children);
    if (tableChild) {
      const rows = await fetchBlockChildren(tableChild.id);
      return extractLinksFromTableRows(rows);
    }
    return extractLinksFromBlocks(children);
  }

  const siblings: Block[] = [];
  for (let i = headingIdx + 1; i < blocks.length; i++) {
    const b = blocks[i];
    if (typeof b.type === "string" && b.type.startsWith("heading_")) break;
    siblings.push(b);
  }
  const tableSibling = siblings.find((b) => b.type === "table" && b.has_children);
  if (tableSibling) {
    const rows = await fetchBlockChildren(tableSibling.id);
    return extractLinksFromTableRows(rows);
  }
  return extractLinksFromBlocks(siblings);
}

// ─── Standard REST query helper (for normal Notion databases) ─────
// Uses /v1/databases/{id}/query — works with regular database IDs.
export async function queryDatabaseRest(
  databaseId: string,
  options: { filter?: unknown; sorts?: unknown[]; page_size?: number } = {}
): Promise<PageObjectResponse[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100, ...options };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message ?? "Notion query failed");
    }

    const data = await res.json();

    for (const r of data.results) {
      if (r.object === "page" && r.properties) {
        results.push(r as PageObjectResponse);
      }
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return results;
}

// ─── Property extractors ──────────────────────────────────────────
type Props = PageObjectResponse["properties"];

export function getText(props: Props, key: string): string {
  const p = props[key];
  if (!p) return "";
  if (p.type === "title") return p.title.map((t) => t.plain_text).join("");
  if (p.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("");
  return "";
}

// Trova il titolo della pagina cercando per tipo, non per nome della proprietà
export function getPageTitle(props: Props): string {
  for (const p of Object.values(props)) {
    if (p.type === "title") return p.title.map((t) => t.plain_text).join("");
  }
  return "";
}

export function getNumber(props: Props, key: string): number {
  const p = props[key];
  if (p?.type === "number") return p.number ?? 0;
  return 0;
}

export function getFormulaNumber(props: Props, key: string): number {
  const p = props[key];
  if (p?.type === "formula" && p.formula.type === "number") return p.formula.number ?? 0;
  if (p?.type === "formula" && p.formula.type === "string") return parseFloat(p.formula.string ?? "0") || 0;
  return 0;
}

export function getFormulaString(props: Props, key: string): string {
  const p = props[key];
  if (p?.type === "formula" && p.formula.type === "string") return p.formula.string ?? "";
  if (p?.type === "formula" && p.formula.type === "number") return String(p.formula.number ?? "");
  return "";
}

export function getRollupNumber(props: Props, key: string): number {
  const p = props[key];
  if (p?.type !== "rollup") return 0;
  const r = p.rollup;
  if (r.type === "number") return r.number ?? 0;
  if (r.type === "array") {
    const nums = r.array.filter((x) => x.type === "number").map((x) => (x as { type: "number"; number: number | null }).number ?? 0);
    return nums.reduce((a, b) => a + b, 0);
  }
  return 0;
}

export function getSelect(props: Props, key: string): string {
  const p = props[key];
  if (p?.type === "select") return p.select?.name ?? "";
  if (p?.type === "status") return p.status?.name ?? "";
  return "";
}

export function getMultiSelect(props: Props, key: string): string[] {
  const p = props[key];
  if (p?.type === "multi_select") return p.multi_select.map((s) => s.name);
  return [];
}

export function getPeople(props: Props, key: string): string[] {
  const p = props[key];
  if (p?.type !== "people") return [];
  return p.people.map((u) => (u as { id: string; name?: string }).name ?? u.id);
}

export function getCheckbox(props: Props, key: string): boolean {
  const p = props[key];
  if (p?.type === "checkbox") return p.checkbox;
  return false;
}

export function getDate(props: Props, key: string): string | null {
  const p = props[key];
  if (p?.type === "date") return p.date?.start ?? null;
  return null;
}

export function getRelation(props: Props, key: string): string[] {
  const p = props[key];
  if (p?.type === "relation") return p.relation.map((r) => r.id);
  return [];
}

export function getUrl(props: Props, key: string): string {
  const p = props[key];
  if (p?.type === "url") return p.url ?? "";
  if (p?.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("");
  return "";
}

// ─── Row builders (nomi proprietà verificati dal DB reale) ────────

export function buildClientRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Name"),
    mrr: getFormulaNumber(p, "MRR (€)"),
    valoreStorico: getRollupNumber(p, "Valore Storico (€)"),
    stato: getSelect(p, "Status"),
    sentiment: getSelect(p, "Sentiment"),
    risultati: getSelect(p, "Risultati"),
    attenzione: getFormulaString(p, "Attenzione"),
  };
}

export function buildContrattoRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Descrizione"),
    cliente: getRelation(p, "CRM Clienti"),
    tipo: getSelect(p, "Tipo"),
    valore: getNumber(p, "Valore"),
    durataMesi: getFormulaNumber(p, "Durata (mesi)"),
    valoreStorico: getFormulaNumber(p, "Valore Storico"),
    stato: getSelect(p, "Stato"),
    mrrNetto: getFormulaNumber(p, "Valore MRR Netto"),
  };
}

export function buildTaskRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Name"),
    stato: getSelect(p, "Stato"),
    priorita: getSelect(p, "Priorità"),
    scadenza: getDate(p, "Scadenza"),
    assignedTo: getPeople(p, "Assigned To"),
    cliente: getRelation(p, "CRM Clienti"),
    durata: getNumber(p, "Tempo impiegato (h)"),
  };
}

export function buildFatturaRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getPageTitle(p),
    importo: getNumber(p, "Importo"),
    dataEmissione: getDate(p, "Data Emissione"),
    emessa: getCheckbox(p, "Emessa?"),
    contratto: getRelation(p, "📄 Contratti"),
  };
}

export function buildPipelineRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Nome"),
    fase: getSelect(p, "Fase"),
    tipoOpportunita: getSelect(p, "Tipo opportunità"),
    valoreStimato: getNumber(p, "Probabilità"),
    responsabile: getPeople(p, "Responsabile"),
    prossimoFollowup: getDate(p, "Data"),
    chiusa: false,
  };
}

export function buildPacchettoRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Nome pacchetto") || getPageTitle(p),
    oreAcquistate: getNumber(p, "Ore acquistate"),
    oreUsate: getFormulaNumber(p, "Ore totali usate"),
    oreRimanenti: getFormulaNumber(p, "Ore Rimanenti"),
    taskIds: getRelation(p, "Task"),
    meetingIds: getRelation(p, "📅 Meetings"),
    reviewIds: getRelation(p, "🧞‍♂️ Internal reviews"),
  };
}

export async function fetchPageDetails(pageId: string): Promise<{ nome: string; data: string | null; durata: number | null }> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!res.ok) return { nome: "", data: null, durata: null };
  const page = await res.json();
  const props = page.properties as Props;
  return {
    nome: getPageTitle(props),
    data: getDate(props, "Data") || getDate(props, "Data Review"),
    durata: getNumber(props, "Durata (h)") || getNumber(props, "Durata ore") || getNumber(props, "Ore") || null,
  };
}

export function buildPortaleClienteRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Name"),
    slug: getText(p, "Slug URL"),
    password: getText(p, "Password"),
    calendly: getUrl(p, "Calendly"),
    googleDrive: getUrl(p, "Google Drive"),
    lookerStudio: getUrl(p, "Looker Studio"),
    altriLink: getText(p, "Altri Link"),
    crmId: getRelation(p, "Cliente")[0] ?? null,
  };
}

export function buildPortalMeetingRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    titolo: getText(p, "Name"),
    data: getDate(p, "Data"),
    tipo: getSelect(p, "Tipo"),
    durata: getNumber(p, "Durata (h)"),
  };
}

export function buildTouchpointRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    cliente: getRelation(p, "CRM Clienti"),
    tipo: getSelect(p, "Tipo"),
    canale: getSelect(p, "Canale"),
    data: getDate(p, "Data"),
    sentimentCall: getSelect(p, "Sentiment meeting"),
    note: "",
  };
}
