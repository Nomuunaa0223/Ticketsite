"use client";

import { useEffect } from "react";

type Props = {
  unreadCount: number;
};

export function NotificationsAutoRead({ unreadCount }: Props) {
  useEffect(() => {
    if (unreadCount === 0) return;

    const timer = setTimeout(() => {
      fetch("/api/notifications/mark-read", { method: "POST" })
        .then(() => { window.location.reload(); })
        .catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [unreadCount]);

  return null;
}
