"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/components/layout/lang-context";
import { CategoryMagicBento } from "@/components/home/category-magic-bento";
import { HeroParallaxImage } from "@/components/home/hero-parallax-image";
import { HighlightsToggle, type HighlightEvent } from "@/components/home/highlights-toggle";
import { TrendingParallaxGallery, type TrendingParallaxGalleryItem } from "@/components/home/trending-parallax-gallery";
import { WeekEventCard, type WeekEventCardItem } from "@/components/home/week-event-card";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type ResaleListing = {
  id: number;
  askPrice: unknown;
  buyerFee: unknown;
  event: {
    title: string;
    slug: string;
    startsAt: Date | string;
    currency: string;
    imageUrl: string | null;
    cardImageUrl: string | null;
    venue: { name: string; city: string };
    category: { name: string };
  };
  ticketType: { name: string };
};

type Props = {
  highlightEvents: HighlightEvent[];
  trendingGalleryItems: TrendingParallaxGalleryItem[];
  upcomingWeekEvents: WeekEventCardItem[];
  resaleListings: ResaleListing[];
};

export function HomeLandingShell({ highlightEvents, trendingGalleryItems, upcomingWeekEvents, resaleListings }: Props) {
  const { t } = useLang();

  const categoryTiles = [
    { label: t("catSports"), slug: "sports", icon: "sports" as const },
    { label: t("catMusic"), slug: "music", icon: "music" as const },
    { label: t("catTheater"), slug: "theater-arts", icon: "theatre" as const },
    { label: t("catComedy"), slug: "comedy", icon: "comedy" as const },
    { label: t("catFestival"), slug: "festival", icon: "festival" as const },
    { label: t("catConference"), slug: "conference", icon: "conference" as const },
  ];

  const featureBadges = [
    { icon: "qr" as const, label: t("badgeQr") },
    { icon: "shield" as const, label: t("badgeResale") },
    { icon: "bell" as const, label: t("badgeNotify") },
  ];

  const howItWorksSteps = [
    { title: t("step1Title"), description: t("step1Desc"), icon: "search" as const },
    { title: t("step2Title"), description: t("step2Desc"), icon: "seat" as const },
    { title: t("step3Title"), description: t("step3Desc"), icon: "ticket" as const },
    { title: t("step4Title"), description: t("step4Desc"), icon: "qr" as const },
    { title: t("step5Title"), description: t("step5Desc"), icon: "notify" as const },
  ];

  const faqItems = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  return (
    <>
      <section className="home-enter relative min-h-[100svh] overflow-hidden bg-[#06070d] sm:min-h-[calc(100vh-5.5rem)]">
        <HeroParallaxImage />
        {/* general dim */}
        <div className="absolute inset-0 bg-[rgba(4,3,2,0.32)]" />
        {/* amber tint matching site theme */}
        <div className="absolute inset-0 bg-[rgba(255,114,36,0.08)]" />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,3,2,0.18)_0%,rgba(6,4,2,0.65)_100%)]" />
        {/* bottom fade into page */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,rgba(6,7,13,1)_0%,rgba(6,7,13,0)_100%)]" />

        <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pb-28 pt-14 text-center sm:min-h-[calc(100vh-5.5rem)] sm:px-8 sm:pb-12 sm:pt-10 lg:px-12 lg:pt-16">
          <h1 className="home-enter__item max-w-4xl text-balance font-goldman font-bold leading-[1.14] tracking-[-0.03em] text-white">
            <span className="home-hero-title-text block text-[2.1rem] sm:text-4xl lg:text-[4rem]">{t("heroTitle")}</span>
            <span className="home-hero-subtitle-text mt-3 block font-goldman text-[1.35rem] font-semibold tracking-[-0.01em] text-white/85 sm:mt-6 sm:text-[2.25rem]">
              {t("heroSubtitle")}
            </span>
          </h1>

          <div className="home-enter__item mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-7 sm:gap-3 [--enter-delay:160ms]">
            {featureBadges.map((badge) => (
              <div key={badge.icon} className="hero-pill">
                <span className="text-[#ff7c34]">{renderFeatureIcon(badge.icon)}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>

          <div className="home-enter__item mt-5 flex flex-row gap-2 sm:mt-10 sm:gap-3 [--enter-delay:360ms]">
            <Link href="/events" className="hero-primary-btn font-goldman px-4 py-2 text-xs sm:px-8 sm:py-4 sm:text-base">
              {t("heroBtnTickets")}
            </Link>
            <Link href="#trending" className="hero-secondary-btn px-4 py-2 text-center sm:px-8 sm:py-4">
              <span className="font-goldman text-xs sm:text-base">{t("heroBtnTrending")}</span>
            </Link>
          </div>

          {/* scroll indicator */}
          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 sm:hidden">
            <span className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-white/30">Scroll</span>
            <svg viewBox="0 0 16 24" className="h-4 w-3 text-white/20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 4v16M2 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

      <section
        id="trending"
        className="relative bg-[linear-gradient(180deg,#050608_0%,#090c12_100%)] px-4 pb-20 pt-20 sm:px-8 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-18 lg:pt-18"
      >
        <div className="mx-auto max-w-7xl">
          <CategoryMagicBento items={categoryTiles} />

          <div className="mt-14 flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-20">
            <p className="font-goldman text-xl font-bold text-white sm:text-3xl">{t("trendingEvents")}</p>
          </div>

          <TrendingParallaxGallery items={trendingGalleryItems} />
        </div>
      </section>

      <section
        id="upcoming-this-week"
        className="section-reveal week-events-section relative bg-[linear-gradient(180deg,#070a11_0%,#080b12_100%)] px-4 pb-12 pt-4 sm:px-8 sm:pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="week-events-header">
            <div className="week-events-header__title-wrap">
              <h2 className="week-events-header__title font-goldman">{t("thisWeek")}</h2>
            </div>
            <Link href="/events" className="week-events-header__cta font-bjcree text-[#ff7224] hover:text-[#ff9050]">
              {t("viewAll")} →
            </Link>
          </div>

          <div className="week-events-grid">
            {upcomingWeekEvents.map((event, index) => (
              <WeekEventCard key={`${event.title}-${index}`} event={event} />
            ))}
          </div>
        </div>
      </section>

      {resaleListings.length > 0 && (
        <section className="relative bg-[linear-gradient(180deg,#06080d_0%,#07091000%)] px-4 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="week-events-header">
              <div className="week-events-header__title-wrap">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Хоёрдогч зах зээл</p>
                <h2 className="week-events-header__title font-goldman">Resale Тасалбарууд</h2>
              </div>
              <Link href="/login" className="week-events-header__cta font-bjcree text-[#ff7224] hover:text-[#ff9050]">
                Бүгдийг харах →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resaleListings.map((listing) => {
                const thumb = listing.event.cardImageUrl ?? listing.event.imageUrl ?? "/uploads/1.jpg";
                const total = toNumber(listing.askPrice) + toNumber(listing.buyerFee);
                const d = new Date(listing.event.startsAt);
                const datePrimary = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d).toUpperCase();
                const dateSecondary = new Intl.DateTimeFormat("en-US", { weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
                const formattedPrice = listing.event.currency === "MNT"
                  ? `${new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(total)}₮`
                  : formatCurrency(total, listing.event.currency);
                return (
                  <Link
                    key={listing.id}
                    href={`/resale/${listing.id}` as never}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0d1017] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(255,114,36,0.2),0_28px_56px_rgba(0,0,0,0.55)]"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <Image
                        src={thumb}
                        alt={listing.event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/15 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
                        {listing.event.category.name}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-white/40">
                        <span>{datePrimary}</span>
                        <span className="text-white/20">·</span>
                        <span className="truncate">{dateSecondary}</span>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="line-clamp-2 font-goldman text-[1.05rem] font-bold leading-snug text-white">
                          {listing.event.title}
                        </h3>
                        <p className="truncate text-xs text-white/40">
                          {listing.event.venue.name}, {listing.event.venue.city}
                        </p>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                        <p className="font-goldman text-lg font-bold text-white">{formattedPrice}</p>
                        <span className="rounded-xl bg-[#ff7224] px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,114,36,0.28)] transition-all duration-200 group-hover:bg-[#ff8442] group-hover:shadow-[0_10px_26px_rgba(255,114,36,0.42)]">
                          Авах
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="relative bg-[linear-gradient(180deg,#06080d_0%,#070a11_100%)] px-4 pb-14 pt-10 sm:px-8 sm:pb-24 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="week-events-header">
            <div className="week-events-header__title-wrap">
              <h2 className="week-events-header__title font-goldman">{t("highlightsTitle")}</h2>
            </div>
          </div>
          <HighlightsToggle events={highlightEvents} />
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#090c12_0%,#06080d_100%)] px-4 pb-24 pt-8 sm:px-8 sm:pb-28 sm:pt-12 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="week-events-header__title font-goldman">{t("howTitle")}</h2>
          </div>

          <div className="how-it-works-shell mt-14">
            <div className="how-it-works-line" />
            {howItWorksSteps.map((step, index) => (
              <div key={`${step.icon}-${index}`} className="how-it-works-step">
                <div className="how-it-works-orb">{renderHowItWorksIcon(step.icon)}</div>
                <h3 className="how-it-works-title">{step.title}</h3>
                <p className="how-it-works-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#070a11_0%,#060810_100%)] px-4 pb-24 pt-16 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="week-events-header__title font-goldman">{t("faqTitle")}</h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-[1.5rem] bg-white/[0.04] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.08)] transition-all duration-200 open:bg-white/[0.07] open:shadow-[inset_0_0_0_1.5px_rgba(255,114,36,0.18)]"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-7 py-5 text-base font-semibold text-white list-none sm:text-lg">
                  {item.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-base text-white/50 transition duration-200 group-open:rotate-45 group-open:bg-[#ff7224]/20 group-open:text-[#ff7224]">＋</span>
                </summary>
                <p className="px-7 pb-6 text-sm leading-7 text-white/52 sm:text-base sm:leading-8">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

function renderFeatureIcon(kind: "qr" | "shield" | "bell") {
  if (kind === "qr") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h5v5H4z" /><path d="M15 4h5v5h-5z" /><path d="M4 15h5v5H4z" />
        <path d="M17 15v2" /><path d="M15 17h2" /><path d="M19 19h1" /><path d="M19 15v1" />
        <path d="M11 4v3" /><path d="M11 17h3" />
      </svg>
    );
  }
  if (kind === "shield") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 5 6v6c0 5 3.4 7.9 7 9 3.6-1.1 7-4 7-9V6l-7-3Z" />
        <path d="m9.5 12 1.8 1.8 3.7-3.8" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function renderHowItWorksIcon(kind: "search" | "seat" | "ticket" | "qr" | "notify") {
  if (kind === "search") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" />
      </svg>
    );
  }
  if (kind === "seat") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 12V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4" />
        <path d="M5 12h14v4H5z" /><path d="M7 16v2" /><path d="M17 16v2" />
      </svg>
    );
  }
  if (kind === "ticket") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" /><path d="M12 6v12" />
      </svg>
    );
  }
  if (kind === "qr") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h5v5H4z" /><path d="M15 4h5v5h-5z" /><path d="M4 15h5v5H4z" />
        <path d="M15 15h2" /><path d="M19 15h1" /><path d="M17 17h3" /><path d="M15 19h2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" /><path d="m9.5 10.5 1.5 1.5 3.5-3.5" />
    </svg>
  );
}
