import Link from "next/link";
import Image from "next/image";
import type { Lang } from "@/lib/i18n";

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
  lang: Lang;
  labels: {
    empty: string;
    free: string;
    getTickets: string;
  };
  categoryLabels: Record<string, string>;
};

export function EventsSections({ sections, lang, labels, categoryLabels }: Props) {
  const populated = sections.filter((s) => s.events.length > 0);

  if (populated.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
        {labels.empty}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-16">
      {populated.map((section) => (
        <section key={section.slug} id={section.slug} className="scroll-mt-36">
          <div className="mb-6">
            <div className="pb-4 sm:pl-16">
              <h2 className="font-goldman text-2xl font-bold text-white sm:text-3xl">
                {section.label}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.events.map((event) => (
              <EventCard key={event.id} event={event} lang={lang} labels={labels} categoryLabels={categoryLabels} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EventCard({
  event,
  lang,
  labels,
  categoryLabels,
}: {
  event: EventItem;
  lang: Lang;
  labels: Props["labels"];
  categoryLabels: Record<string, string>;
}) {
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

  const d = new Date(event.startsAt);
  const dateLocale = lang === "mn" ? "mn-MN" : "en-US";
  const datePrimary = new Intl.DateTimeFormat(dateLocale, { month: "short", day: "2-digit" }).format(d).toUpperCase();
  const dateSecondary = new Intl.DateTimeFormat(dateLocale, { weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0d1017] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgba(255,114,36,0.2),0_28px_56px_rgba(0,0,0,0.55)]"
    >
      {/* Image */}
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
          {categoryLabels[event.category.slug] ?? event.category.name}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-white/40">
          <span>{datePrimary}</span>
          <span className="text-white/20">·</span>
          <span className="truncate">{dateSecondary}</span>
        </div>

        <div className="flex flex-col ">
          <h3 className="line-clamp-2 font-goldman text-[1.05rem] font-bold leading-snug text-white">
            {event.title}
          </h3>
          <p className="truncate text-xs text-white/40">
            {event.venue.name}, {event.venue.city}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
          <p className="font-goldman text-lg font-bold text-white">
            {startingPrice > 0 ? formattedPrice : labels.free}
          </p>
          <span className="rounded-xl bg-[#ff7224] px-4 py-2.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,114,36,0.28)] transition-all duration-200 group-hover:bg-[#ff8442] group-hover:shadow-[0_10px_26px_rgba(255,114,36,0.42)]">
            {labels.getTickets}
          </span>
        </div>
      </div>
    </Link>
  );
}
