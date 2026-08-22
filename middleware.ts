import { NextRequest, NextResponse } from "next/server";

async function digest(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login" || path.startsWith("/api/login") || path.startsWith("/_next") || path === "/favicon.ico") return NextResponse.next();

  const user = process.env.VIRAUPP_LOGIN_USER;
  const pass = process.env.VIRAUPP_LOGIN_PASSWORD;
  if (!user || !pass) return NextResponse.redirect(new URL("/login", request.url));

  const expected = await digest(`${user}:${pass}`);
  const session = request.cookies.get("viraupp_session")?.value;
  if (session !== expected) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!.*\\..*).*)"] };
