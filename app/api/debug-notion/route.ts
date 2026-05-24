import { NextResponse } from "next/server";
import { queryDatabaseRest, DB } from "@/lib/notion";

export async function GET() {
  const pages = await queryDatabaseRest(DB.pacchetti, { page_size: 1 });
  if (!pages.length) return NextResponse.json({ error: "no pages" });

  const p = pages[0].properties;

  const details = Object.entries(p).map(([name, val]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = val as any;
    let value: unknown = v.type;
    if (v.type === "number") value = v.number;
    if (v.type === "formula") value = v.formula;
    if (v.type === "rollup") value = v.rollup;
    if (v.type === "relation") value = `relation → ${v.relation?.length} items`;
    if (v.type === "rich_text") value = v.rich_text?.[0]?.plain_text;
    if (v.type === "title") value = v.title?.[0]?.plain_text;
    return { name, type: v.type, value };
  });

  return NextResponse.json(details);
}
