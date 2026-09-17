import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CRM_CLIENT_IDS, fetchClientMeetings } from "@/lib/client-roadmap";

// Solo meeting con il cliente: quelli segnati "Interna?" restano fuori. Riletti al massimo ogni 10 minuti.
const getMeetings = unstable_cache(
  async () => ({
    meetings: await fetchClientMeetings(CRM_CLIENT_IDS.gondolina),
    aggiornato: new Date().toISOString(),
  }),
  ["gondolina-meetings-v1"],
  { revalidate: 600, tags: ["gondolina-roadmap"] },
);

export async function GET() {
  try {
    return NextResponse.json(await getMeetings());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
