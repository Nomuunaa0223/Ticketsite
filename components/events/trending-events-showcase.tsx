"use client";

import Link from "next/link";

type TrendingEvent = {
  id: number;
  title: string;
  slug: string;
  imageUrl: string | null;
  cardImageUrl: string | null;
  startsAt: string;
  category: { name: string; slug: string };
  venue: { name: string; city: string };
};

type Props = {
  events: TrendingEvent[];
};

export function TrendingEventsMarquee({ events }: Props) {
  if (events.length === 0) return null;

  const items = [...events, ...events, ...events, ...events];

  return (
    <div>
      <div className="px-5 pb-4 pt-8 sm:px-8 lg:px-12">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Featured</p>
        <h2 className="mt-1 font-goldman text-3xl font-bold text-white">Trending Events</h2>
      </div>

      <div className="overflow-hidden px-5 sm:px-8 lg:px-12">
      <div
        className="flex gap-4 py-3"
        style={{
          width: "max-content",
          animation: `marquee-rtl ${events.length * 6}s linear infinite`,
        }}
      >
        {items.map((event, i) => {
          const thumb = event.cardImageUrl ?? event.imageUrl ?? null;
          const dateLabel = new Intl.DateTimeFormat("mn-MN", {
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(event.startsAt));

          return (
            <Link
              key={`${event.id}-${i}`}
              href={`/events/${event.slug}`}
              className="group relative h-80 w-[28rem] shrink-0 overflow-hidden rounded-2xl bg-[#0d1017]"
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
                  {event.category.name} · {dateLabel}
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
          100% { transform: translateX(calc(-100% / 4)); }
        }
        .marquee-wrap:hover > div { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
