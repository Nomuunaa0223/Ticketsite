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

type Props = {
  query: string;
  events: EventItem[];
};

export function SearchResults({ query, events }: Props) {
  return (
    <div className="mt-8">
      <div className="mb-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
          Search results
        </p>
        <h2 className="mt-1 font-goldman text-2xl font-bold text-white">
          &ldquo;{query}&rdquo;
        </h2>
        <p className="mt-1 text-sm text-white/40">
          {events.length === 0
            ? "No events found"
            : `${events.length} event${events.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-sm text-white/30">
            Try a different keyword — artist, venue, or event name.
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block text-sm font-semibold text-[#ff7224] hover:text-[#ff8442]"
          >
            Browse all events →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <SearchEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchEventCard({ event }: { event: EventItem }) {
  const imageSrc = event.cardImageUrl ?? event.imageUrl ?? "/uploads/1.jpg";
  const startingPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0;

  const formattedPrice =
    event.currency === "MNT"
      ? `${new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(startingPrice)}₮`
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: event.currency,
          maximumFractionDigits: 0,
        }).format(startingPrice);

  const d = new Date(event.startsAt);
  const datePrimary = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" })
    .format(d)
    .toUpperCase();
  const dateSecondary = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0d1017] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(255,114,36,0.2),0_28px_56px_rgba(0,0,0,0.55)]"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={imageSrc}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/15 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/90 backdrop-blur-md">
          {event.category.name}
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
            {event.title}
          </h3>
          <p className="truncate text-xs text-white/40">
            {event.venue.name}, {event.venue.city}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
          <p className="font-goldman text-lg font-bold text-white">
            {startingPrice > 0 ? formattedPrice : "Free"}
          </p>
          <span className="rounded-xl bg-[#ff7224] px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,114,36,0.28)] transition-all duration-200 group-hover:bg-[#ff8442] group-hover:shadow-[0_10px_26px_rgba(255,114,36,0.42)]">
            Get tickets
          </span>
        </div>
      </div>
    </Link>
  );
}
