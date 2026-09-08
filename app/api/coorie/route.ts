import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const endpoint = process.env.NEXT_PUBLIC_COORIE_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ error: "NEXT_PUBLIC_COORIE_ENDPOINT non configurato" }, { status: 500 });
  }
  try {
    const res = await fetch(endpoint, {
      cache: "no-store", redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Endpoint sorgente ${res.status}`, detail: text.slice(0, 300) }, { status: 502 });
    }
    const raw = await res.text();
    let data: unknown;
    try { data = JSON.parse(raw); } catch {
      return NextResponse.json({ error: "Payload non valido", detail: raw.slice(0, 300) }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
