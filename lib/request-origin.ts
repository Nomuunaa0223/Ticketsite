import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export function getRequestOrigin(request: Request | NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");

  if (!host) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || (env.NEXT_PUBLIC_APP_URL.startsWith("https://") ? "https" : "http");

  return `${proto}://${host}`;
}

export function isHttpsRequest(request: Request | NextRequest) {
  return getRequestOrigin(request).startsWith("https://");
}
