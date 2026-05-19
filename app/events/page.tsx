import Image from "next/image";
import Link from "next/link";
import { getPublicEventsByCategory, getTrendingPublicEvents, searchPublicEvents } from "@/lib/events";
import { EventsSections } from "@/components/events/events-sections";
import { SearchResults } from "@/components/events/search-results";
import { TrendingEventsMarquee } from "@/components/events/trending-events-showcase";
import { CategoryNav } from "@/components/layout/category-nav";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const categories = [
  { label: "Sports", slug: "sports" },
  { label: "Music", slug: "music" },
  { label: "Theater & Arts", slug: "theater-arts" },
  { label: "Comedy", slug: "comedy" },
  { label: "Festival", slug: "festival" },
  { label: "Conference", slug: "conference" },
];

type Props = {
  searchParams: Promise<{ search?: string; category?: string }>;
};

export default async function EventsPage({ searchParams }: Props) {
  const { search, category } = await searchParams;
  const legacyCategory = categories.find((cat) => cat.slug === category);

  if (legacyCategory && !search) {
    redirect(`/events#${legacyCategory.slug}`);
  }

  const [categoryEventGroups, trendingEventsRaw, user, searchEventsRaw, aiEvents] = await Promise.all([
    Promise.all(categories.map((category) => getPublicEventsByCategory(category.slug, 12))),
    getTrendingPublicEvents(5),
    getCurrentUser(),
    search ? searchPublicEvents(search) : Promise.resolve([]),
    prisma.event.findMany({
      where: { aiGenerated: true, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        category: true,
        venue: true,
        ticketTypes: { orderBy: { price: "asc" } },
      },
    }).catch(() => []),
  ]);

  const showCategoryNav = user?.role === "USER";

  const trendingEvents = trendingEventsRaw.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    imageUrl: event.imageUrl,
    cardImageUrl: event.cardImageUrl,
    startsAt: event.startsAt.toISOString(),
    summary: event.summary,
    currency: event.currency,
    category: { name: event.category.name, slug: event.category.slug },
    venue: { name: event.venue.name, city: event.venue.city },
    ticketTypes: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      available: t.quantityTotal - t.quantitySold,
    })),
  }));

  const sections = categories.map((cat, index) => ({
    ...cat,
    events: (categoryEventGroups[index] ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      imageUrl: event.imageUrl,
      cardImageUrl: event.cardImageUrl,
      summary: event.summary,
      currency: event.currency,
      startsAt: event.startsAt.toISOString(),
      category: { name: event.category.name, slug: event.category.slug },
      venue: { name: event.venue.name, city: event.venue.city },
      ticketTypes: event.ticketTypes.map((t) => ({ price: toNumber(t.price) }))
    }))
  }));

  const searchResults = searchEventsRaw.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    imageUrl: event.imageUrl,
    cardImageUrl: event.cardImageUrl,
    summary: event.summary,
    currency: event.currency,
    startsAt: event.startsAt.toISOString(),
    category: { name: event.category.name, slug: event.category.slug },
    venue: { name: event.venue.name, city: event.venue.city },
    ticketTypes: event.ticketTypes.map((t) => ({ price: toNumber(t.price) })),
  }));

  return (
    <section className="min-h-screen bg-black">
      <TrendingEventsMarquee events={trendingEvents} isLoggedIn={!!user} />
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {showCategoryNav ? (
          <div className="events-category-nav-wrap">
            <CategoryNav className="events-category-nav" />
          </div>
        ) : null}
        {search ? (
          <SearchResults query={search} events={searchResults} />
        ) : (
          <EventsSections sections={sections} />
        )}

        {!search && aiEvents.length > 0 && (
          <div className="mt-14 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Tixy AI</p>
                <h2 className="mt-1 font-goldman text-xl font-bold text-white">Special Events</h2>
              </div>
              <Link href={"/special" as never} className="text-sm font-semibold text-white/40 transition hover:text-white">
                Бүгдийг харах →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {aiEvents.map((event) => {
                const thumb = event.cardImageUrl ?? event.imageUrl;
                const startingPrice = event.ticketTypes.length
                  ? Math.min(...event.ticketTypes.map((t) => toNumber(t.price)))
                  : 0;
                return (
                  <div key={event.id} className="group flex flex-col overflow-hidden rounded-2xl bg-[#0e1424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                    <div className="relative h-40 w-full overflow-hidden bg-white/[0.04]">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={event.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="h-full w-full bg-white/[0.04]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424]/80 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-violet-500/20 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-300">
                        AI Special
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/30">{event.category.name}</p>
                        <p className="mt-1 line-clamp-2 text-base font-bold text-white">{event.title}</p>
                        <p className="mt-0.5 text-xs text-white/40">{event.ticketTypes[0]?.name ?? "General Admission"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[0.7rem] text-white/40">
                        <span>{formatDateTime(event.startsAt)}</span>
                        <span>·</span>
                        <span>{event.venue.name}</span>
                      </div>
                      <div className="mt-auto flex items-end justify-between gap-2">
                        <div>
                          <p className="text-[0.6rem] text-white/30">үнэ</p>
                          <p className="text-lg font-bold text-white">
                            {startingPrice > 0 ? formatCurrency(startingPrice, event.currency) : "Үнэгүй"}
                          </p>
                        </div>
                        <Link
                          href={`/events/${event.slug}` as never}
                          className="rounded-xl bg-[#ff7224] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff8c42]"
                        >
                          Авах
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
