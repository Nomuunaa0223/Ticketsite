import Link from "next/link";
import { TrendingParallaxGallery } from "@/components/home/trending-parallax-gallery";
import type { TrendingParallaxGalleryItem } from "@/components/home/trending-parallax-gallery";
import type { WeekEventCardItem } from "@/components/home/week-event-card";
import { WeekEventCard } from "@/components/home/week-event-card";
import { CategoryMagicBento } from "@/components/home/category-magic-bento";
import { HeroSearchBar } from "@/components/home/hero-search-bar";

const categoryBentoItems = [
  { label: "Sports", slug: "sports", icon: "sports" },
  { label: "Music", slug: "music", icon: "music" },
  { label: "Theater & Arts", slug: "theater-arts", icon: "theatre" },
  { label: "Comedy", slug: "comedy", icon: "comedy" },
  { label: "Festival", slug: "festival", icon: "festival" },
  { label: "Conference", slug: "conference", icon: "conference" },
] as const;

type Props = {
  trendingGalleryItems: TrendingParallaxGalleryItem[];
  upcomingWeekEvents: WeekEventCardItem[];
};

export function LandingPageContent({
  trendingGalleryItems,
  upcomingWeekEvents,
}: Props) {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-5 pb-12 pt-24 sm:px-8 sm:pt-32 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#ff7224]/20 bg-[#ff7224]/10 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#ff7224]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff7224]" />
            Live Event Ticketing
          </p>
          <h1 className="mt-6 font-goldman text-4xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
            Feel the live experience.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/52 sm:text-lg">
            Your next great night is waiting for you.
          </p>

          <HeroSearchBar />

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="rounded-full bg-[#ff7224] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_32px_rgba(255,114,36,0.4)] transition hover:bg-[#ff8442] hover:shadow-[0_0_48px_rgba(255,114,36,0.55)]"
            >
              Get Tickets
            </Link>
            <Link
              href="/events"
              className="rounded-full border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white/80 backdrop-blur-sm transition hover:bg-white/[0.08] hover:text-white"
            >
              Trending events
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {[
              { label: "QR Verification" },
              { label: "Resale Protection" },
              { label: "Live Notification" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-[0.72rem] font-semibold text-white/38"
              >
                <span className="h-1 w-1 rounded-full bg-[#ff7224]" />
                {badge.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Gallery */}
      {trendingGalleryItems.length > 0 && (
        <section className="py-6">
          <TrendingParallaxGallery items={trendingGalleryItems} />
        </section>
      )}

      {/* This Week Section */}
      {upcomingWeekEvents.length > 0 && (
        <section className="px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
                  Upcoming
                </p>
                <h2 className="mt-1 font-goldman text-3xl font-bold text-white">
                  This Month
                </h2>
              </div>
              <Link
                href="/events"
                className="shrink-0 text-sm font-semibold text-white/40 transition hover:text-white"
              >
                View All
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingWeekEvents.map((event) => (
                <WeekEventCard key={event.href} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Bento Section */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
              Browse
            </p>
            <h2 className="mt-1 font-goldman text-3xl font-bold text-white">
              Find Events by Category
            </h2>
          </div>
          <CategoryMagicBento items={categoryBentoItems} />
        </div>
      </section>

      {/* How It Works */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
              Simple
            </p>
            <h2 className="mt-1 font-goldman text-3xl font-bold text-white">
              How It Works
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                step: "01",
                title: "Find an Event",
                desc: "Discover the event that interests you.",
              },
              {
                step: "02",
                title: "Choose Your Seat",
                desc: "Browse the layout and pick the seat that suits you.",
              },
              {
                step: "03",
                title: "Buy a Ticket",
                desc: "Purchase your ticket with a simple payment method.",
              },
              {
                step: "04",
                title: "Scan QR",
                desc: "Scan your ticket QR code at the entrance.",
              },
              {
                step: "05",
                title: "Enjoy + Notify!",
                desc: "Enjoy the event and receive useful notifications.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              >
                <p className="font-goldman text-3xl font-bold text-[#ff7224]/30">
                  {item.step}
                </p>
                <p className="mt-3 font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/42">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
              Support
            </p>
            <h2 className="mt-1 font-goldman text-3xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "What is TIXORA?",
                a: "Tixora is a smart ticketing platform designed to easily find, book, and enjoy events.",
              },
              {
                q: "How do I buy a ticket?",
                a: "Select your event, mark your seat, and pay securely in just a few steps.",
              },
              {
                q: "Can I cancel or get a refund?",
                a: "Refunds and cancellations depend on the organizer's policy for that event.",
              },
              {
                q: "How does resale work?",
                a: "Click Sell Ticket, set your price, and your ticket will be listed on the marketplace.",
              },
              {
                q: "Is resale safe?",
                a: "Yes. All transactions happen within the Tixora system, protecting users from fake tickets.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              >
                <p className="font-semibold text-white">{faq.q}</p>
                <p className="mt-2 text-sm leading-6 text-white/52">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
