import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints/common";
import type { QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints/data-sources";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// ─── Database IDs ─────────────────────────────────────────────────
export const DB = {
  crm:          "32737be1-b168-8032-9ff8-000ba768a3dd",
  contratti:    "32a37be1-b168-802c-adc5-000bfee5408b",
  task:         "32b37be1-b168-8000-8901-000be0b23a40",
  fatturazioni: "33137be1-b168-802b-84a8-000b23309617",
  touchpoints:  "33137be1-b168-8096-9326-000b40fb0df5",
  pipeline:     "32b37be1-b168-8045-8956-000b336fe6cd",
  contatti:     "32b37be1-b168-80a2-96f9-000ba0b49105",
} as const;

export type DatabaseKey = keyof typeof DB;

// ─── Generic query helper ─────────────────────────────────────────
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

// ─── Property extractors ──────────────────────────────────────────
type Props = PageObjectResponse["properties"];

export function getText(props: Props, key: string): string {
  const p = props[key];
  if (!p) return "";
  if (p.type === "title") return p.title.map((t) => t.plain_text).join("");
  if (p.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("");
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
  };
}

export function buildFatturaRow(page: PageObjectResponse) {
  const p = page.properties;
  return {
    id: page.id,
    nome: getText(p, "Name"),
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
