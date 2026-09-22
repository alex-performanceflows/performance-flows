import { NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Il web app di Apps Script ogni tanto risponde 404 o 5xx a una richiesta
 * per poi servirla al colpo dopo. Senza ritentativi quel singolo buco
 * diventa un banner di errore in faccia al cliente.
 */
async function leggiPayload(endpoint: string): Promise<{ raw: string } | { errore: string; dettaglio: string; stato: number }> {
  let ultimo = { errore: "Il motore non è raggiungibile", dettaglio: "", stato: 502 };

  for (let tentativo = 0; tentativo < 2; tentativo++) {
    if (tentativo > 0) await attesa(600 * tentativo);
    try {
      const res = await fetch(endpoint, {
        cache: "no-store", redirect: "follow",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(60000),
      });
      const raw = await res.text();
      if (!res.ok) {
        ultimo = { errore: `Il motore non ha risposto (${res.status})`, dettaglio: raw.slice(0, 300), stato: 502 };
        continue;
      }
      // Una risposta vuota o non JSON e' un giro a vuoto come gli altri
      if (!raw.trim().startsWith("{")) {
        ultimo = { errore: "Il motore ha risposto con un dato non leggibile", dettaglio: raw.slice(0, 300), stato: 502 };
        continue;
      }
      return { raw };
    } catch (err) {
      ultimo = {
        errore: err instanceof Error ? err.message : "Errore sconosciuto",
        dettaglio: "", stato: 500,
      };
    }
  }
  return ultimo;
}

/**
 * Ultimo payload arrivato bene. Se il motore fa uno dei suoi giri a vuoto,
 * la dashboard riceve questo invece di un errore: meglio un dato di qualche
 * minuto fa che una schermata rossa.
 */
let ultimoBuono: { raw: string; quando: number } | null = null;

/**
 * Il motore scrive tre volte al giorno: rileggerlo a ogni caricamento non
 * serve e, a richieste ravvicinate, Apps Script comincia a rispondere male.
 * Cinque minuti tengono il dato fresco e l'endpoint tranquillo.
 *
 * Solleva invece di restituire l'errore: cosi' un giro a vuoto non finisce
 * in cache, e il caricamento successivo riprova davvero.
 */
const leggiConCache = unstable_cache(
  async (endpoint: string) => {
    const esito = await leggiPayload(endpoint);
    if ("errore" in esito) {
      throw Object.assign(new Error(esito.errore), { dettaglio: esito.dettaglio, stato: esito.stato });
    }
    ultimoBuono = { raw: esito.raw, quando: Date.now() };
    return esito.raw;
  },
  ["coorie-payload-v1"],
  { revalidate: 300, tags: ["coorie"] },
);

export async function GET(request: Request) {
  const endpoint = process.env.NEXT_PUBLIC_COORIE_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ error: "NEXT_PUBLIC_COORIE_ENDPOINT non configurato" }, { status: 500 });
  }

  // Il pulsante "Aggiorna" salta la cache: serve a chi ha appena rilanciato
  // il motore a mano e vuole vedere subito il giro nuovo.
  const fresh = new URL(request.url).searchParams.get("fresh") === "1";

  let raw: string;
  try {
    if (fresh) {
      const esito = await leggiPayload(endpoint);
      if ("errore" in esito) {
        return NextResponse.json({ error: esito.errore, detail: esito.dettaglio }, { status: esito.stato });
      }
      raw = esito.raw;
      ultimoBuono = { raw, quando: Date.now() };
      // In Next 16 revalidateTag vuole anche la durata: scade subito
      revalidateTag("coorie", { expire: 0 });
    } else {
      raw = await leggiConCache(endpoint);
    }
  } catch (err) {
    const e = err as Error & { dettaglio?: string; stato?: number };
    // Se abbiamo gia' letto qualcosa di buono, quello vale piu' di un errore
    if (ultimoBuono) {
      return NextResponse.json(JSON.parse(ultimoBuono.raw), {
        headers: { "x-pf-fallback": String(Math.round((Date.now() - ultimoBuono.quando) / 1000)) },
      });
    }
    return NextResponse.json(
      { error: e.message || "Errore sconosciuto", detail: e.dettaglio ?? "" },
      { status: e.stato ?? 502 },
    );
  }

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(
      { error: "Payload non valido", detail: raw.slice(0, 300) },
      { status: 502 },
    );
  }
}
