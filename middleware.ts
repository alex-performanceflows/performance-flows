import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "pf_dash_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /dashboard routes (not /dashboard/login or API)
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();
  if (pathname.startsWith("/dashboard/login")) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/dashboard/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session token
  const expected = Buffer.from(
    process.env.DASHBOARD_PASSWORD ?? "changeme"
  ).toString("base64");

  if (session.value !== expected) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/dashboard/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
