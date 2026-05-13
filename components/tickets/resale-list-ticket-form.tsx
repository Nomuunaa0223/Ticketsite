"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  ticketId: number;
  currency: string;
  originalPrice: number;
  resalePriceCap: number | null;
  disabledReason: string | null;
  isListed: boolean;
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

export function ResaleListTicketForm({
  ticketId,
  currency,
  originalPrice,
  resalePriceCap,
  disabledReason,
  isListed,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [askPrice, setAskPrice] = useState(
    String(Math.round(originalPrice))
  );
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  if (isListed) {
    return (
      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs font-semibold text-amber-300">
        Listed for resale
      </div>
    );
  }

  if (disabledReason) {
    return (
      <div className="mt-3 rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-white/30">
        {disabledReason}
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const price = Number(askPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setFeedback({ message: "Enter a valid price.", type: "error" });
      return;
    }

    if (resalePriceCap && price > resalePriceCap) {
      setFeedback({
        message: `Price cannot exceed ${formatPrice(resalePriceCap, currency)}.`,
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/resales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, askPrice: price }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setFeedback({
            message: data.error ?? "Failed to list ticket.",
            type: "error",
          });
        } else {
          setFeedback({ message: "Ticket listed for resale.", type: "success" });
          setExpanded(false);
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
    <div className="mt-3">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
        >
          Sell on resale market
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-white">Resale price</p>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setFeedback(null);
              }}
              className="text-xs text-white/30 transition hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={1}
                max={resalePriceCap ?? undefined}
                step="0.01"
                value={askPrice}
                onChange={(e) => setAskPrice(e.target.value)}
                className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-[#ff7224]/50"
                placeholder={`e.g. ${Math.round(originalPrice)}`}
              />
            </div>
            <span className="text-xs font-bold text-white/40">{currency}</span>
          </div>

          {resalePriceCap && (
            <p className="mt-1.5 text-[0.65rem] text-white/30">
              Max: {formatPrice(resalePriceCap, currency)}
            </p>
          )}

          {feedback && (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-xs ${
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
            disabled={isPending}
            className="mt-3 w-full rounded-xl bg-[#ff7224] py-2.5 text-xs font-bold text-white transition hover:bg-[#ff8442] disabled:opacity-50"
          >
            {isPending ? "Listing..." : "List for resale"}
          </button>
        </form>
      )}
    </div>
  );
}
