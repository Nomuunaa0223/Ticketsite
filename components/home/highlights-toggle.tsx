"use client";

import Link from "next/link";
import { useState } from "react";

type HighlightEvent = {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  venue: string;
  city: string;
  dateLabel: string;
  priceLabel: string;
  badge?: string | null;
};

const TABS = [
  { label: "Бүгд", slug: "all" },
  { label: "Хөгжим", slug: "music" },
  { label: "Спорт", slug: "sports" },
  { label: "Театр", slug: "theater-arts" },
  { label: "Фестиваль", slug: "festival" },
] as const;

export function HighlightsToggle({ events }: { events: HighlightEvent[] }) {
  const [active, setActive] = useState<string>("all");

  const filtered =
    active === "all" ? events : events.filter((e) => e.categorySlug === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActive(tab.slug)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
              active === tab.slug
                ? "bg-[#ff7224] text-white shadow-[0_0_18px_rgba(255,114,36,0.4)]"
                : "bg-white/[0.05] text-white/52 hover:bg-white/[0.09] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-white/30">
          Энэ ангилалд event байхгүй байна.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="group flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#ff7224]">
                    {event.category}
                  </p>
                  <h3 className="mt-1 truncate font-semibold text-white transition group-hover:text-[#ff8a50]">
                    {event.title}
                  </h3>
                </div>
                {event.badge ? (
                  <span className="shrink-0 rounded-full bg-[#ff7224]/20 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#ff7224]">
                    {event.badge}
                  </span>
                ) : null}
              </div>

              <div className="space-y-1 text-xs text-white/45">
                <p>{event.venue}, {event.city}</p>
                <p>{event.dateLabel}</p>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
                <p className="text-base font-bold text-white">{event.priceLabel}</p>
                <span className="text-xs font-semibold text-[#ff7224] opacity-0 transition group-hover:opacity-100">
                  Дэлгэрэнгүй →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
