"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  listingId: number;
  total: string;
};

export function ResalePurchaseButton({ listingId, total }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleBuy() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/resales/${listingId}/purchase`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
        } else {
          setConfirmed(true);
          setTimeout(() => router.push("/profile"), 1500);
        }
      } catch {
        setError("Сүлжээний алдаа. Дахин оролдоно уу.");
      }
    });
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-500/10 px-6 py-5 text-center">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <p className="font-semibold text-emerald-300">Тасалбар амжилттай авлаа!</p>
        <p className="text-xs text-white/40">Профайл руу шилжүүлж байна...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleBuy}
        disabled={isPending}
        className="w-full rounded-2xl bg-[#ff7224] px-6 py-4 text-center font-goldman text-base font-bold text-white transition hover:bg-[#ff8c42] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
            </svg>
            Боловсруулж байна...
          </span>
        ) : (
          `${total} — Худалдаж авах`
        )}
      </button>
      <p className="text-center text-[0.65rem] text-white/25">
        Баталгаажуулснаар шинэ QR код үүсч, хуучин эзэмшигчийн QR хүчингүй болно
      </p>
    </div>
  );
}
