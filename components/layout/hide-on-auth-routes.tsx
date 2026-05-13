"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const AUTH_ROUTES = ["/login", "/register", "/setup-password"];

export function HideOnAuthRoutes({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute) return null;

  return <>{children}</>;
}
