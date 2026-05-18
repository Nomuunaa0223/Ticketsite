import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResalePage() {
  const user = await requireUser();

  const allListings = await prisma.resaleListing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { listedAt: "desc" },
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          startsAt: true,
          currency: true,
          imageUrl: true,
          cardImageUrl: true,
          venue: { select: { name: true, city: true } },
          category: { select: { name: true } },
        },
      },
      ticketType: { select: { name: true } },
      seller: { select: { fullName: true } },
    },
  });

  const myListings = allListings.filter((l) => l.sellerId === user.id);
  const otherListings = allListings.filter((l) => l.sellerId !== user.id);

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-14">

        {/* My listings */}
        {myListings.length > 0 && (
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
              Миний жагсаалт
            </p>
            <h2 className="mt-2 font-goldman text-xl font-bold text-white sm:text-2xl">
              Би зарж буй тасалбарууд
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} isMine />
              ))}
            </div>
          </div>
        )}

        {/* All other listings */}
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
            Хоёрдогч зах зээл
          </p>
          <h1 className="mt-2 font-goldman text-2xl font-bold text-white sm:text-3xl">
            Resale Тасалбарууд
          </h1>

          {otherListings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/30">
              Одоогоор resale тасалбар байхгүй байна.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} isMine={false} />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

type Listing = {
  id: number;
  askPrice: { toNumber(): number } | number;
  buyerFee: { toNumber(): number } | number;
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
  seller: { fullName: string };
};

function ListingCard({ listing, isMine }: { listing: Listing; isMine: boolean }) {
  const thumb = listing.event.cardImageUrl ?? listing.event.imageUrl;
  const totalPrice = toNumber(listing.askPrice) + toNumber(listing.buyerFee);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-[#0e1424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-white/[0.04]">
        {thumb ? (
          <Image
            src={thumb}
            alt={listing.event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full w-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424]/80 to-transparent" />
        {isMine && (
          <span className="absolute left-3 top-3 rounded-full bg-[#ff7224]/20 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#ff7224]">
            Миний
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/30">
            {listing.event.category.name}
          </p>
          <p className="mt-1 line-clamp-2 text-base font-bold text-white">
            {listing.event.title}
          </p>
          <p className="mt-0.5 text-xs text-white/40">{listing.ticketType.name}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-[0.7rem] text-white/40">
          <span>{formatDateTime(listing.event.startsAt)}</span>
          <span>·</span>
          <span>{listing.event.venue.name}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-[0.6rem] text-white/30">үнэ</p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(totalPrice, listing.event.currency)}
            </p>
          </div>
          {isMine ? (
            <span className="rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/40">
              Зарагдаж байна
            </span>
          ) : (
            <Link
              href={`/resale/${listing.id}` as never}
              className="rounded-xl bg-[#ff7224] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff8c42]"
            >
              Авах
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
