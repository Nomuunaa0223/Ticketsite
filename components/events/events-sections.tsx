import Link from "next/link";
import Image from "next/image";

type EventItem = {
  id: number;
  title: string;
  slug: string;
  imageUrl: string | null;
  cardImageUrl: string | null;
  summary: string | null;
  currency: string;
  startsAt: string;
  category: { name: string; slug: string };
  venue: { name: string; city: string };
  ticketTypes: { price: number }[];
};

type Section = {
  label: string;
  slug: string;
  events: EventItem[];
};

type Props = {
  sections: Section[];
};

export function EventsSections({ sections }: Props) {
  const populated = sections.filter((s) => s.events.length > 0);

  if (populated.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
        No events found.
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-16">
      {populated.map((section) => (
        <section key={section.slug} id={section.slug}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
                Category
              </p>
              <h2 className="mt-1 font-goldman text-3xl font-bold text-white">
                {section.label}
              </h2>
            </div>
            <Link
              href={`/events?category=${section.slug}`}
              className="shrink-0 text-sm font-semibold text-white/40 transition hover:text-white"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const imageSrc =
    event.cardImageUrl ?? event.imageUrl ?? "/uploads/1.jpg";
  const startingPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0;

  const formattedPrice =
    event.currency === "MNT"
      ? `${new Intl.NumberFormat("mn-MN", {
          maximumFractionDigits: 0,
        }).format(startingPrice)}₮`
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: event.currency,
          maximumFractionDigits: 0,
        }).format(startingPrice);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(event.startsAt));

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0d1017] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
    >
      <div className="relative h-44 overflow-hidden">
        <Image
          src={imageSrc}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/30 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/80 backdrop-blur-sm">
          {event.category.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-goldman text-base font-bold leading-tight text-white">
          {event.title}
        </h3>
        <p className="text-xs text-white/40">
          {event.venue.name}, {event.venue.city}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-white/35">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
          </svg>
          <span>{dateLabel}</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div>
            <p className="font-goldman text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/30">
              From
            </p>
            <p className="font-goldman text-base font-bold text-white">
              {startingPrice > 0 ? formattedPrice : "Free"}
            </p>
          </div>
          <span className="rounded-xl bg-[#ff7224] px-4 py-2 text-[0.7rem] font-bold text-white transition group-hover:bg-[#ff8442]">
            Get tickets
          </span>
        </div>
      </div>
    </Link>
  );
}
