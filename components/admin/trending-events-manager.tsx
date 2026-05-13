"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

type EventRow = {
  id: string;
  title: string;
  category: string;
  venue: string;
  startsAt: string;
  isTrending: boolean;
  trendingOrder: number | null;
  imageUrl: string | null;
};

type Props = {
  events: EventRow[];
};

export function TrendingEventsManager({ events: initialEvents }: Props) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const trendingCount = events.filter((e) => e.isTrending).length;

  async function toggleTrending(id: string, currentValue: boolean) {
    if (!currentValue && trendingCount >= 5) {
      setFeedback("Maximum 5 trending events allowed.");
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/trending`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: id, isTrending: !currentValue }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFeedback(data.error ?? "Failed to update.");
          return;
        }

        setEvents((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, isTrending: !currentValue } : e
          )
        );
        setFeedback(
          !currentValue
            ? "Event added to trending."
            : "Event removed from trending."
        );
      } catch {
        setFeedback("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white/70">
          {feedback}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-white/40">
          {trendingCount} / 5 events selected as trending
        </p>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ff7224,#ff9c52)]"
            style={{ width: `${(trendingCount / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className={`flex items-center gap-4 rounded-2xl p-4 transition-colors ${
              event.isTrending
                ? "bg-[#ff7224]/[0.08] shadow-[inset_0_0_0_1px_rgba(255,114,36,0.2)]"
                : "bg-[#0f1629] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
            }`}
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#161f36]">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="m7 14 3-3 3 3 4-5 3 4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{event.title}</p>
              <p className="truncate text-xs text-white/38">
                {event.category} · {event.venue} · {event.startsAt}
              </p>
            </div>

            {event.isTrending && event.trendingOrder != null && (
              <span className="shrink-0 rounded-full bg-[#ff7224] px-2.5 py-1 text-[0.64rem] font-bold text-white">
                #{event.trendingOrder}
              </span>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={() => toggleTrending(event.id, event.isTrending)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                event.isTrending
                  ? "bg-white/[0.08] text-white/60 hover:bg-red-400/15 hover:text-red-300"
                  : "bg-[#ff7224]/15 text-[#ff7224] hover:bg-[#ff7224] hover:text-white"
              } disabled:opacity-50`}
            >
              {event.isTrending ? "Remove" : "Add to trending"}
            </button>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
          No published events found.
        </div>
      )}
    </div>
  );
}
