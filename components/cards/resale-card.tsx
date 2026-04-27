import type { ResaleStatus } from "@prisma/client";
import Link from "next/link";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type ResaleCardProps = {
  listing: {
    id: string;
    status: ResaleStatus;
    askPrice: unknown;
    buyerFee: unknown;
    listedAt: Date | string;
    soldAt?: Date | string | null;
    seller: { fullName: string };
    ticketType: { name: string };
    event: {
      title: string;
      slug: string;
      currency: string;
      category: { name: string };
      venue: { name: string; city: string };
    };
  };
};

export function ResaleCard({ listing }: ResaleCardProps) {
  const askPrice = toNumber(listing.askPrice);
  const buyerFee = toNumber(listing.buyerFee);
  const total = askPrice + buyerFee;

  return (
    <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-black/45">
            {listing.event.category.name}
          </p>
          <h2 className="font-serif text-3xl text-ink">{listing.event.title}</h2>
          <p className="text-sm text-black/65">
            {listing.ticketType.name} | {listing.event.venue.name}, {listing.event.venue.city}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${
            listing.status === "ACTIVE"
              ? "bg-white/10 text-accent"
              : "bg-white/5 text-black/60"
          }`}
        >
          {listing.status === "ACTIVE" ? "Available now" : "Sold"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Ask price</p>
          <p className="mt-2 text-lg font-semibold text-ink">
            {formatCurrency(askPrice, listing.event.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Buyer fee</p>
          <p className="mt-2 text-lg font-semibold text-ink">
            {formatCurrency(buyerFee, listing.event.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Total</p>
          <p className="mt-2 text-lg font-semibold text-ink">
            {formatCurrency(total, listing.event.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Seller</p>
          <p className="mt-2 text-sm font-medium text-black/75">{listing.seller.fullName}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
        <p className="text-sm text-black/60">
          Listed {formatDateTime(listing.listedAt)}
          {listing.soldAt ? ` | Sold ${formatDateTime(listing.soldAt)}` : ""}
        </p>
        <Link
          href={`/events/${listing.event.slug}`}
          className="rounded-full border border-black/10 px-4 py-2 text-sm text-black/75 transition hover:bg-white/10"
        >
          View event
        </Link>
      </div>
    </div>
  );
}
