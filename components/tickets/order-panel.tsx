"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
    return `${new Intl.NumberFormat("mn-MN", {
      maximumFractionDigits: 0,
    }).format(amount)}₮`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrderPanel({
  currency,
  salesEndsAt,
  ticketTypes,
  className,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const saleEnd = new Date(salesEndsAt);
  const isSaleEnded = saleEnd < new Date();
  const hasTickets = ticketTypes.length > 0;

  function setQty(ticketTypeId: number, value: number) {
    setQuantities((prev) => ({ ...prev, [ticketTypeId]: value }));
  }

  const orderItems = ticketTypes
    .map((tt) => ({
      ticketTypeId: tt.id,
      quantity: quantities[tt.id] ?? 0,
    }))
    .filter((item) => item.quantity > 0);

  const total = orderItems.reduce((sum, item) => {
    const tt = ticketTypes.find((t) => t.id === item.ticketTypeId);
    return sum + (tt?.price ?? 0) * item.quantity;
  }, 0);

  function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (orderItems.length === 0) {
      setFeedback({ message: "Select at least one ticket.", type: "error" });
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
          setFeedback({
            message: data.error ?? "Order failed. Please try again.",
            type: "error",
          });
        } else {
          setFeedback({
            message: "Order placed successfully! Check your profile for tickets.",
            type: "success",
          });
          setQuantities({});
          router.refresh();
        }
      } catch {
        setFeedback({
          message: "Network error. Please try again.",
          type: "error",
        });
      }
    });
  }

  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-[#0d1017] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] ${className ?? ""}`}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
        Tickets
      </p>

      {isSaleEnded ? (
        <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-5 text-center">
          <p className="text-sm font-semibold text-white/60">Sale has ended</p>
          <p className="mt-1 text-xs text-white/30">
            {saleEnd.toLocaleDateString(undefined, {
              dateStyle: "long",
            })}
          </p>
        </div>
      ) : !hasTickets ? (
        <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-5 text-center">
          <p className="text-sm text-white/40">No tickets available</p>
        </div>
      ) : (
        <form onSubmit={handleOrder} className="mt-4 space-y-4">
          {ticketTypes.map((tt) => {
            const remaining = tt.quantityTotal - tt.quantitySold;
            const isSoldOut = remaining <= 0;
            const qty = quantities[tt.id] ?? 0;
            const maxQty = Math.min(tt.maxPerOrder, remaining);

            return (
              <div
                key={tt.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isSoldOut
                    ? "border-white/[0.04] opacity-50"
                    : qty > 0
                      ? "border-[#ff7224]/30 bg-[#ff7224]/[0.04]"
                      : "border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{tt.name}</p>
                    {tt.description && (
                      <p className="mt-0.5 text-xs text-white/40">
                        {tt.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-white/30">
                      {isSoldOut
                        ? "Sold out"
                        : `${remaining} remaining`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#ff7224]">
                      {formatPrice(tt.price, currency)}
                    </p>
                  </div>
                </div>

                {!isSoldOut && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQty(tt.id, Math.max(0, qty - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white transition hover:bg-white/[0.12]"
                      aria-label="Decrease quantity"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M5 12h14" strokeLinecap="round" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(tt.id, Math.min(maxQty, qty + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white transition hover:bg-white/[0.12]"
                      aria-label="Increase quantity"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Total */}
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
              <p className="text-sm text-white/50">Total</p>
              <p className="text-lg font-bold text-white">
                {formatPrice(total, currency)}
              </p>
            </div>
          )}

          {/* Sale deadline */}
          <p className="text-[0.65rem] text-white/25">
            Sale ends{" "}
            {saleEnd.toLocaleDateString(undefined, { dateStyle: "medium" })}
          </p>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-red-400/10 text-red-300"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || orderItems.length === 0}
            className="w-full rounded-xl bg-[#ff7224] py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,114,36,0.3)] transition hover:bg-[#ff8442] hover:shadow-[0_0_32px_rgba(255,114,36,0.45)] disabled:opacity-50"
          >
            {isPending
              ? "Processing..."
              : orderItems.length === 0
                ? "Select tickets"
                : `Buy ${orderItems.reduce((s, i) => s + i.quantity, 0)} ticket${orderItems.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}`}
          </button>
        </form>
      )}
    </div>
  );
}
