"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SeatMap, type SeatData } from "@/components/tickets/seat-map";

type TicketType = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  maxPerOrder: number;
  hasSeatMap?: boolean;
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
    const id = setInterval(() => setDiff(Math.max(0, targetTime - Date.now())), 1000);
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
  const [selectedSeats, setSelectedSeats] = useState<Record<number, number[]>>({});
  const [seatData, setSeatData] = useState<Record<number, SeatData[]>>({});
  const [seatLoading, setSeatLoading] = useState<Record<number, boolean>>({});
  const [expandedSeatMap, setExpandedSeatMap] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const saleEnd = new Date(salesEndsAt);
  const { days, hours, minutes, seconds, ended: isSaleEnded, ready } = useCountdown(saleEnd);
  const hasTickets = ticketTypes.length > 0;

  function setQty(id: number, value: number) {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  }

  function toggleSeat(ticketTypeId: number, seatId: number) {
    setSelectedSeats((prev) => {
      const current = prev[ticketTypeId] ?? [];
      if (current.includes(seatId)) {
        return { ...prev, [ticketTypeId]: current.filter((s) => s !== seatId) };
      }
      return { ...prev, [ticketTypeId]: [...current, seatId] };
    });
  }

  async function fetchSeats(ticketTypeId: number) {
    if (seatData[ticketTypeId]) return;
    setSeatLoading((prev) => ({ ...prev, [ticketTypeId]: true }));
    try {
      const res = await fetch(`/api/seats?ticketTypeId=${ticketTypeId}`);
      const data = (await res.json()) as { seats: SeatData[] };
      setSeatData((prev) => ({ ...prev, [ticketTypeId]: data.seats ?? [] }));
    } finally {
      setSeatLoading((prev) => ({ ...prev, [ticketTypeId]: false }));
    }
  }

  function handleToggleSeatMap(ticketTypeId: number) {
    if (expandedSeatMap === ticketTypeId) {
      setExpandedSeatMap(null);
    } else {
      setExpandedSeatMap(ticketTypeId);
      void fetchSeats(ticketTypeId);
    }
  }

  const orderItems = ticketTypes
    .map((tt) => {
      if (tt.hasSeatMap) {
        const seats = selectedSeats[tt.id] ?? [];
        return { ticketTypeId: tt.id, seatIds: seats, quantity: seats.length };
      }
      return { ticketTypeId: tt.id, quantity: quantities[tt.id] ?? 0, seatIds: undefined };
    })
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
          setFeedback({ message: "Тасалбар амжилттай авлаа! Шилжүүлж байна...", type: "success" });
          setQuantities({});
          setSelectedSeats({});
          setTimeout(() => router.push("/profile"), 1200);
        }
      } catch {
        setFeedback({ message: "Сүлжээний алдаа. Дахин оролдоно уу.", type: "error" });
      }
    });
  }

  return (
    <div className={`rounded-2xl bg-[#0d1017] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-7 ${className ?? ""}`}>

      {/* Тоолуур */}
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 6v12" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="font-goldman text-sm font-bold uppercase tracking-[0.12em] text-white/50">Sold Out</p>
            <p className="mt-1 text-xs text-white/25">Тасалбар зарагдаж дууслаа</p>
          </div>
          <a href="/resale" className="mt-1 rounded-xl border border-[#ff7224]/30 px-5 py-2.5 text-xs font-bold text-[#ff7224] transition hover:bg-[#ff7224]/10">
            Resale тасалбар харах →
          </a>
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
            const seats = selectedSeats[tt.id] ?? [];
            const isExpanded = expandedSeatMap === tt.id;

            return (
              <div key={tt.id} className={`rounded-xl p-4 transition-colors sm:p-5 ${isSoldOut ? "opacity-40" : "bg-white/[0.03]"}`}>
                <p className="text-base font-semibold text-white">{tt.name}</p>
                {tt.description && <p className="mt-1 text-xs text-white/40">{tt.description}</p>}

                <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="break-words text-lg font-bold text-white">{formatPrice(tt.price, currency)}</p>

                  {isSoldOut ? (
                    <p className="text-sm text-white/30">Дууссан</p>
                  ) : tt.hasSeatMap ? (
                    <button
                      type="button"
                      onClick={() => handleToggleSeatMap(tt.id)}
                      className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.12]"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                      {isExpanded ? "Хаах" : seats.length > 0 ? `${seats.length} суудал сонгосон` : "Суудал сонгох"}
                    </button>
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

                {/* Суудлын зураглал */}
                {tt.hasSeatMap && isExpanded && (
                  <div className="mt-4 rounded-xl bg-white/[0.02] p-4">
                    {seatLoading[tt.id] ? (
                      <div className="flex items-center justify-center py-8 text-xs text-white/30">
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                        </svg>
                        Суудлын мэдээлэл ачааллаж байна...
                      </div>
                    ) : (
                      <SeatMap
                        seats={seatData[tt.id] ?? []}
                        selected={seats}
                        onToggle={(seatId) => toggleSeat(tt.id, seatId)}
                        maxSelect={tt.maxPerOrder}
                      />
                    )}
                  </div>
                )}
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
