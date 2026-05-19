"use client";

import Image from "next/image";
import Link from "next/link";

export type HighlightEvent = {
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
        {/* Mobile: full-bleed background image */}
        <div className="absolute inset-0 sm:hidden">
          <Image
            src={BRAND_IMAGES[0]}
            alt={featured.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,12,20,0.35)_0%,rgba(9,12,20,0.72)_55%,rgba(9,12,20,0.96)_100%)]" />
        </div>

        <div className="relative flex flex-1 flex-col justify-end gap-3 p-6 text-left sm:justify-center sm:p-10 sm:text-right">

          <h3 className="font-goldman text-xl font-bold uppercase leading-tight text-white sm:text-2xl lg:text-3xl">
            "ЦЭНГЭЛДЭХ" — ЗУНЫ ХАМГИЙН ГАЙХАЛТАЙ АМЬД ХӨГЖМИЙН ТОГЛОЛТ
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-white/60 sm:line-clamp-4">
            Монголд анх удаа үе үеийн шилдэг амьд хөгжмийн хамтлагуудын төлөөллүүд нэгэн дээвэр доор, тэр дундаа Төв Цэнгэлдэх Хүрээлэндээ цугларч үзэгч олонтойгоо нэгэн мартагдашгүй үдшийг өнгөрөөлөө.
          </p>
        </div>

        {/* Desktop: side image panel */}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {cards.map((event, i) => {
          const overrideTitle =
            i === 0 ? "Тамгагүй Төр жүжгийн олон улсын West End хувилбар болох \"Монгол Хаан\" жүжиг" :
            i === 1 ? "ПУУЖИН БАЯРАА тоглолт" :
            i === 2 ? "Night Train хамтлагийн \"Цэнхэр шувуу\" цомгийн 20 жилийн ойн Tribute тоглолт" :
            null;
          const overrideSummary =
            i === 0 ? "Дэлхийн театрын ертөнцөд Монгол Тамгалал болж буй \"Тамгагүй Төр\" жүжгийн олон улсын West End хувилбар болох \"Монгол Хаан\" жүжгийг Сингапурын алдарт Marina Bay Sands-н Sands театрт толилуулсан билээ." :
            i === 1 ? "Реппер Rokitbay-ийн бие даасан ПУУЖИН БАЯРАА тоглолт нь 2024 оны намрын Highlight тоглолт гэж гарчиглах нь буруудахгүй болов уу. . Цэнгэлдэх хүрээлэнг дүүргэж, өөрийн хит дуунуудаараа ирсэн бүгдийг бүхэлд нь нэгэн зэрэг доргиож чадсан билээ." :
            i === 2 ? "Шөнийн галт тэрэг хамтлагийн \"Цэнхэр шувуу\" цомгийн 20 жилийн ойн Tribute тоглолт нь 2024 оны 02 сарын 03-ны өдөр болсон бөгөөд энэ нь \"Portal.mn\"-ийн зохион байгуулсан анхны тоглолт гэдгээрээ онцлог юм." :
            null;
          return (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] transition hover:bg-white/[0.06]"
            >
              <div className="flex flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff7224]">
                  {event.category}
                </p>
                <h3 className="font-goldman line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">
                  {overrideTitle ?? event.title}
                </h3>
                {(overrideSummary ?? event.summary) && (
                  <p className="hidden line-clamp-2 text-xs leading-relaxed text-white/45 sm:block">
                    {overrideSummary ?? event.summary}
                  </p>
                )}
              </div>

              <div className="relative mt-auto h-32 w-full overflow-hidden sm:h-44">
                <Image
                  src={BRAND_IMAGES[i + 1]}
                  alt={event.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
