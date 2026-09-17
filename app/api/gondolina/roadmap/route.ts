import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CRM_CLIENT_IDS, fetchClientRoadmap } from "@/lib/client-roadmap";

// Notion viene riletto al massimo ogni 10 minuti
const getRoadmap = unstable_cache(
  async () => ({
    items: await fetchClientRoadmap(CRM_CLIENT_IDS.gondolina),
    aggiornato: new Date().toISOString(),
  }),
  ["gondolina-roadmap-v3"],
  { revalidate: 600, tags: ["gondolina-roadmap"] },
);

export async function GET() {
  try {
    return NextResponse.json(await getRoadmap());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
