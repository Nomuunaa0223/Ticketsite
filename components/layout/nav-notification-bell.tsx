"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/layout/lang-context";

export function NavNotificationBell() {
  const { t } = useLang();
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => { });
  }, []);

  function handleClick() {
    if (unread > 0) {
      fetch("/api/notifications/read", { method: "POST" }).catch(() => { });
      setUnread(0);
    }
    router.push("/notifications");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("headerNotifications")}
      className="relative flex h-8 w-8 items-center justify-center text-white/70 transition hover:text-white focus-visible:outline-none sm:h-9 sm:w-9"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M9 17a3 3 0 0 0 6 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff7224]" />
      )}
    </button>
  );
}
