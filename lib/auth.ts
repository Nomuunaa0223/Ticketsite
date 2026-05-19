import bcrypt from "bcryptjs";
import { Role, UserStatus, type User } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "tixora_session";
const SESSION_TOKEN_TTL = "7d";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();
const useSecureSessionCookie = env.NEXT_PUBLIC_APP_URL.startsWith("https://");

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  fullName: string;
  organizerProfileId?: number | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signSession(user: SessionPayload) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_TOKEN_TTL)
    .sign(encoder.encode(env.JWT_SECRET));
}

export async function verifySessionToken(token: string) {
  const result = await jwtVerify(token, encoder.encode(env.JWT_SECRET));
  return result.payload as unknown as SessionPayload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: Request | NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      include: { organizerProfile: true }
    });
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user || user.status !== UserStatus.ACTIVE) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(minimumRole: Role) {
  const user = await requireUser();
  const allowedOrder: Role[] = ["USER", "ORGANIZER", "ADMIN"];

  if (allowedOrder.indexOf(user.role) < allowedOrder.indexOf(minimumRole)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireExactRole(role: Role) {
  const user = await requireUser();

  if (user.role !== role) {
    redirect("/dashboard");
  }

  return user;
}

export async function createSessionForUser(
  user: User & { organizerProfile?: { id: number } | null }
) {
  const payload: SessionPayload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    organizerProfileId: user.organizerProfile?.id ?? null
  };

  return signSession(payload);
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: useSecureSessionCookie,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: useSecureSessionCookie,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });

  return response;
}
