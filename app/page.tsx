import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { EventStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { CategoryMagicBento } from "@/components/home/category-magic-bento";
import { HeroParallaxImage } from "@/components/home/hero-parallax-image";
import { HighlightsToggle } from "@/components/home/highlights-toggle";
import { TrendingParallaxGallery } from "@/components/home/trending-parallax-gallery";
import { WeekEventCard, type WeekEventCardItem } from "@/components/home/week-event-card";
import { getCurrentUser } from "@/lib/auth";
import { getTrendingPublicEvents } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { formatCurrency, toNumber } from "@/lib/utils";

const categoryTiles = [
  { label: "Sports", slug: "sports", icon: "sports" },
  { label: "Music", slug: "music", icon: "music" },
  { label: "Theater & Arts", slug: "theater-arts", icon: "theatre" },
  { label: "Comedy", slug: "comedy", icon: "comedy" },
  { label: "Festival", slug: "festival", icon: "festival" },
  { label: "Conference", slug: "conference", icon: "conference" }
] as const;

const featureBadges = [
  { icon: "qr", label: "QR баталгаажуулалт" },
  { icon: "shield", label: "Resale хамгаалалт" },
  { icon: "bell", label: "Live notification" }
] as const;

const placeholderCards = [
  {
    title: "Night City 2024",
    subtitle: "MUSIC • FESTIVAL",
    venue: "Төв цэнгэлдэх хүрээлэн",
    city: "Улаанбаатар",
    dateLabel: "08 сарын 24, 18:00",
    priceLabel: "45,000₮",
    metaLabel: "65,000₮",
    badge: "Sold Out Soon"
  },
  {
    title: "The Colors Live Concert",
    subtitle: "MUSIC • LIVE",
    venue: "UG Arena",
    city: "Улаанбаатар",
    dateLabel: "09 сарын 12, 19:00",
    priceLabel: "80,000₮",
    metaLabel: "Standard",
    badge: null
  },
  {
    title: "UB Comedy Night",
    subtitle: "COMEDY • SPECIAL",
    venue: "UB Comedy Club",
    city: "Улаанбаатар",
    dateLabel: "Өнөөдөр, 20:00",
    priceLabel: "35,000₮",
    metaLabel: "Only 10 left",
    badge: null
  },
  {
    title: "ICT Expo 2024",
    subtitle: "CONFERENCE • TECH",
    venue: "Misheel Expo",
    city: "Улаанбаатар",
    dateLabel: "10 сарын 05, 10:00",
    priceLabel: "Үнэгүй",
    metaLabel: "Registration required",
    badge: null
  },
  {
    title: "Steppe Arena Finals",
    subtitle: "SPORTS • ARENA",
    venue: "Steppe Arena",
    city: "Ulaanbaatar",
    dateLabel: "10 сарын 18, 18:30",
    priceLabel: "60,000₮",
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

const howItWorksSteps = [
  {
    title: "Event сонгох",
    description: "Өөрийн сонирхсон арга хэмжээг олоорой.",
    icon: "search"
  },
  {
    title: "Суудлаа сонгох",
    description: "Харагдац, байршлаа харж өөрт тохирох суудлаа сонгоно.",
    icon: "seat"
  },
  {
    title: "Тасалбар авах",
    description: "Хялбар төлбөрийн хэрэгслээр тасалбараа худалдан авна.",
    icon: "ticket"
  },
  {
    title: "QR уншуулах",
    description: "Нэвтрэх хэсэгт тасалбарын QR кодоо уншуулна.",
    icon: "qr"
  },
  {
    title: "Enjoy + Notify",
    description: "Арга хэмжээгээ таалан соёрхож, хэрэгтэй мэдэгдлээ аваарай.",
    icon: "notify"
  }
] as const;

type TrendingItem = {
  title: string;
  subtitle: string;
  href: Route;
  venue: string;
  city: string;
  dateLabel: string;
  priceLabel: string;
  metaLabel: string;
  badge: string | null;
};

const FEATURED_EVENTS_TIMEOUT_MS = 1500;
const UPCOMING_WINDOW_DAYS = 7;

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
      badge: remaining > 0 && remaining <= 25 ? "Дуусаж байна" : null,
    };
  });

  const sourceTrending: TrendingItem[] = adminTrendingEvents.length
    ? adminTrendingEvents.map((event) => {
        const startingPrice = event.ticketTypes.length
          ? Math.min(...event.ticketTypes.map((item) => toNumber(item.price)))
          : 0;
        return {
          title: event.title,
          subtitle: `${event.category.name.toUpperCase()} • ${getPromoLabel(event.category.slug)}`,
          href: `/events/${event.slug}` as Route,
          venue: event.venue.name,
          city: event.venue.city,
          dateLabel: formatMongolianDate(event.startsAt),
          priceLabel: startingPrice > 0 ? formatTugrik(startingPrice, event.currency) : "Үнэгүй",
          metaLabel: event.summary ?? "",
          badge: null,
          imageSrc: event.cardImageUrl ?? event.imageUrl ?? null,
        };
      })
    : placeholderCards.map((p, i) => ({
        title: p.title,
        subtitle: p.subtitle,
        href: "/events" as Route,
        venue: p.venue,
        city: p.city,
        dateLabel: p.dateLabel,
        priceLabel: p.priceLabel,
        metaLabel: p.metaLabel,
        badge: p.badge,
        imageSrc: null,
      }));

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
    .slice(0, 4)
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

  const upcomingWeekFallback: WeekEventCardItem[] = placeholderCards.slice(0, 4).map((placeholder, index) => {
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
    <>
      <section className="home-enter relative min-h-[calc(100vh-5.5rem)] overflow-hidden bg-[#06070d]">
        <HeroParallaxImage />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.1)_0%,rgba(7,10,18,0.32)_20%,rgba(5,6,10,0.66)_58%,rgba(4,4,6,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,135,55,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,109,31,0.1),transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(8,12,23,0.85)_0%,rgba(8,12,23,0)_100%)]" />

        <div className="relative px-4 pb-12 pt-10 sm:px-8 lg:px-12 lg:pt-16">
          <div className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-5xl flex-col items-center justify-center text-center">
            <h1 className="home-enter__item max-w-4xl text-balance font-display text-4xl font-extrabold leading-[1.16] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4rem]">
              <span className="block">Амьд мэдрэмжийг мэдэр.</span>
              <span className="mt-6 block text-3xl font-semibold tracking-[-0.02em] text-white/90 sm:text-[2.25rem]">
                Дараагийн шилдэг үдэш таныг хүлээж байна.
              </span>
            </h1>

            <div className="home-enter__item mt-7 flex flex-wrap items-center justify-center gap-3 text-sm text-[#ffd9c5] sm:text-[0.95rem] [--enter-delay:160ms]">
              {featureBadges.map((badge) => (
                <div key={badge.label} className="hero-pill">
                  <span className="text-[#ff7c34]">{renderFeatureIcon(badge.icon)}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>

            <div className="home-enter__item mt-10 flex flex-col gap-3 sm:flex-row [--enter-delay:360ms]">
              <Link href="/events" className="hero-primary-btn px-8 py-4">
                Тасалбар авах
              </Link>
              <Link href="#trending" className="hero-secondary-btn px-8 py-4">
                <span className="font-bjcree">Trending events</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="trending"
        className="relative bg-[linear-gradient(180deg,#050608_0%,#090c12_100%)] px-4 pb-20 pt-20 sm:px-8 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-18 lg:pt-18"
      >
        <div className="mx-auto max-w-7xl">
          <CategoryMagicBento items={categoryTiles} />

          <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-20">
            <div>
              <p className="font-goldman text-4xl font-bold text-white">Trending Events</p>
            </div>
            
          </div>

          <TrendingParallaxGallery items={trendingGalleryItems} />

        </div>
      </section>

      <section
        id="upcoming-this-week"
        className="section-reveal week-events-section relative bg-[linear-gradient(180deg,#070a11_0%,#080b12_100%)] px-4 pb-20 pt-4 sm:px-8 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="week-events-header">
            <div className="week-events-header__title-wrap">
              <span className="week-events-header__badge">LIVE SOON</span>
              <h2 className="week-events-header__title">This Week</h2>
              <p className="week-events-header__subtitle">Энэ 7 хоногт болох онцлох event-үүд</p>
            </div>

            <Link href="/events" className="week-events-header__cta">
              View All
            </Link>
          </div>

          <div className="week-events-grid">
            {upcomingWeekEvents.map((event, index) => (
              <WeekEventCard key={`${event.title}-${index}`} event={event} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#090c12_0%,#06080d_100%)] px-4 pb-24 pt-8 sm:px-8 sm:pb-28 sm:pt-12 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.24em] ">Хэрхэн ашиглах вэ?</p>
          </div>

          <div className="how-it-works-shell mt-14">
            <div className="how-it-works-line" />

            {howItWorksSteps.map((step, index) => (
              <div key={`${step.title}-${index}`} className="how-it-works-step">
                <div className="how-it-works-orb">{renderHowItWorksIcon(step.icon)}</div>
                <h3 className="how-it-works-title">{step.title}</h3>
                <p className="how-it-works-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights toggle section */}
      <section className="relative bg-[linear-gradient(180deg,#06080d_0%,#070a11_100%)] px-4 pb-24 pt-16 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Онцлох</p>
              <h2 className="mt-1 font-goldman text-3xl font-bold text-white">Highlights</h2>
            </div>
            <Link href="/events" className="text-sm font-semibold text-white/40 transition hover:text-white">
              Бүгдийг харах
            </Link>
          </div>
          <HighlightsToggle events={highlightEvents} />
        </div>
      </section>

      {/* FAQ section */}
      <section className="relative bg-[linear-gradient(180deg,#070a11_0%,#060810_100%)] px-4 pb-24 pt-16 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Тусламж</p>
            <h2 className="mt-1 font-goldman text-3xl font-bold text-white">Түгээмэл асуултууд</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Tixora гэж юу вэ?", a: "Tixora бол арга хэмжээний тасалбар авах, худалдах, QR-аар баталгаажуулах зориулалттай ухаалаг платформ юм." },
              { q: "Тасалбарыг яаж авах вэ?", a: "Хүссэн арга хэмжээгээ сонгоод, суудлаа тэмдэглэж, хэдхэн алхамаар аюулгүйгээр төлбөрөө хийнэ." },
              { q: "Буцаан олгох боломжтой юу?", a: "Буцаах болон цуцлах нөхцөл нь тухайн арга хэмжээний зохион байгуулагчийн бодлогоос хамаарна." },
              { q: "Resale буюу дахин худалдах гэж яаж ажилладаг вэ?", a: "'Тасалбар зарах' дээр дарж үнээ оруулахад таны тасалбар зах зээл дээр жагсаагдана." },
              { q: "Resale аюулгүй юу?", a: "Тийм ээ. Бүх гүйлгээ Tixora системийн дотор явагддаг тул хуурамч тасалбараас хамгаалагдана." },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-white/[0.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] open:bg-white/[0.05]"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white list-none">
                  {item.q}
                  <span className="shrink-0 text-white/40 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-7 text-white/52">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA section */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#060810_0%,#04050b_100%)] px-4 py-24 sm:px-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,114,36,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Tixora</p>
          <h2 className="mt-3 font-goldman text-3xl font-bold leading-tight text-white sm:text-4xl">
            Дараагийн мартагдашгүй<br />event-ээ Tixora-с эхлүүл.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/48">
            Шилдэг арга хэмжээ, баталгаатай тасалбар, хурдан захиалга — бүгд нэг дор.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="hero-primary-btn px-8 py-4">
              Бүртгүүлэх
            </Link>
            <Link href="/events" className="hero-secondary-btn px-8 py-4">
              Event үзэх
            </Link>
          </div>
        </div>
      </section>
    </>
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
      take: 5,
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

function renderCategoryIcon(kind: (typeof categoryTiles)[number]["icon"]) {
  if (kind === "sports") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="7" />
        <path d="m9 9 2 1 2-1 2 2-.5 2.5L12 15l-2.5-1.5L9 11Z" />
      </svg>
    );
  }

  if (kind === "music") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 4v10.5a2.5 2.5 0 1 1-2-2.45V6l8-2v8.5a2.5 2.5 0 1 1-2-2.45V4Z" />
      </svg>
    );
  }

  if (kind === "theatre") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2v9c0 3-2 5-4 5-1.6 0-2.4-1-3-2-1 1-1.8 2-3 2s-2-1-3-2c-.6 1-1.4 2-3 2-2 0-4-2-4-5Z" />
        <path d="M9 11c.5.7 1.3 1 2 1s1.5-.3 2-1" />
        <path d="M8.5 9h.01" />
        <path d="M15.5 9h.01" />
      </svg>
    );
  }

  if (kind === "comedy") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 7h5v5H5z" />
        <path d="M14 7h5v5h-5z" />
        <path d="M7 16c1.2 1.3 2.8 2 5 2s3.8-.7 5-2" />
      </svg>
    );
  }

  if (kind === "festival") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10h18" />
        <path d="M5 10V7l7-3 7 3v3" />
        <path d="M6 10v8" />
        <path d="M10 10v8" />
        <path d="M14 10v8" />
        <path d="M18 10v8" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 16v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1" />
      <path d="M8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M13 16v-1a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1" />
      <path d="M16.5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

function renderFeatureIcon(kind: (typeof featureBadges)[number]["icon"]) {
  if (kind === "qr") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h5v5H4z" />
        <path d="M15 4h5v5h-5z" />
        <path d="M4 15h5v5H4z" />
        <path d="M17 15v2" />
        <path d="M15 17h2" />
        <path d="M19 19h1" />
        <path d="M19 15v1" />
        <path d="M11 4v3" />
        <path d="M11 17h3" />
      </svg>
    );
  }

  if (kind === "shield") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3 5 6v6c0 5 3.4 7.9 7 9 3.6-1.1 7-4 7-9V6l-7-3Z" />
        <path d="m9.5 12 1.8 1.8 3.7-3.8" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function renderHowItWorksIcon(kind: (typeof howItWorksSteps)[number]["icon"]) {
  if (kind === "search") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (kind === "seat") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 12V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
        <path d="M5 12h14v4H5z" />
        <path d="M7 16v2" />
        <path d="M17 16v2" />
      </svg>
    );
  }

  if (kind === "ticket") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" />
        <path d="M12 6v12" />
      </svg>
    );
  }

  if (kind === "qr") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h5v5H4z" />
        <path d="M15 4h5v5h-5z" />
        <path d="M4 15h5v5H4z" />
        <path d="M15 15h2" />
        <path d="M19 15h1" />
        <path d="M17 17h3" />
        <path d="M15 19h2" />
      </svg>
    );
  }

  if (kind === "notify") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M9 17a3 3 0 0 0 6 0" />
        <path d="m9.5 10.5 1.5 1.5 3.5-3.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13c2.5 0 4.5-2 4.5-4.5S7.5 4 5 4 .5 6 .5 8.5 2.5 13 5 13Z" />
      <path d="M18 20c2.5 0 4.5-2 4.5-4.5S20.5 11 18 11s-4.5 2-4.5 4.5S15.5 20 18 20Z" />
      <path d="m12 8 4 4" />
      <path d="m17 6 1 5 5 1" />
    </svg>
  );
}

