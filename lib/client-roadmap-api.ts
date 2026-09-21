// Route handler per roadmap e meeting di un cliente: la logica è una sola,
// ogni dashboard la monta sul proprio percorso (/api/<cliente>/...).

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import {
  CRM_CLIENT_IDS,
  fetchClientMeetingContent,
  fetchClientMeetings,
  fetchClientRoadmap,
  fetchClientRoadmapItemContent,
  type ClientKey,
} from "@/lib/client-roadmap";

/** Notion viene riletto al massimo ogni 10 minuti. */
const REVALIDATE = 600;

type IdContext = { params: Promise<{ id: string }> };

function failed(err: unknown) {
  const message = err instanceof Error ? err.message : "Errore sconosciuto";
  return NextResponse.json({ error: message }, { status: 502 });
}

export function roadmapListRoute(client: ClientKey) {
  const load = unstable_cache(
    async () => ({
      items: await fetchClientRoadmap(CRM_CLIENT_IDS[client]),
      aggiornato: new Date().toISOString(),
    }),
    [`${client}-roadmap-v3`],
    { revalidate: REVALIDATE, tags: [`${client}-roadmap`] },
  );

  return async function GET() {
    try {
      return NextResponse.json(await load());
    } catch (err) {
      return failed(err);
    }
  };
}

/** Il contenuto arriva solo per attività collegate a questo cliente. */
export function roadmapItemRoute(client: ClientKey) {
  const load = unstable_cache(
    async (id: string) => fetchClientRoadmapItemContent(CRM_CLIENT_IDS[client], id),
    [`${client}-roadmap-item-content-v1`],
    { revalidate: REVALIDATE, tags: [`${client}-roadmap`] },
  );

  return async function GET(_req: Request, { params }: IdContext) {
    const { id } = await params;
    try {
      const blocks = await load(id);
      if (!blocks) return NextResponse.json({ error: "Attività non disponibile" }, { status: 404 });
      return NextResponse.json({ id, blocks });
    } catch (err) {
      return failed(err);
    }
  };
}

/** Solo meeting con il cliente: quelli segnati "Interna?" restano fuori. */
export function meetingsListRoute(client: ClientKey) {
  const load = unstable_cache(
    async () => ({
      meetings: await fetchClientMeetings(CRM_CLIENT_IDS[client]),
      aggiornato: new Date().toISOString(),
    }),
    [`${client}-meetings-v1`],
    { revalidate: REVALIDATE, tags: [`${client}-roadmap`] },
  );

  return async function GET() {
    try {
      return NextResponse.json(await load());
    } catch (err) {
      return failed(err);
    }
  };
}

/** Il contenuto arriva solo per meeting di questo cliente e non interni. */
export function meetingContentRoute(client: ClientKey) {
  const load = unstable_cache(
    async (id: string) => fetchClientMeetingContent(CRM_CLIENT_IDS[client], id),
    [`${client}-meeting-content-v1`],
    { revalidate: REVALIDATE, tags: [`${client}-roadmap`] },
  );

  return async function GET(_req: Request, { params }: IdContext) {
    const { id } = await params;
    try {
      const blocks = await load(id);
      if (!blocks) return NextResponse.json({ error: "Meeting non disponibile" }, { status: 404 });
      return NextResponse.json({ id, blocks });
    } catch (err) {
      return failed(err);
    }
  };
}
