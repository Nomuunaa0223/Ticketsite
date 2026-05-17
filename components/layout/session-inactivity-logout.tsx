"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_TIMEOUT_MS: Record<string, number> = {
  ADMIN: 15 * 60 * 1000,
  ORGANIZER: 15 * 60 * 1000,
  USER: 15 * 60 * 1000,
};

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

type Props = {
  role: string;
};

export function SessionInactivityLogout({ role }: Props) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timeout = INACTIVITY_TIMEOUT_MS[role] ?? DEFAULT_TIMEOUT_MS;

    function resetTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }, timeout);
    }

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [role, router]);

  return null;
}
