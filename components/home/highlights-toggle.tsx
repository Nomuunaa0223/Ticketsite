"use client";

import Image from "next/image";
import Link from "next/link";

type HighlightEvent = {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  venue: string;
  city: string;
  dateLabel: string;
  priceLabel: string;
  summary?: string;
  badge?: string | null;
};

const BRAND_IMAGES = [
  "/brand/1deh.jpg",
  "/brand/2deh.jpeg",
  "/brand/3deh.webp",
  "/brand/4deh.webp",
] as const;

export function HighlightsToggle({ events }: { events: HighlightEvent[] }) {
  const featured = events[0];
  const cards = events.slice(1, 4);

  if (!featured) return null;

  return (
    <div className="space-y-4">
      <Link
        href={`/events/${featured.slug}`}
        className="group relative flex min-h-[220px] overflow-hidden rounded-2xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] transition hover:bg-white/[0.06] sm:min-h-[260px]"
      >
        <div className="flex flex-1 flex-col justify-center gap-4 p-7 sm:p-10">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#ff7224]">
            {featured.category}
          </p>
          <h3 className="font-goldman text-xl font-bold uppercase leading-tight text-white sm:text-2xl lg:text-3xl">
            {featured.title}
          </h3>
          {featured.summary && (
            <p className="line-clamp-4 max-w-md text-sm leading-relaxed text-white/50">
              {featured.summary}
            </p>
          )}
        </div>

        <div className="relative hidden w-[44%] shrink-0 sm:block">
          <Image
            src={BRAND_IMAGES[0]}
            alt={featured.title}
            fill
            className="object-cover"
            sizes="44vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,12,20,0.88)_0%,rgba(9,12,20,0.1)_50%,transparent_100%)]" />
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((event, i) => (
          <Link
            key={event.slug}
            href={`/events/${event.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] transition hover:bg-white/[0.06]"
          >
            <div className="flex flex-col gap-2 p-5">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff7224]">
                {event.category}
              </p>
              <h3 className="font-goldman line-clamp-2 text-base font-bold leading-snug text-white">
                {event.title}
              </h3>
              {event.summary && (
                <p className="line-clamp-2 text-xs leading-relaxed text-white/45">
                  {event.summary}
                </p>
              )}
            </div>

            <div className="relative mt-auto h-44 w-full overflow-hidden">
              <Image
                src={BRAND_IMAGES[i + 1]}
                alt={event.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
