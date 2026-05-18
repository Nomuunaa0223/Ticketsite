import { getPublicEventsByCategory, getTrendingPublicEvents, searchPublicEvents } from "@/lib/events";
import { EventsSections } from "@/components/events/events-sections";
import { SearchResults } from "@/components/events/search-results";
import { TrendingEventsMarquee } from "@/components/events/trending-events-showcase";
import { CategoryNav } from "@/components/layout/category-nav";
import { getCurrentUser } from "@/lib/auth";
import { toNumber } from "@/lib/utils";
import { redirect } from "next/navigation";

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

  const [categoryEventGroups, trendingEventsRaw, user, searchEventsRaw] = await Promise.all([
    Promise.all(categories.map((category) => getPublicEventsByCategory(category.slug, 12))),
    getTrendingPublicEvents(5),
    getCurrentUser(),
    search ? searchPublicEvents(search) : Promise.resolve([]),
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
      </div>
    </section>
  );
}
