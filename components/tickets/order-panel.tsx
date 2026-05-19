"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { SeatMap, type SeatData } from "@/components/tickets/seat-map";
import { PaymentModal } from "@/components/tickets/payment-modal";

type TicketType = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  maxPerOrder: number;
  hasSeatMap?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

type Props = {
  eventId: number;
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

function formatDayDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("mn-MN", { month: "short", day: "numeric", weekday: "short" });
}

function formatDayTime(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(s)} – ${fmt(e)}`;
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

function getSeatSessionId() {
  if (typeof window === "undefined") return "";

  const key = "tixora-seat-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const created =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `seat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, created);
  return created;
}

export function OrderPanel({ eventId, currency, salesEndsAt, ticketTypes, className }: Props) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, number[]>>({});
  const [seatData, setSeatData] = useState<Record<number, SeatData[]>>({});
  const [seatLoading, setSeatLoading] = useState<Record<number, boolean>>({});
  const [expandedSeatMap, setExpandedSeatMap] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [seatSessionId, setSeatSessionId] = useState("");

  const saleEnd = new Date(salesEndsAt);
  const { days, hours, minutes, seconds, ended: isSaleEnded, ready } = useCountdown(saleEnd);
  const hasTickets = ticketTypes.length > 0;

  // Multi-day: all ticket types have startsAt set
  const isMultiDay = ticketTypes.length > 0 && ticketTypes.every((tt) => tt.startsAt);

  // Set first available day on mount for multi-day events
  useEffect(() => {
    if (isMultiDay && selectedDay === null) {
      const first = ticketTypes.find((tt) => (tt.quantityTotal - tt.quantitySold) > 0);
      if (first) setSelectedDay(first.id);
    }
  }, [isMultiDay, ticketTypes, selectedDay]);

  useEffect(() => {
    setSeatSessionId(getSeatSessionId());
  }, []);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socket: Socket = io(socketUrl || undefined, { path: "/socket.io", transports: ["websocket", "polling"] });
    socket.emit("join-event", eventId);
    socket.on("seat-updated", (payload: { ticketTypeId: number; seatId: number; status: SeatData["status"] }) => {
      setSeatData((prev) => {
        const seats = prev[payload.ticketTypeId];
        if (!seats) return prev;
        return {
          ...prev,
          [payload.ticketTypeId]: seats.map((seat) =>
            seat.id === payload.seatId ? { ...seat, status: payload.status } : seat
          )
        };
      });

      if (payload.status !== "RESERVED") {
        setSelectedSeats((prev) => ({
          ...prev,
          [payload.ticketTypeId]: (prev[payload.ticketTypeId] ?? []).filter((seatId) => seatId !== payload.seatId)
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId]);

  function setQty(id: number, value: number) {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  }

  async function toggleSeat(ticketTypeId: number, seatId: number) {
    const current = selectedSeats[ticketTypeId] ?? [];
    const isSelected = current.includes(seatId);

    setError(null);
    if (!seatSessionId) {
      setError("Seat session is still loading. Try again.");
      return;
    }

    const res = await fetch("/api/seats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: isSelected ? "unlock" : "lock",
        seatId,
        sessionId: seatSessionId
      })
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Seat update failed.");
      return;
    }

    setSelectedSeats((prev) => {
      const latest = prev[ticketTypeId] ?? [];
      if (isSelected) {
        return { ...prev, [ticketTypeId]: latest.filter((s) => s !== seatId) };
      }
      return { ...prev, [ticketTypeId]: [...latest, seatId] };
    });

    setSeatData((prev) => ({
      ...prev,
      [ticketTypeId]: (prev[ticketTypeId] ?? []).map((seat) =>
        seat.id === seatId ? { ...seat, status: isSelected ? "AVAILABLE" : "RESERVED" } : seat
      )
    }));
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

  const activeTicketTypes = isMultiDay
    ? ticketTypes.filter((tt) => tt.id === selectedDay)
    : ticketTypes;

  const orderItems = activeTicketTypes
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
    setError(null);
    if (orderItems.length === 0) {
      setError("Тасалбар сонгоно уу.");
      return;
    }
    setPaymentOpen(true);
  }

  async function submitOrder(): Promise<number> {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: orderItems, seatSessionId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; order?: { id: number } };
    if (!res.ok) {
      throw new Error(data.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
    }
    setQuantities({});
    setSelectedSeats({});
    return data.order!.id;
  }

  function handlePaymentSuccess(orderId: number) {
    setPaymentOpen(false);
    router.push(`/orders/${orderId}` as never);
  }

  return (
    <div className={`rounded-2xl bg-[#0d1017] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-6 ${className ?? ""}`}>

      {/* Тоолуур */}
      {!isSaleEnded && (
        <div className="mb-4 rounded-xl bg-white/[0.04] px-4 py-3 sm:mb-6 sm:px-5 sm:py-4">
          <p className="text-xs text-white/40 sm:text-sm">Тасалбар зарагдаж дуусахад:</p>
          <p className="mt-1 text-base font-bold text-white sm:mt-1.5 sm:text-lg" suppressHydrationWarning>
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

          {/* Multi-day: өдөр сонгогч */}
          {isMultiDay && (
            <div className="space-y-2">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/40">
                Өдөр сонгох
              </p>
              <div className="grid gap-2">
                {ticketTypes.map((tt) => {
                  const remaining = tt.quantityTotal - tt.quantitySold;
                  const isSoldOut = remaining <= 0;
                  const isSelected = selectedDay === tt.id;

                  return (
                    <button
                      key={tt.id}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        setSelectedDay(tt.id);
                        setQuantities({});
                        setSelectedSeats({});
                        setExpandedSeatMap(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                        isSoldOut
                          ? "cursor-not-allowed opacity-40 bg-white/[0.02]"
                          : isSelected
                            ? "bg-[#ff7224]/15 ring-1 ring-[#ff7224]/50"
                            : "bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? "text-[#ff8b46]" : "text-white"}`}>
                          {tt.startsAt ? formatDayDate(tt.startsAt) : tt.name}
                        </p>
                        {tt.startsAt && tt.endsAt && (
                          <p className="mt-0.5 text-xs text-white/40">
                            {formatDayTime(tt.startsAt, tt.endsAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {isSoldOut && (
                          <span className="text-xs text-white/30">Дууссан</span>
                        )}
                        <div className={`h-4 w-4 rounded-full border-2 transition ${
                          isSelected ? "border-[#ff7224] bg-[#ff7224]" : "border-white/20"
                        }`}>
                          {isSelected && (
                            <svg viewBox="0 0 24 24" className="h-full w-full p-0.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ticket type cards */}
          {activeTicketTypes.map((tt) => {
            const remaining = tt.quantityTotal - tt.quantitySold;
            const isSoldOut = remaining <= 0;
            const qty = quantities[tt.id] ?? 0;
            const maxQty = Math.min(tt.maxPerOrder, remaining);
            const seats = selectedSeats[tt.id] ?? [];
            const isExpanded = expandedSeatMap === tt.id;

            return (
              <div key={tt.id} className={`rounded-xl p-3 transition-colors sm:p-5 ${isSoldOut ? "opacity-40" : "bg-white/[0.03]"}`}>
                {!isMultiDay && (
                  <p className="text-sm font-semibold text-white sm:text-base">{tt.name}</p>
                )}
                {isMultiDay && tt.startsAt && (
                  <p className="text-sm font-semibold text-white">
                    {formatDayDate(tt.startsAt)}
                    {tt.endsAt && (
                      <span className="ml-2 text-xs font-normal text-white/40">
                        {formatDayTime(tt.startsAt, tt.endsAt)}
                      </span>
                    )}
                  </p>
                )}
                {tt.description && <p className="mt-1 text-xs text-white/40">{tt.description}</p>}

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-bold text-white sm:text-lg">{formatPrice(tt.price, currency)}</p>

                  {isSoldOut ? (
                    <p className="text-sm text-white/30">Дууссан</p>
                  ) : tt.hasSeatMap ? (
                    <button
                      type="button"
                      onClick={() => handleToggleSeatMap(tt.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.12] sm:w-auto"
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
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                      <button type="button" onClick={() => setQty(tt.id, Math.max(0, qty - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white/[0.14] sm:h-10 sm:w-10">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" strokeLinecap="round" /></svg>
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-white sm:w-6 sm:text-base">{qty}</span>
                      <button type="button" onClick={() => setQty(tt.id, Math.min(maxQty, qty + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:bg-white/[0.14] sm:h-10 sm:w-10">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {tt.hasSeatMap && isExpanded && (
                  <div className="mt-4 overflow-hidden rounded-xl bg-white/[0.02] p-2 sm:p-4">
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

          {/* Нийт дүн */}
          {orderItems.length > 0 && (() => {
            const totalQty = orderItems.reduce((s, item) => s + item.quantity, 0);
            const totalAmount = orderItems.reduce((s, item) => {
              const tt = ticketTypes.find((t) => t.id === item.ticketTypeId);
              return s + (tt ? tt.price * item.quantity : 0);
            }, 0);
            return (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.05] px-4 py-3">
                <div>
                  <p className="text-[0.65rem] text-white/40">Нийт дүн</p>
                  <p className="text-xl font-bold text-white">{formatPrice(totalAmount, currency)}</p>
                </div>
                <p className="text-xs text-white/35">{totalQty} тасалбар</p>
              </div>
            );
          })()}

          <button type="submit" disabled={orderItems.length === 0}
            className="w-full rounded-full bg-[#ff7224] py-4 text-base font-bold text-white transition hover:bg-[#e5641a] disabled:opacity-50">
            Худалдан авах
          </button>

          {error && (
            <div className="text-sm text-right text-red-400">{error}</div>
          )}
        </form>
      )}

      {paymentOpen && (() => {
        const totalQty = orderItems.reduce((s, item) => s + item.quantity, 0);
        const totalAmount = orderItems.reduce((s, item) => {
          const tt = ticketTypes.find((t) => t.id === item.ticketTypeId);
          return s + (tt ? tt.price * item.quantity : 0);
        }, 0);
        return (
          <PaymentModal
            totalPrice={formatPrice(totalAmount, currency)}
            totalQty={totalQty}
            onClose={() => setPaymentOpen(false)}
            onConfirm={submitOrder}
            onSuccess={handlePaymentSuccess}
          />
        );
      })()}
    </div>
  );
}
