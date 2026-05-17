import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { getRequestOrigin, isHttpsRequest } from "@/lib/request-origin";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_COOKIE = "tixora_google_oauth_state";

export async function GET(request: NextRequest) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const state = randomBytes(24).toString("base64url");
  const next = request.nextUrl.searchParams.get("next");
  const origin = getRequestOrigin(request);
  const redirectUri = new URL("/api/auth/google/callback", origin).toString();
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: STATE_COOKIE,
    value: Buffer
      .from(JSON.stringify({ state, next: next?.startsWith("/") ? next : null }), "utf8")
      .toString("base64url"),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
    secure: isHttpsRequest(request),
  });

  return response;
}
