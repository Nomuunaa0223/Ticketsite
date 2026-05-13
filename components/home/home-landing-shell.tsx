"use client";

import Link from "next/link";
import { useLang } from "@/components/layout/lang-context";
import { CategoryMagicBento } from "@/components/home/category-magic-bento";
import { HeroParallaxImage } from "@/components/home/hero-parallax-image";
import { HighlightsToggle, type HighlightEvent } from "@/components/home/highlights-toggle";
import { TrendingParallaxGallery, type TrendingParallaxGalleryItem } from "@/components/home/trending-parallax-gallery";
import { WeekEventCard, type WeekEventCardItem } from "@/components/home/week-event-card";

type Props = {
  highlightEvents: HighlightEvent[];
  trendingGalleryItems: TrendingParallaxGalleryItem[];
  upcomingWeekEvents: WeekEventCardItem[];
};

export function HomeLandingShell({ highlightEvents, trendingGalleryItems, upcomingWeekEvents }: Props) {
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
      <section className="home-enter relative min-h-[calc(100vh-5.5rem)] overflow-hidden bg-[#06070d]">
        <HeroParallaxImage />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,18,0.1)_0%,rgba(7,10,18,0.32)_20%,rgba(5,6,10,0.66)_58%,rgba(4,4,6,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,135,55,0.18),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(255,109,31,0.1),transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(8,12,23,0.85)_0%,rgba(8,12,23,0)_100%)]" />

        <div className="relative px-4 pb-12 pt-10 sm:px-8 lg:px-12 lg:pt-16">
          <div className="mx-auto flex min-h-[calc(100vh-11rem)] max-w-5xl flex-col items-center justify-center text-center">
            <h1 className="home-enter__item max-w-4xl text-balance font-goldman text-4xl font-bold leading-[1.16] tracking-[-0.04em] text-white sm:text-5xl lg:text-[4rem]">
              <span className="block">{t("heroTitle")}</span>
              <span className="mt-6 block text-3xl font-semibold tracking-[-0.02em] text-white/90 sm:text-[2.25rem]">
                {t("heroSubtitle")}
              </span>
            </h1>

            <div className="home-enter__item mt-7 flex flex-wrap items-center justify-center gap-3 text-sm text-[#ffd9c5] sm:text-[0.95rem] [--enter-delay:160ms]">
              {featureBadges.map((badge) => (
                <div key={badge.icon} className="hero-pill">
                  <span className="text-[#ff7c34]">{renderFeatureIcon(badge.icon)}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>

            <div className="home-enter__item mt-10 flex flex-col gap-3 sm:flex-row [--enter-delay:360ms]">
              <Link href="/events" className="hero-primary-btn font-goldman px-8 py-4">
                {t("heroBtnTickets")}
              </Link>
              <Link href="#trending" className="hero-secondary-btn px-8 py-4">
                <span className="font-goldman">{t("heroBtnTrending")}</span>
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
            <p className="font-goldman text-4xl font-bold text-white">{t("trendingEvents")}</p>
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
              <h2 className="week-events-header__title font-goldman">{t("thisWeek")}</h2>
            </div>
            <Link href="/events" className="week-events-header__cta">
              {t("viewAll")}
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
            <p className="font-goldman text-sm font-medium uppercase tracking-[0.24em]">{t("howTitle")}</p>
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

      <section className="relative bg-[linear-gradient(180deg,#06080d_0%,#070a11_100%)] px-4 pb-24 pt-16 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-goldman text-base font-bold text-white sm:text-lg">
              {t("highlightsTitle")}
            </h2>
            <Link href="/events" className="text-sm font-semibold text-white/40 transition hover:text-white">
              {t("viewAll")}
            </Link>
          </div>
          <HighlightsToggle events={highlightEvents} />
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#070a11_0%,#060810_100%)] px-4 pb-24 pt-16 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="font-goldman text-3xl font-bold text-white">{t("faqTitle")}</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item) => (
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

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#060810_0%,#04050b_100%)] px-4 py-24 sm:px-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,114,36,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">Tixora</p>
          <h2 className="mt-3 font-goldman text-3xl font-bold leading-tight text-white sm:text-4xl">
            {t("footerCta")}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/48">
            {t("footerCtaDesc")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="hero-primary-btn px-8 py-4">
              {t("signupBtn")}
            </Link>
            <Link href="/events" className="hero-secondary-btn px-8 py-4">
              {t("footerBrowse")}
            </Link>
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
