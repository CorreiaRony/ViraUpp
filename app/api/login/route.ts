import { NextResponse } from "next/server";

async function digest(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const expectedUser = process.env.VIRAUPP_LOGIN_USER;
  const expectedPass = process.env.VIRAUPP_LOGIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: "Login ainda não configurado no servidor." }, { status: 500 });
  }

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  const token = await digest(`${expectedUser}:${expectedPass}`);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("viraupp_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
