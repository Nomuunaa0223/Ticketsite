import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  return clearSessionCookie(response);
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
