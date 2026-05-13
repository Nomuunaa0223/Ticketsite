import { NextResponse, type NextRequest } from "next/server";
import { applySessionCookie, createSessionForUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const STATE_COOKIE = "tixora_google_oauth_state";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleState = {
  state: string;
  next: string | null;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    loginUrl.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const storedState = parseState(request.cookies.get(STATE_COOKIE)?.value);

  if (!code || !returnedState || !storedState || storedState.state !== returnedState) {
    loginUrl.searchParams.set("error", "google_state");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", env.NEXT_PUBLIC_APP_URL).toString();
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new Error(tokenPayload.error ?? "Google token exchange failed.");
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    });
    const profile = (await profileResponse.json()) as GoogleUserInfo;

    if (!profileResponse.ok || !profile.email || profile.email_verified === false) {
      throw new Error("Google email is not verified.");
    }

    const email = profile.email.toLowerCase();
    const fullName = profile.name || profile.given_name || email.split("@")[0] || "Google User";
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        emailVerifiedAt: new Date(),
      },
      create: {
        email,
        fullName,
        passwordHash: null,
        role: "USER",
        emailVerifiedAt: new Date(),
      },
      include: { organizerProfile: true },
    });

    const sessionToken = await createSessionForUser(user);
    const destination = getDestination(user.role, storedState.next);
    const response = applySessionCookie(NextResponse.redirect(new URL(destination, request.url)), sessionToken);
    response.cookies.set({
      name: STATE_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error(error);
    loginUrl.searchParams.set("error", "google");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set({
      name: STATE_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
    });
    return response;
  }
}

function parseState(value: string | undefined): GoogleState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleState;
    return typeof parsed.state === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function getDestination(role: string, next: string | null) {
  if (next?.startsWith("/")) return next;
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "ORGANIZER") return "/organizer/dashboard";
  return "/";
}
