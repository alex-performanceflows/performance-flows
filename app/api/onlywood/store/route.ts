import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchStoreData } from "@/lib/onlywood-store";

// Il negozio risponde in 20-40 secondi, quindi ogni intervallo richiesto resta
// in cache un quarto d'ora: abbastanza da non far aspettare chi naviga fra le
// sezioni, poco da non mostrare numeri vecchi.
const load = unstable_cache(
  async (from: string, to: string, prevFrom: string, prevTo: string) =>
    fetchStoreData(from, to, prevFrom || undefined, prevTo || undefined),
  ["onlywood-store-v2"],
  { revalidate: 900, tags: ["onlywood-store"] },
);

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const from = p.get("from") ?? "";
  const to = p.get("to") ?? "";
  const prevFrom = p.get("prevFrom") ?? "";
  const prevTo = p.get("prevTo") ?? "";

  if (!DAY.test(from) || !DAY.test(to)) {
    return NextResponse.json({ error: "Servono le date from e to in formato AAAA-MM-GG" }, { status: 400 });
  }
  const prevOk = DAY.test(prevFrom) && DAY.test(prevTo);

  try {
    return NextResponse.json(await load(from, to, prevOk ? prevFrom : "", prevOk ? prevTo : ""));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
