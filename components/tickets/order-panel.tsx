"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TicketType = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  maxPerOrder: number;
};

type Props = {
  currency: string;
  salesEndsAt: string;
  ticketTypes: TicketType[];
  className?: string;
};

function formatPrice(amount: number, currency: string): string {
  if (currency === "MNT") {
    return `${new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(amount)}₮`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function useCountdown(target: Date) {
  const targetTime = target.getTime();
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    setDiff(Math.max(0, targetTime - Date.now()));
    const id = setInterval(() => {
      setDiff(Math.max(0, targetTime - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  if (diff === null) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: false, ready: false };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, ended: diff === 0, ready: true };
}

export function OrderPanel({ currency, salesEndsAt, ticketTypes, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const saleEnd = new Date(salesEndsAt);
  const { days, hours, minutes, seconds, ended: isSaleEnded, ready } = useCountdown(saleEnd);
  const hasTickets = ticketTypes.length > 0;

  function setQty(id: number, value: number) {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  }

  const orderItems = ticketTypes
    .map((tt) => ({ ticketTypeId: tt.id, quantity: quantities[tt.id] ?? 0 }))
    .filter((item) => item.quantity > 0);

  function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (orderItems.length === 0) {
      setFeedback({ message: "Тасалбар сонгоно уу.", type: "error" });
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: orderItems }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFeedback({ message: data.error ?? "Алдаа гарлаа. Дахин оролдоно уу.", type: "error" });
        } else {
          setFeedback({ message: "Амжилттай төлөгдлөө", type: "success" });
          setQuantities({});
          router.refresh();
          setTimeout(() => setFeedback(null), 3000);
        }
      } catch {
        setFeedback({ message: "Сүлжээний алдаа. Дахин оролдоно уу.", type: "error" });
      }
    });
  }

  return (
    <div className={`rounded-2xl bg-[#0d1017] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-7 ${className ?? ""}`}>

      {/* Countdown */}
      {!isSaleEnded && (
        <div className="mb-6 rounded-xl bg-white/[0.04] px-5 py-4">
          <p className="text-sm text-white/40">Тасалбар зарагдаж дуусахад:</p>
          <p className="mt-1.5 text-lg font-bold text-white" suppressHydrationWarning>
            {ready ? (
              <>
                {days > 0 && <span>{days} өдөр </span>}
                {hours > 0 && <span>{hours} цаг </span>}
                <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
              </>
            ) : null}
          </p>
        </div>
      )}

      {isSaleEnded ? (
        <div className="rounded-xl bg-white/[0.04] px-4 py-5 text-center">
          <p className="text-sm font-semibold text-white/60">Тасалбар зарагдаж дууслаа</p>
        </div>
      ) : !hasTickets ? (
        <div className="rounded-xl bg-white/[0.04] px-4 py-5 text-center">
          <p className="text-sm text-white/40">Тасалбар байхгүй байна</p>
        </div>
      ) : (
        <form onSubmit={handleOrder} className="space-y-4">
          {ticketTypes.map((tt) => {
            const remaining = tt.quantityTotal - tt.quantitySold;
            const isSoldOut = remaining <= 0;
            const qty = quantities[tt.id] ?? 0;
            const maxQty = Math.min(tt.maxPerOrder, remaining);

            return (
              <div key={tt.id} className={`rounded-xl p-4 transition-colors sm:p-5 ${isSoldOut ? "opacity-40" : "bg-white/[0.03]"}`}>
                <p className="text-base font-semibold text-white">{tt.name}</p>
                {tt.description && <p className="mt-1 text-xs text-white/40">{tt.description}</p>}

                <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="break-words text-lg font-bold text-white">{formatPrice(tt.price, currency)}</p>

                  {isSoldOut ? (
                    <p className="text-sm text-white/30">Дууссан</p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={() => setQty(tt.id, Math.max(0, qty - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white/[0.14]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" strokeLinecap="round" /></svg>
                      </button>
                      <span className="w-6 text-center text-base font-bold text-white">{qty}</span>
                      <button type="button" onClick={() => setQty(tt.id, Math.min(maxQty, qty + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white/[0.14]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button type="submit" disabled={isPending || orderItems.length === 0}
            className="mt-2 w-full rounded-full bg-[#ff7224] py-4 text-base font-bold text-white transition hover:bg-[#e5641a] disabled:opacity-50">
            {isPending ? "Боловсруулж байна..." : "Худалдан авах"}
          </button>

          {feedback && (
            <div className={`text-sm text-right ${feedback.type === "error" ? "text-red-400" : "text-white"}`}>
              {feedback.message}
              {feedback.type === "success" && (
                <Link href="/profile" className="mt-1 block text-xs font-semibold text-white/60 hover:text-white">
                  Profile →
                </Link>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
