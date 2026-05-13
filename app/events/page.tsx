import { getPublicEventsByCategory, getTrendingPublicEvents } from "@/lib/events";
import { EventsSections } from "@/components/events/events-sections";
import { TrendingEventsShowcase } from "@/components/events/trending-events-showcase";
import { CategoryNav } from "@/components/layout/category-nav";
import { getCurrentUser } from "@/lib/auth";
import { toNumber } from "@/lib/utils";

const categories = [
  { label: "Sports", slug: "sports" },
  { label: "Music", slug: "music" },
  { label: "Theater & Arts", slug: "theater-arts" },
  { label: "Comedy", slug: "comedy" },
  { label: "Festival", slug: "festival" },
  { label: "Conference", slug: "conference" },
];

export default async function EventsPage() {
  const [categoryEventGroups, trendingEventsRaw, user] = await Promise.all([
    Promise.all(categories.map((category) => getPublicEventsByCategory(category.slug, 12))),
    getTrendingPublicEvents(5),
    getCurrentUser()
  ]);
  const showCategoryNav = user?.role === "USER";
  const trendingEvents = trendingEventsRaw.map((event) => ({
    id: event.id,
    title: event.title,
    slug: event.slug,
    imageUrl: event.imageUrl,
    cardImageUrl: event.cardImageUrl,
    summary: event.summary,
    currency: event.currency,
    startsAt: event.startsAt.toISOString(),
    category: {
      name: event.category.name,
      slug: event.category.slug
    },
    venue: {
      name: event.venue.name,
      city: event.venue.city
    },
    ticketTypes: event.ticketTypes.map((ticketType) => ({
      price: toNumber(ticketType.price)
    }))
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
      category: {
        name: event.category.name,
        slug: event.category.slug
      },
      venue: {
        name: event.venue.name,
        city: event.venue.city
      },
      ticketTypes: event.ticketTypes.map((ticketType) => ({
        price: toNumber(ticketType.price)
      }))
    }))
  }));

  return (
    <section className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
      <TrendingEventsShowcase events={trendingEvents} />
      {showCategoryNav ? (
        <div className="events-category-nav-wrap">
          <CategoryNav className="events-category-nav" />
        </div>
      ) : null}
      <EventsSections sections={sections} />
    </section>
  );
}
