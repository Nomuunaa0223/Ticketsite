"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminEventDeleteButton({ eventId }: { eventId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard/admin/events");
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
        </svg>
        Устгах
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-red-500/10 px-4 py-2.5">
      <p className="text-sm font-semibold text-red-300">Устгахдаа итгэлтэй байна уу?</p>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
      >
        {busy ? "Устгаж байна..." : "Тийм, устга"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-semibold text-white/40 transition hover:text-white"
      >
        Болих
      </button>
    </div>
  );
}
