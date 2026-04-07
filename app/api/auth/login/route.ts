import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "pf_dash_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const expected = process.env.DASHBOARD_PASSWORD ?? "changeme";
  if (!password || password !== expected) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  const token = Buffer.from(expected).toString("base64");

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
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
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
