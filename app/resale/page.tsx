import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResalePage() {
  await requireUser();

  const listings = await prisma.resaleListing.findMany({
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

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
            Хоёрдогч зах зээл
          </p>
          <h1 className="mt-2 font-goldman text-2xl font-bold text-white sm:text-3xl">
            Resale Тасалбарууд
          </h1>
          
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/30">
            Одоогоор resale тасалбар байхгүй байна.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const thumb = listing.event.cardImageUrl ?? listing.event.imageUrl;
              const totalPrice = toNumber(listing.askPrice) + toNumber(listing.buyerFee);

              return (
                <div
                  key={listing.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-[#0e1424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                >
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
                    
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                     
                      <p className="mt-1 line-clamp-2 text-lg font-bold text-white">
                        {listing.event.title}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {listing.ticketType.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[0.7rem] text-white/40">
                      <span>{formatDateTime(listing.event.startsAt)}</span>
                      <span>·</span>
                      <span>{listing.event.venue.name}</span>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[0.6rem] text-white/30">үнэ</p>
                        <p className="text-lg font-bold text-[#ffffff]">
                          {formatCurrency(totalPrice, listing.event.currency)}
                        </p>
                      </div>
                      <Link
                        href={`/resale/${listing.id}`}
                        className="rounded-xl bg-[#ff7224] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#ff8c42]"
                      >
                        Авах
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
