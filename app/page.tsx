import type { Route } from "next";
import { redirect } from "next/navigation";
import { EventStatus } from "@prisma/client";
import { LandingPageContent } from "@/components/home/landing-page-content";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";
import type { WeekEventCardItem } from "@/components/home/week-event-card";

const cardVisuals = [
  { objectPosition: "50% 72%" },
  { objectPosition: "48% 52%" },
  { objectPosition: "56% 44%" },
  { objectPosition: "72% 40%" },
  { objectPosition: "36% 54%" },
] as const;

const galleryImageSources = [
  "/uploads/1.jpg",
  "/uploads/2.jpg",
  "/uploads/3.jpg",
  "/uploads/4.jpg",
  "/uploads/5.jpg",
] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/dashboard/admin");
  if (user?.role === "ORGANIZER") redirect("/organizer/dashboard");
  if (user?.role === "USER") redirect("/events");

  const [events, trendingEvents] = await Promise.all([
    prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED },
      select: {
        title: true,
        slug: true,
        imageUrl: true,
        cardImageUrl: true,
        summary: true,
        startsAt: true,
        currency: true,
        category: { select: { name: true, slug: true } },
        venue: { select: { name: true, city: true } },
        ticketTypes: { select: { price: true }, orderBy: { price: "asc" }, take: 1 }
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    }),
    prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED, isTrending: true },
      select: {
        title: true,
        slug: true,
        imageUrl: true,
        cardImageUrl: true,
        startsAt: true,
        currency: true,
        category: { select: { name: true, slug: true } },
        venue: { select: { name: true, city: true } },
        ticketTypes: { select: { price: true }, orderBy: { price: "asc" }, take: 1 }
      },
      orderBy: [{ trendingOrder: "asc" }, { startsAt: "asc" }],
      take: 5,
    }),
  ]).catch(() => [[], []] as const);

  const trendingGalleryItems = trendingEvents.map((event, index) => {
    const startingPrice = event.ticketTypes.length
      ? Math.min(...event.ticketTypes.map((t) => toNumber(t.price))) : 0;
    return {
      title: event.title,
      subtitle: `${event.category.name.toUpperCase()} • EVENT`,
      href: `/events/${event.slug}` as Route,
      venue: event.venue.name,
      city: event.venue.city,
      dateLabel: formatMongolianDate(event.startsAt),
      priceLabel: startingPrice > 0 ? formatTugrik(startingPrice, event.currency) : "Үнэгүй",
      metaLabel: event.venue.city,
      badge: null,
      imageSrc: event.imageUrl ?? event.cardImageUrl ?? "/uploads/1.jpg",
      imageAlt: event.title,
      objectPosition: cardVisuals[index % 5]?.objectPosition ?? "50% 50%",
    };
  });

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingWeekEvents: WeekEventCardItem[] = events
    .filter((e) => {
      const t = new Date(e.startsAt);
      return t >= now && t <= weekEnd;
    })
    .slice(0, 3)
    .map((event, index) => {
      const startingPrice = event.ticketTypes.length
        ? Math.min(...event.ticketTypes.map((t) => toNumber(t.price))) : 0;
      const startsAt = new Date(event.startsAt);
      return {
        title: event.title,
        href: `/events/${event.slug}` as Route,
        imageSrc: event.cardImageUrl ?? event.imageUrl ?? galleryImageSources[index % 5] ?? "/uploads/1.jpg",
        imageAlt: event.title,
        objectPosition: "50% 50%",
        summary: event.summary,
        dateLabel: formatDateTime(startsAt),
        venueLabel: `${event.venue.name}, ${event.venue.city}`,
        priceLabel: startingPrice > 0 ? formatTugrik(startingPrice, event.currency) : "Free",
      };
    });

  return (
    <LandingPageContent
      trendingGalleryItems={trendingGalleryItems}
      upcomingWeekEvents={upcomingWeekEvents}
    />
  );
}

function formatMongolianDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("mn-MN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function formatTugrik(amount: number, currency: string) {
  if (currency.toUpperCase() === "MNT") {
    return `${new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(amount)}₮`;
  }
  return formatCurrency(amount, currency);
}
