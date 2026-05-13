import Link from "next/link";
import Image from "next/image";

type TrendingEvent = {
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

type Props = {
  events: TrendingEvent[];
};

export function TrendingEventsShowcase({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
            Featured
          </p>
          <h2 className="mt-1 font-goldman text-3xl font-bold text-white">
            Trending Events
          </h2>
        </div>
        <Link
          href="/events"
          className="shrink-0 text-sm font-semibold text-white/40 transition hover:text-white"
        >
          View all
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-5">
        {events.map((event, index) => (
          <TrendingCard key={event.id} event={event} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}

function TrendingCard({
  event,
  rank,
}: {
  event: TrendingEvent;
  rank: number;
}) {
  const imageSrc = event.imageUrl ?? event.cardImageUrl ?? "/uploads/1.jpg";
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
  }).format(new Date(event.startsAt));

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex min-w-[220px] flex-col overflow-hidden rounded-2xl bg-[#0d1017] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)] sm:min-w-0"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={imageSrc}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 220px, (max-width: 1024px) 50vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/20 to-transparent" />
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-[#ff7224] text-sm font-black text-white shadow-[0_8px_24px_rgba(255,114,36,0.45)]">
          {rank}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#ff7224]">
          {event.category.name}
        </span>
        <h3 className="line-clamp-2 font-goldman text-sm font-bold leading-tight text-white">
          {event.title}
        </h3>
        <p className="text-xs text-white/40">
          {event.venue.city} · {dateLabel}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
          <p className="font-goldman text-sm font-bold text-white">
            {startingPrice > 0 ? formattedPrice : "Free"}
          </p>
          <span className="rounded-lg bg-[#ff7224]/15 px-3 py-1 text-[0.65rem] font-bold text-[#ff7224] transition group-hover:bg-[#ff7224] group-hover:text-white">
            Tickets
          </span>
        </div>
      </div>
    </Link>
  );
}
