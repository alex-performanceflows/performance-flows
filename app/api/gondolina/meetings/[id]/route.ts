import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CRM_CLIENT_IDS, fetchClientMeetingContent } from "@/lib/client-roadmap";

// Il contenuto arriva solo per meeting di Gondolina non segnati come interni
const getMeetingContent = unstable_cache(
  async (id: string) => fetchClientMeetingContent(CRM_CLIENT_IDS.gondolina, id),
  ["gondolina-meeting-content-v1"],
  { revalidate: 600, tags: ["gondolina-roadmap"] },
);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const blocks = await getMeetingContent(id);
    if (!blocks) return NextResponse.json({ error: "Meeting non disponibile" }, { status: 404 });
    return NextResponse.json({ id, blocks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
