import { NextResponse } from "next/server";

// Proxy server-side verso Google Apps Script per aggirare eventuali CORS.
// Il target è in NEXT_PUBLIC_DATA_ENDPOINT (leggibile anche server-side).
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const endpoint = process.env.NEXT_PUBLIC_DATA_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_DATA_ENDPOINT non configurato" },
      { status: 500 }
    );
  }

  try {
    // Google Apps Script fa redirect (302) verso googleusercontent.com; fetch li segue.
    const res = await fetch(endpoint, {
      cache: "no-store",
      redirect: "follow",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Endpoint sorgente ${res.status}`, detail: text.slice(0, 300) },
        { status: 502 }
      );
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json") && !contentType.includes("text/plain")) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Risposta non JSON", detail: text.slice(0, 300) },
        { status: 502 }
      );
    }
    // GAS spesso serve JSON come text/plain — provo a parsare a mano.
    const raw = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Payload non valido", detail: raw.slice(0, 300) },
        { status: 502 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
