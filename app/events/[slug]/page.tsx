import { notFound } from "next/navigation";
import Image from "next/image";
import { VenueMapPreview } from "@/components/events/venue-map-preview";
import { OrderPanel } from "@/components/tickets/order-panel";
import { getEventBySlug, getTicketTypeCards } from "@/lib/events";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

const categoryImages: Record<string, string> = {
  sports: "/uploads/1.jpg",
  music: "/uploads/2.jpg",
  "theater-arts": "/uploads/3.jpg",
  comedy: "/uploads/4.jpg",
  festival: "/uploads/5.jpg",
  conference: "/uploads/1.jpg"
};

const slugImages: Record<string, string> = {
  "summit-finals-2026": "/uploads/1.jpg",
  "basketball-league-night": "/uploads/2.jpg",
  "football-cup-2026": "/uploads/3.jpg",
  "neon-nights-concert": "/uploads/4.jpg",
  "acoustic-sessions-live": "/uploads/5.jpg",
  "rock-the-arena": "/uploads/1.jpg",
  "hamlet-reimagined": "/uploads/2.jpg",
  "contemporary-dance-gala": "/uploads/3.jpg",
  "art-exhibition-opening": "/uploads/4.jpg",
  "laugh-factory-live": "/uploads/5.jpg",
  "stand-up-showcase": "/uploads/1.jpg",
  "comedy-gala-2026": "/uploads/2.jpg",
  "summer-vibes-festival": "/uploads/3.jpg",
  "urban-street-fest": "/uploads/4.jpg",
  "horizon-music-festival": "/uploads/5.jpg",
  "techforward-summit": "/uploads/1.jpg",
  "startup-founders-day": "/uploads/2.jpg",
  "design-ux-conference": "/uploads/3.jpg"
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const ticketTypes = await getTicketTypeCards(event.id);
  const orderTicketTypes = ticketTypes.map((ticketType) => ({
    id: ticketType.id,
    name: ticketType.name,
    description: ticketType.description,
    price: toNumber(ticketType.price),
    quantityTotal: ticketType.quantityTotal,
    quantitySold: ticketType.quantitySold,
    maxPerOrder: ticketType.maxPerOrder
  }));

  const categorySlug = event.category.slug ?? "";
  const heroImage = event.imageUrl ?? slugImages[event.slug] ?? categoryImages[categorySlug] ?? "/uploads/1.jpg";
  const venueLine = `${event.venue.name}, ${event.venue.city}`;
  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#05070c_0%,#0a0f18_55%,#06080d_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="bg-[#0a0f17] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
          <div className="relative h-[22rem] overflow-hidden sm:h-[28rem] lg:h-[33rem]">
            <Image
              src={heroImage}
              alt={event.title}
              fill
              priority
              quality={75}
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(21rem,27rem)] lg:p-6">
            <div className="grid gap-6">
              <div className="rounded-[1rem] bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <h1 className="max-w-3xl font-goldman text-3xl font-bold leading-tight text-white sm:text-5xl">
                  {event.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/74 sm:text-base">
                  {event.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-[0.75rem] text-white/70 sm:text-sm">
                  <div className="inline-flex items-center gap-2">
                    <EventMetaIcon kind="calendar" />
                    <span>{formatDateTime(event.startsAt)}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <EventMetaIcon kind="clock" />
                    <span>{formatDateTime(event.endsAt)}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <EventMetaIcon kind="location" />
                    <span>{venueLine}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1rem] bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#ff8b46]">
                  About the experience
                </p>
                <p className="mt-4 text-sm leading-7 text-white/72 sm:text-[0.96rem]">
                  {event.description}
                </p>
              </div>

              <div className="event-detail-shell rounded-[1rem] p-5">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#ff8b46]">
                  Venue Preview
                </p>
                <div className="mt-4">
                  <VenueMapPreview
                    name={event.venue.name}
                    latitude={event.venue.latitude}
                    longitude={event.venue.longitude}
                  />
                </div>
              </div>

            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <OrderPanel
                currency={event.currency}
                salesEndsAt={event.saleEndsAt.toISOString()}
                ticketTypes={orderTicketTypes}
                className="h-fit"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EventMetaIcon({ kind }: { kind: "calendar" | "clock" | "location" }) {
  if (kind === "calendar") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "clock") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}
