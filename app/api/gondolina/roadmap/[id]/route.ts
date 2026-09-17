import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CRM_CLIENT_IDS, fetchClientRoadmapItemContent } from "@/lib/client-roadmap";

// Il contenuto arriva solo per attività collegate a Gondolina nella Roadmap Progetti
const getItemContent = unstable_cache(
  async (id: string) => fetchClientRoadmapItemContent(CRM_CLIENT_IDS.gondolina, id),
  ["gondolina-roadmap-item-content-v1"],
  { revalidate: 600, tags: ["gondolina-roadmap"] },
);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const blocks = await getItemContent(id);
    if (!blocks) return NextResponse.json({ error: "Attività non disponibile" }, { status: 404 });
    return NextResponse.json({ id, blocks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
