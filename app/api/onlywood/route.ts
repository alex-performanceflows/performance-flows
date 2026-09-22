import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Proxy verso il motore su Google: tiene l'endpoint fuori dal browser. */
export async function GET() {
  const endpoint = process.env.NEXT_PUBLIC_ONLYWOOD_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ error: "NEXT_PUBLIC_ONLYWOOD_ENDPOINT non configurato" }, { status: 500 });
  }
  try {
    const res = await fetch(endpoint, { cache: "no-store", redirect: "follow", headers: { Accept: "application/json" } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Endpoint sorgente ${res.status}`, detail: text.slice(0, 300) }, { status: 502 });
    }
    const raw = await res.text();
    try {
      return NextResponse.json(JSON.parse(raw));
    } catch {
      return NextResponse.json({ error: "Payload non valido", detail: raw.slice(0, 300) }, { status: 502 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Errore sconosciuto" }, { status: 500 });
  }
}
