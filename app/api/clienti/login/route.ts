import { NextRequest, NextResponse } from "next/server";
import { queryDatabaseRest, getText, DB } from "@/lib/notion";

const COOKIE = "pf_portal_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const { slug, password } = await req.json();

  if (!slug || !password) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const pages = await queryDatabaseRest(DB.portaleClienti, {
    filter: { property: "Slug URL", rich_text: { equals: slug } },
  });

  if (pages.length === 0) {
    return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
  }

  const clientPassword = getText(pages[0].properties, "Password");
  if (!clientPassword || password !== clientPassword) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  const token = Buffer.from(`${slug}:${clientPassword}`).toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
