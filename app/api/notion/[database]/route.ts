import { NextRequest, NextResponse } from "next/server";
import {
  DB,
  queryDatabase,
  buildClientRow,
  buildContrattoRow,
  buildTaskRow,
  buildFatturaRow,
  buildPipelineRow,
  buildTouchpointRow,
  type DatabaseKey,
} from "@/lib/notion";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ database: string }> }
) {
  const { database } = await params;
  const key = database as DatabaseKey;

  if (!DB[key]) {
    return NextResponse.json({ error: "Unknown database" }, { status: 404 });
  }

  if (!process.env.NOTION_TOKEN) {
    return NextResponse.json({ error: "NOTION_TOKEN not configured" }, { status: 500 });
  }

  try {
    const dbId = DB[key];

    switch (key) {
      case "crm": {
        const pages = await queryDatabase(dbId);
        return NextResponse.json(pages.map(buildClientRow));
      }

      case "contratti": {
        const pages = await queryDatabase(dbId, {
          filter: { property: "Stato", select: { equals: "Attivo" } },
        });
        return NextResponse.json(pages.map(buildContrattoRow));
      }

      case "task": {
        // "Stato" è di tipo status (non select) — filtro escludi "Fatto"
        const pages = await queryDatabase(dbId, {
          filter: { property: "Stato", status: { does_not_equal: "Fatto" } },
        });
        return NextResponse.json(pages.map(buildTaskRow));
      }

      case "fatturazioni": {
        const pages = await queryDatabase(dbId, {
          filter: { property: "Emessa?", checkbox: { equals: false } },
          sorts: [{ property: "Data Emissione", direction: "ascending" }],
        });
        return NextResponse.json(pages.map(buildFatturaRow));
      }

      case "pipeline": {
        // Pipeline non ha "Chiusa" — prendo tutto ordinato per Fase
        const pages = await queryDatabase(dbId, {
          sorts: [{ property: "Fase", direction: "ascending" }],
        });
        return NextResponse.json(pages.map(buildPipelineRow));
      }

      case "touchpoints": {
        const pages = await queryDatabase(dbId, {
          sorts: [{ property: "Data", direction: "descending" }],
          page_size: 20,
        });
        return NextResponse.json(pages.map(buildTouchpointRow));
      }

      case "contatti": {
        const pages = await queryDatabase(dbId);
        return NextResponse.json(
          pages.map((p) => ({
            id: p.id,
            nome:
              p.properties["Name"]?.type === "title"
                ? p.properties["Name"].title.map((t) => t.plain_text).join("")
                : "",
          }))
        );
      }

      default:
        return NextResponse.json({ error: "Not implemented" }, { status: 501 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[notion/${key}]`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
