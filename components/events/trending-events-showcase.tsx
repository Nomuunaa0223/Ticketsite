"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/layout/lang-context";

type TrendingEvent = {
  id: number;
  title: string;
  slug: string;
  imageUrl: string | null;
  cardImageUrl: string | null;
  startsAt: string;
  summary: string;
  currency: string;
  category: { name: string; slug: string };
  venue: { name: string; city: string };
  ticketTypes: { id: number; name: string; price: number; available: number }[];
};

type Props = {
  events: TrendingEvent[];
  isLoggedIn?: boolean;
};

const categoryLabelKeys = {
  sports: "catSports",
  music: "catMusic",
  "theater-arts": "catTheater",
  comedy: "catComedy",
  festival: "catFestival",
  conference: "catConference",
} as const;

export function TrendingEventsMarquee({ events }: Props) {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (events.length === 0) return null;

  const items = [...events, ...events];

  return (
    <div>
      <div className="px-4 pb-4 pt-8 sm:px-[50px]">
        <h2 className="mt-1 ml-2 mb-4 font-goldman text-2xl font-bold text-white sm:ml-[5rem] sm:text-3xl">{t("eventsTrendingTitle")}</h2>
      </div>

      <div className="overflow-hidden px-4 mb-12 sm:px-[150px] group/marquee">
        <div
          className="flex gap-3 py-3 sm:gap-4"
          style={{
            width: "max-content",
            animation: mounted ? `marquee-rtl ${events.length * 14}s linear infinite` : "none",
            animationPlayState: "running",
            willChange: "transform",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
        >
          {items.map((event, i) => {
            const thumb = event.cardImageUrl ?? event.imageUrl ?? null;
            const d = new Date(event.startsAt);
            const dateLabel = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
            const categoryLabelKey = categoryLabelKeys[event.category.slug as keyof typeof categoryLabelKeys];

            return (
              <Link
                key={`${event.id}-${i}`}
                href={`/events/${event.slug}`}
                className="group relative h-52 w-[14rem] shrink-0 overflow-hidden rounded-2xl bg-[#0d1017] sm:h-80 sm:w-[28rem]"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-white/[0.05]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-3 bottom-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#ff7224]">
                    {categoryLabelKey ? t(categoryLabelKey) : event.category.name} · {dateLabel}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold text-white">
                    {event.title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes marquee-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
