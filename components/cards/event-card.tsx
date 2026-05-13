import Link from "next/link";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type EventCardProps = {
  event: {
    title: string;
    slug: string;
    summary: string;
    currency: string;
    startsAt: Date | string;
    category: { name: string; slug?: string };
    venue: { name: string; city: string };
    ticketTypes: Array<{ price: unknown }>;
  };
  ctaLabel?: string;
};

const categoryVisuals: Record<string, string> = {
  music:
    "from-[#25061f] via-[#6f2033] to-[#120712] before:bg-[radial-gradient(circle_at_50%_34%,rgba(255,122,36,0.62),transparent_23%),linear-gradient(115deg,transparent_18%,rgba(58,205,255,0.8)_19%,transparent_21%),linear-gradient(245deg,transparent_20%,rgba(255,57,215,0.74)_21%,transparent_23%)]",
  sports:
    "from-[#06140e] via-[#163a28] to-[#070b08] before:bg-[radial-gradient(circle_at_50%_62%,rgba(255,149,55,0.4),transparent_28%),linear-gradient(0deg,rgba(255,255,255,0.11)_1px,transparent_1px)]",
  "theater-arts":
    "from-[#211102] via-[#8a5a17] to-[#120803] before:bg-[radial-gradient(circle_at_50%_18%,rgba(255,228,156,0.72),transparent_24%),linear-gradient(130deg,transparent_28%,rgba(255,214,125,0.24)_29%,transparent_45%)]",
  comedy:
    "from-[#210814] via-[#743147] to-[#090609] before:bg-[radial-gradient(circle_at_34%_35%,rgba(255,198,98,0.62),transparent_18%),radial-gradient(circle_at_64%_35%,rgba(255,115,36,0.5),transparent_18%)]",
  festival:
    "from-[#081617] via-[#18505a] to-[#050909] before:bg-[radial-gradient(circle_at_50%_40%,rgba(255,215,124,0.52),transparent_22%),linear-gradient(90deg,transparent_12%,rgba(255,255,255,0.18)_13%,transparent_14%)]",
  conference:
    "from-[#071225] via-[#173869] to-[#030711] before:bg-[radial-gradient(circle_at_50%_35%,rgba(85,171,255,0.52),transparent_24%),linear-gradient(120deg,transparent_24%,rgba(255,255,255,0.18)_25%,transparent_38%)]"
};

export function EventCard({ event, ctaLabel = "View Tickets" }: EventCardProps) {
  const prices = event.ticketTypes.map((ticketType) => toNumber(ticketType.price));
  const startingPrice = prices.length ? Math.min(...prices) : 0;
  const visual = categoryVisuals[event.category.slug ?? ""] ?? categoryVisuals.music;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="event-market-card group"
    >
      <div className={`event-market-card__visual bg-gradient-to-br ${visual}`}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.82)_100%)]" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-black/70 px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            {event.category.name}
          </span>
          <span className="rounded-full bg-[#ff7224] px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
            Published
          </span>
        </div>
        <div className="absolute inset-x-4 bottom-4">
          <h3 className="text-2xl font-bold leading-6 tracking-[-0.03em] text-white">{event.title}</h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/72">{event.summary}</p>
        </div>
      </div>

      <div className="event-market-card__body">
        <div className="space-y-2 text-[0.78rem] text-white/64">
          <p>{formatDateTime(event.startsAt)}</p>
          <p>
            {event.venue.name}, {event.venue.city}
          </p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/42">Starts from</p>
            <p className="mt-1 text-xl font-bold text-white">{formatCurrency(startingPrice, event.currency)}</p>
          </div>
          <span className="rounded-md bg-[#ff7224] px-3 py-2 text-[0.68rem] font-bold text-white transition group-hover:bg-[#ff8846]">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
