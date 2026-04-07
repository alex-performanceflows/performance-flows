import { NextRequest, NextResponse } from "next/server";
import { queryDatabase, getNumber, getFormulaNumber, getRelation, getText, getSelect, DB } from "@/lib/notion";

const COST_PER_HOUR = 25;

type ClientActivity = { ore: number; nTask: number; nMeeting: number };

function groupTasksByClient(tasks: Awaited<ReturnType<typeof queryDatabase>>): Record<string, ClientActivity> {
  const map: Record<string, ClientActivity> = {};
  for (const task of tasks) {
    const p = task.properties;
    const clientIds = getRelation(p, "CRM Clienti");
    const ore = getNumber(p, "Tempo impiegato (h)");
    for (const cid of clientIds) {
      if (!map[cid]) map[cid] = { ore: 0, nTask: 0, nMeeting: 0 };
      map[cid].ore += ore;
      map[cid].nTask += 1;
    }
  }
  return map;
}

function mergeTouchpointsByClient(
  map: Record<string, ClientActivity>,
  touchpoints: Awaited<ReturnType<typeof queryDatabase>>,
) {
  for (const tp of touchpoints) {
    const p = tp.properties;
    const clientIds = getRelation(p, "CRM Clienti");
    const ore = getNumber(p, "Durata (h)");
    for (const cid of clientIds) {
      if (!map[cid]) map[cid] = { ore: 0, nTask: 0, nMeeting: 0 };
      map[cid].ore += ore;
      map[cid].nMeeting += 1;
    }
  }
}

export async function GET(req: NextRequest) {
  if (!process.env.NOTION_TOKEN) {
    return NextResponse.json({ error: "NOTION_TOKEN not configured" }, { status: 500 });
  }

  const month = req.nextUrl.searchParams.get("month"); // YYYY-MM
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Parametro month mancante o invalido (formato: YYYY-MM)" }, { status: 400 });
  }

  const [year, mon] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end = new Date(year, mon, 1).toISOString().slice(0, 10);

  try {
    // Fetch all active contracts
    const contratti = await queryDatabase(DB.contratti, {
      filter: { property: "Stato", select: { equals: "Attivo" } },
    });

    // Fetch CRM clients for name lookup
    const crmPages = await queryDatabase(DB.crm);
    const clientMap: Record<string, string> = {};
    for (const p of crmPages) {
      const name = p.properties["Name"];
      clientMap[p.id] = name?.type === "title" ? name.title.map((t) => t.plain_text).join("") : p.id;
    }

    // Split contracts by type
    const ricorrenti = contratti.filter((c) => getSelect(c.properties, "Tipo") === "Ricorrente");
    const nonRicorrenti = contratti.filter((c) => getSelect(c.properties, "Tipo") !== "Ricorrente");

    // ── Fetch monthly data (task + touchpoints) ───────────────────────
    const [monthlyTasks, monthlyTouchpoints] = await Promise.all([
      queryDatabase(DB.task, {
        filter: {
          and: [
            { property: "Stato", status: { equals: "Fatto" } },
            { property: "Scadenza", date: { on_or_after: start } },
            { property: "Scadenza", date: { before: end } },
          ],
        },
      }),
      queryDatabase(DB.touchpoints, {
        filter: {
          and: [
            { property: "Data", date: { on_or_after: start } },
            { property: "Data", date: { before: end } },
          ],
        },
      }),
    ]);

    const monthlyByClient = groupTasksByClient(monthlyTasks);
    mergeTouchpointsByClient(monthlyByClient, monthlyTouchpoints);

    // ── Fetch all-time data for non-recurring contracts ────────────────
    let allByClient: Record<string, ClientActivity> = {};
    if (nonRicorrenti.length > 0) {
      const [allTasks, allTouchpoints] = await Promise.all([
        queryDatabase(DB.task, { filter: { property: "Stato", status: { equals: "Fatto" } } }),
        queryDatabase(DB.touchpoints),
      ]);
      allByClient = groupTasksByClient(allTasks);
      mergeTouchpointsByClient(allByClient, allTouchpoints);
    }

    // ── Build recurring contracts result (monthly) ────────────────────
    const ricorrentiResult = ricorrenti.map((c) => {
      const p = c.properties;
      const clientIds = getRelation(p, "CRM Clienti");
      const mrrNetto = getFormulaNumber(p, "Valore MRR Netto");
      const nome = getText(p, "Descrizione");
      const clienteNome = clientIds.map((id) => clientMap[id] ?? id).join(", ");
      let ore = 0, nTask = 0, nMeeting = 0;
      for (const cid of clientIds) {
        ore      += monthlyByClient[cid]?.ore      ?? 0;
        nTask    += monthlyByClient[cid]?.nTask    ?? 0;
        nMeeting += monthlyByClient[cid]?.nMeeting ?? 0;
      }
      const costoOre = ore * COST_PER_HOUR;
      const margine = mrrNetto - costoOre;
      const marginePercent = mrrNetto > 0 ? (margine / mrrNetto) * 100 : null;
      return { contractId: c.id, nome, clienteNome, ore, costoOre, mrrNetto, margine, marginePercent, nTask, nMeeting };
    }).sort((a, b) => (b.mrrNetto || 0) - (a.mrrNetto || 0));

    // ── Build non-recurring contracts result (total lifetime) ─────────
    const nonRicorrentiResult = nonRicorrenti.map((c) => {
      const p = c.properties;
      const clientIds = getRelation(p, "CRM Clienti");
      const valore = getNumber(p, "Valore");
      const nome = getText(p, "Descrizione");
      const clienteNome = clientIds.map((id) => clientMap[id] ?? id).join(", ");
      let ore = 0, nTask = 0, nMeeting = 0;
      for (const cid of clientIds) {
        ore      += allByClient[cid]?.ore      ?? 0;
        nTask    += allByClient[cid]?.nTask    ?? 0;
        nMeeting += allByClient[cid]?.nMeeting ?? 0;
      }
      const costoOre = ore * COST_PER_HOUR;
      const margine = valore - costoOre;
      const marginePercent = valore > 0 ? (margine / valore) * 100 : null;
      return { contractId: c.id, nome, clienteNome, ore, costoOre, valore, margine, marginePercent, nTask, nMeeting };
    }).sort((a, b) => (b.valore || 0) - (a.valore || 0));

    return NextResponse.json({
      month,
      tasksMensili: monthlyTasks.length,
      meetingMensili: monthlyTouchpoints.length,
      ricorrenti: ricorrentiResult,
      nonRicorrenti: nonRicorrentiResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[marginalita]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
