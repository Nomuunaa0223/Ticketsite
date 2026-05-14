import type { Route } from "next";
import { EventStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { HomeLandingShell } from "@/components/home/home-landing-shell";
import { type WeekEventCardItem } from "@/components/home/week-event-card";
import { getCurrentUser } from "@/lib/auth";
import { getTrendingPublicEvents } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { formatCurrency, toNumber } from "@/lib/utils";


const placeholderCards = [
  {
    title: "Mxrningstar Live'26",
    subtitle: "MUSIC • LIVE",
    venue: "SocialPay Park",
    city: "Улаанбаатар",
    dateLabel: "05 сарын 22, 19:00",
    priceLabel: "85,000₮",
    metaLabel: "Selling fast",
    badge: "LIVE '26"
  },
  {
    title: "Tatar & Gee Live",
    subtitle: "MUSIC • CONCERT",
    venue: "UB Palace",
    city: "Улаанбаатар",
    dateLabel: "05 сарын 25, 20:00",
    priceLabel: "60,000₮",
    metaLabel: "Only 30 left",
    badge: "Sold Out Soon"
  },
  {
    title: "Lumino Summer Fest",
    subtitle: "FESTIVAL • OUTDOOR",
    venue: "Худалдааны төв тайз",
    city: "Улаанбаатар",
    dateLabel: "05 сарын 31, 16:00",
    priceLabel: "45,000₮",
    metaLabel: "Multi-artist lineup",
    badge: null
  },
  {
    title: "Stand Up UB · Vol.12",
    subtitle: "COMEDY • SPECIAL",
    venue: "Grand Tenger Hotel",
    city: "Улаанбаатар",
    dateLabel: "06 сарын 06, 20:00",
    priceLabel: "35,000₮",
    metaLabel: "Limited seats",
    badge: null
  },
  {
    title: "Eejii & The Band",
    subtitle: "MUSIC • ACOUSTIC",
    venue: "Steppe Arena",
    city: "Улаанбаатар",
    dateLabel: "06 сарын 14, 19:30",
    priceLabel: "70,000₮",
    metaLabel: "Premium seats moving fast",
    badge: "Hot Right Now"
  }
] as const;

const cardVisuals = [
  {
    objectPosition: "50% 72%",
    overlay:
      "bg-[linear-gradient(180deg,rgba(58,14,126,0.08)_0%,rgba(32,11,79,0.24)_35%,rgba(9,14,27,0.96)_100%)]"
  },
  {
    objectPosition: "48% 52%",
    overlay:
      "bg-[linear-gradient(180deg,rgba(255,177,56,0.18)_0%,rgba(78,37,3,0.26)_32%,rgba(9,14,27,0.96)_100%)]"
  },
  {
    objectPosition: "56% 44%",
    overlay:
      "bg-[linear-gradient(180deg,rgba(124,65,23,0.14)_0%,rgba(46,18,12,0.28)_34%,rgba(9,14,27,0.96)_100%)]"
  },
  {
    objectPosition: "72% 40%",
    overlay:
      "bg-[linear-gradient(180deg,rgba(0,125,185,0.18)_0%,rgba(8,32,59,0.28)_34%,rgba(9,14,27,0.96)_100%)]"
  },
  {
    objectPosition: "36% 54%",
    overlay:
      "bg-[linear-gradient(180deg,rgba(255,120,64,0.16)_0%,rgba(92,31,11,0.24)_34%,rgba(9,14,27,0.96)_100%)]"
  }
] as const;

const galleryImageSources = [
  "/uploads/1.jpg",
  "/uploads/2.jpg",
  "/uploads/3.jpg",
  "/uploads/4.jpg",
  "/uploads/5.jpg"
] as const;


type TrendingItem = {
  title: string;
  subtitle: string;
  href: Route;
  venue: string;
  city: string;
  dateLabel: string;
  dateDay: string;
  dateMonth: string;
  priceLabel: string;
  metaLabel: string;
  badge: string | null;
};

const FEATURED_EVENTS_TIMEOUT_MS = 1500;
const UPCOMING_WINDOW_DAYS = 30;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/dashboard/admin");
  if (user?.role === "ORGANIZER") redirect("/organizer/dashboard");
  if (user?.role === "USER") redirect("/events");

  const [featuredEvents, adminTrendingEvents] = await Promise.all([
    getFeaturedEvents(),
    getTrendingPublicEvents(5),
  ]);

  const highlightEvents = featuredEvents.slice(0, 9).map((event) => {
    const startingPrice = event.ticketTypes.length
      ? Math.min(...event.ticketTypes.map((item) => toNumber(item.price)))
      : 0;
    const remaining = event.ticketTypes.reduce(
      (sum, item) => sum + Math.max(0, item.quantityTotal - item.quantitySold),
      0
    );
    return {
      title: event.title,
      slug: event.slug,
      category: event.category.name,
      categorySlug: event.category.slug,
      venue: event.venue.name,
      city: event.venue.city,
      dateLabel: formatMongolianDate(event.startsAt),
      priceLabel: startingPrice > 0 ? formatTugrik(startingPrice, event.currency) : "Үнэгүй",
      summary: event.summary ?? "",
      badge: remaining > 0 && remaining <= 25 ? "Дуусаж байна" : null,
    };
  });

  const sourceTrending: TrendingItem[] = adminTrendingEvents.length
    ? adminTrendingEvents.map((event) => {
      const startingPrice = event.ticketTypes.length
        ? Math.min(...event.ticketTypes.map((item) => toNumber(item.price)))
        : 0;
      const d = new Date(event.startsAt);
      return {
        title: event.title,
        subtitle: `${event.category.name.toUpperCase()} • ${getPromoLabel(event.category.slug)}`,
        href: `/events/${event.slug}` as Route,
        venue: event.venue.name,
        city: event.venue.city,
        dateLabel: formatMongolianDate(event.startsAt),
        dateDay: String(d.getDate()).padStart(2, "0"),
        dateMonth: String(d.getMonth() + 1).padStart(2, "0"),
        priceLabel: startingPrice > 0 ? formatTugrik(startingPrice, event.currency) : "Үнэгүй",
        metaLabel: event.summary ?? "",
        badge: null,
        imageSrc: event.cardImageUrl ?? event.imageUrl ?? null,
      };
    })
    : placeholderCards.map((p) => {
      const m = p.dateLabel.match(/(\d{1,2})\s*сарын\s*(\d{1,2})/);
      return {
        title: p.title,
        subtitle: p.subtitle,
        href: "/events" as Route,
        venue: p.venue,
        city: p.city,
        dateLabel: p.dateLabel,
        dateDay: m ? m[2].padStart(2, "0") : "",
        dateMonth: m ? m[1].padStart(2, "0") : "",
        priceLabel: p.priceLabel,
        metaLabel: p.metaLabel,
        badge: p.badge,
        imageSrc: null,
      };
    });

  const trendingGalleryItems = sourceTrending.slice(0, 5).map((event, index) => {
    const visual = cardVisuals[index] ?? cardVisuals[0];
    return {
      ...event,
      imageSrc: (event as { imageSrc?: string | null }).imageSrc ?? galleryImageSources[index] ?? galleryImageSources[0],
      imageAlt: event.title,
      objectPosition: visual.objectPosition,
    };
  });

  const now = new Date();
  const nextWeekBoundary = new Date(now);
  nextWeekBoundary.setDate(nextWeekBoundary.getDate() + UPCOMING_WINDOW_DAYS);

  const upcomingWeekFromData: WeekEventCardItem[] = featuredEvents
    .filter((event) => {
      const startsAt = new Date(event.startsAt);
      return startsAt >= now && startsAt <= nextWeekBoundary;
    })
    .slice(0, 3)
    .map((event, index) => {
      const visual = cardVisuals[index] ?? cardVisuals[0];
      const startingPrice = event.ticketTypes.length
        ? Math.min(...event.ticketTypes.map((item) => toNumber(item.price)))
        : 0;
      const remaining = event.ticketTypes.reduce(
        (sum, item) => sum + Math.max(0, item.quantityTotal - item.quantitySold),
        0
      );
      const startsAt = new Date(event.startsAt);
      const urgency = getWeekUrgency(startsAt, remaining, now);
      const imageSrc = galleryImageSources[index] ?? galleryImageSources[0];

      return {
        title: event.title,
        href: `/events/${event.slug}` as Route,
        imageSrc,
        imageAlt: event.title,
        objectPosition: visual.objectPosition,
        datePrimaryLabel: formatWeekDatePrimary(startsAt),
        dateSecondaryLabel: formatWeekDateSecondary(startsAt),
        venueLabel: `${event.venue.name}, ${event.venue.city}`,
        priceLabel: startingPrice > 0 ? formatTugrik(startingPrice, event.currency) : "Үнэгүй",
        availabilityLabel: remaining > 0 ? `Only ${remaining} left` : "Registration required",
        urgencyBadge: urgency.badge,
        countdownLabel: urgency.countdown
      };
    });

  const upcomingWeekFallback: WeekEventCardItem[] = placeholderCards.slice(0, 3).map((placeholder, index) => {
    const visual = cardVisuals[index] ?? cardVisuals[0];
    const startsAt = new Date(now);
    startsAt.setDate(now.getDate() + index);
    startsAt.setHours(17 + index, 0, 0, 0);
    const urgency = getWeekUrgency(startsAt, Math.max(8, 28 - index * 6), now);
    const imageSrc = galleryImageSources[index] ?? galleryImageSources[0];

    return {
      title: placeholder.title,
      href: "/events" as Route,
      imageSrc,
      imageAlt: placeholder.title,
      objectPosition: visual.objectPosition,
      datePrimaryLabel: formatWeekDatePrimary(startsAt),
      dateSecondaryLabel: formatWeekDateSecondary(startsAt),
      venueLabel: `${placeholder.venue}, ${placeholder.city}`,
      priceLabel: placeholder.priceLabel,
      availabilityLabel: index === 1 ? "Only 12 left" : index === 2 ? "Selling fast" : "Limited seats",
      urgencyBadge: urgency.badge,
      countdownLabel: urgency.countdown
    };
  });

  const upcomingWeekEvents = upcomingWeekFromData.length ? upcomingWeekFromData : upcomingWeekFallback;

  return (
    <HomeLandingShell
      highlightEvents={highlightEvents}
      trendingGalleryItems={trendingGalleryItems}
      upcomingWeekEvents={upcomingWeekEvents}
    />
  );
}

async function getFeaturedEvents() {
  const featuredEventsPromise = prisma.event
    .findMany({
      where: {
        status: EventStatus.PUBLISHED
      },
      include: {
        category: true,
        venue: true,
        ticketTypes: {
          orderBy: {
            price: "asc"
          }
        }
      },
      take: 20,
      orderBy: {
        startsAt: "asc"
      }
    })
    .catch(() => []);

  const timeoutPromise = new Promise<typeof featuredEventsPromise extends Promise<infer TResult> ? TResult : never>(
    (resolve) => {
      setTimeout(() => resolve([]), FEATURED_EVENTS_TIMEOUT_MS);
    }
  );

  return Promise.race([featuredEventsPromise, timeoutPromise]);
}

function formatMongolianDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("mn-MN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function formatTugrik(amount: number, currency: string) {
  if (currency.toUpperCase() === "MNT") {
    return `${new Intl.NumberFormat("mn-MN", {
      maximumFractionDigits: 0
    }).format(amount)}₮`;
  }

  return formatCurrency(amount, currency);
}

function getPromoLabel(slug: string) {
  if (slug === "music") return "LIVE";
  if (slug === "sports") return "ARENA";
  if (slug === "comedy") return "SPECIAL";
  if (slug === "festival") return "FESTIVAL";
  if (slug === "conference") return "TECH";
  return "EVENT";
}

function formatWeekDatePrimary(value: Date) {
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(value).toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(value);

  return `${month} ${day}`;
}

function formatWeekDateSecondary(value: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(value);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);

  return `${weekday} · ${time}`;
}

function getWeekUrgency(startsAt: Date, remaining: number, now: Date) {
  const diffMs = startsAt.getTime() - now.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;

  let badge = "LIVE SOON";
  if (diffHours <= 0) badge = "Happening Now";
  else if (days === 0) badge = "Today";
  else if (days === 1) badge = "Tomorrow";
  else if (remaining > 0 && remaining <= 12) badge = "Almost Sold Out";
  else if (remaining > 0 && remaining <= 30) badge = "Selling Fast";

  const countdown =
    diffHours <= 0 ? "Starts now" : `Starts in ${days > 0 ? `${days}d ` : ""}${hours}h`;

  return { badge, countdown };
}


