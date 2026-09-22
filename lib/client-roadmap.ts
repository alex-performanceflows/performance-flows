// Roadmap e meeting di un cliente, letti da Notion per le dashboard cliente.
// Tutto ciò che è interno (meeting con "Interna?", sentiment, partecipanti, owner
// nominativi, trascrizioni) resta sul server: al browser arrivano solo i campi qui sotto.

import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints/common";
import {
  DB, queryDatabaseRest,
  getPageTitle, getSelect, getDate, getNumber, getCheckbox, getRelation,
} from "@/lib/notion";
import { fetchPageBlocks, hasPageContent, notionGet, type ContentBlock } from "@/lib/notion-content";

/** Pagine dei clienti nel CRM Notion. */
export const CRM_CLIENT_IDS = {
  gondolina: "37537be1-b168-80bb-b00a-c74e0fa21380",
  momi: "33e37be1-b168-8069-8b22-ce4125aaecea",
  onlywood: "32937be1-b168-8035-8f0f-f297196e07ff",
  coorie: "36037be1-b168-80cd-80c4-c1b73056e1cc",
} as const;

export type ClientKey = keyof typeof CRM_CLIENT_IDS;

export type RoadmapOwner = "pf" | "cliente" | "joint";

export type RoadmapItem = {
  id: string;
  attivita: string;
  categoria: string | null;
  /** Colore dell'opzione in Notion (blue, red, gray…), per l'etichetta. */
  categoriaColor: string | null;
  fase: string | null;
  status: string | null;
  priorita: string | null;
  entro: string | null;
  owner: RoadmapOwner | null;
  /** La pagina dell'attività ha contenuto da aprire. */
  hasContent: boolean;
};

export type ClientMeeting = {
  id: string;
  titolo: string;
  data: string | null;
  durataOre: number | null;
};

export type { ContentBlock };

const normalizeId = (id: string) => id.replace(/-/g, "").toLowerCase();

const belongsTo = (page: PageObjectResponse, relationProp: string, crmId: string) =>
  getRelation(page.properties, relationProp).some((id) => normalizeId(id) === normalizeId(crmId));

/** Owner nominativi del team (es. "Leo") diventano Performance Flows. */
function toOwner(value: string): RoadmapOwner | null {
  if (!value) return null;
  if (value === "Cliente") return "cliente";
  if (value === "Joint") return "joint";
  return "pf";
}

// ─── Roadmap ──────────────────────────────────────────────────────

export async function fetchClientRoadmap(crmId: string): Promise<RoadmapItem[]> {
  const pages = await queryDatabaseRest(DB.roadmap, {
    filter: { property: "Cliente", relation: { contains: crmId } },
  });
  return Promise.all(pages.map(async (page) => {
    const p = page.properties;
    const categoria = p["Categoria"];
    return {
      id: page.id,
      attivita: getPageTitle(p),
      categoria: getSelect(p, "Categoria") || null,
      categoriaColor: categoria?.type === "select" ? (categoria.select?.color ?? null) : null,
      fase: getSelect(p, "Fase") || null,
      status: getSelect(p, "Status") || null,
      priorita: getSelect(p, "Priorità") || null,
      entro: getDate(p, "Data entro"),
      owner: toOwner(getSelect(p, "Owner")),
      hasContent: await hasPageContent(page.id),
    };
  }));
}

// ─── Meeting ──────────────────────────────────────────────────────

const isClientMeeting = (page: PageObjectResponse, crmId: string) =>
  !getCheckbox(page.properties, "Interna?") && belongsTo(page, "CRM Clienti", crmId);

/** Meeting con il cliente, dal più recente. Esclusi quelli segnati "Interna?". */
export async function fetchClientMeetings(crmId: string): Promise<ClientMeeting[]> {
  const pages = await queryDatabaseRest(DB.portalMeetings, {
    filter: {
      and: [
        { property: "CRM Clienti", relation: { contains: crmId } },
        { property: "Interna?", checkbox: { equals: false } },
      ],
    },
    sorts: [{ property: "Data", direction: "descending" }],
  });
  return pages
    .filter((page) => isClientMeeting(page, crmId))
    .map((page) => ({
      id: page.id,
      titolo: getPageTitle(page.properties),
      data: getDate(page.properties, "Data"),
      durataOre: getNumber(page.properties, "Durata (h)") || null,
    }));
}

// ─── Contenuto delle pagine, con controllo di appartenenza ────────

/**
 * Pagina di un database solo se passa il controllo `allowed`.
 * `null` per id non validi, pagine di altri database, archiviate o non ammesse.
 */
async function fetchAllowedPage(
  pageId: string,
  databaseId: string,
  allowed: (page: PageObjectResponse) => boolean,
): Promise<PageObjectResponse | null> {
  if (!/^[0-9a-f]{32}$/.test(normalizeId(pageId))) return null;

  let page: PageObjectResponse & { in_trash?: boolean };
  try {
    page = await notionGet<PageObjectResponse & { in_trash?: boolean }>(`/pages/${normalizeId(pageId)}`);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 400 || status === 403 || status === 404) return null;
    throw err;
  }

  const parentDb = page.parent.type === "database_id" ? page.parent.database_id : null;
  if (!parentDb || normalizeId(parentDb) !== normalizeId(databaseId)) return null;
  if (page.archived || page.in_trash) return null;
  return allowed(page) ? page : null;
}

/** Contenuto di un meeting del cliente non segnato come interno. */
export async function fetchClientMeetingContent(crmId: string, meetingId: string): Promise<ContentBlock[] | null> {
  const page = await fetchAllowedPage(meetingId, DB.portalMeetings, (p) => isClientMeeting(p, crmId));
  return page ? fetchPageBlocks(page.id) : null;
}

/** Contenuto di un'attività della roadmap del cliente. */
export async function fetchClientRoadmapItemContent(crmId: string, itemId: string): Promise<ContentBlock[] | null> {
  const page = await fetchAllowedPage(itemId, DB.roadmap, (p) => belongsTo(p, "Cliente", crmId));
  return page ? fetchPageBlocks(page.id) : null;
}
