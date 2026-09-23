import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "不正な送信元です" }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
