import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";
import { ResalePurchaseButton } from "@/components/resale/resale-purchase-button";

type Props = { params: Promise<{ listingId: string }> };

export default async function ResaleCheckoutPage({ params }: Props) {
  const { listingId } = await params;
  const id = Number(listingId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const user = await requireUser();

  const listing = await prisma.resaleListing.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          venue: true,
          category: true,
        },
      },
      ticketType: true,
      seller: { select: { fullName: true } },
    },
  });

  if (!listing || listing.status !== "ACTIVE") notFound();
  if (listing.sellerId === user.id) redirect("/resale");

  const thumb = listing.event.cardImageUrl ?? listing.event.imageUrl;
  const askPrice = toNumber(listing.askPrice);
  const buyerFee = toNumber(listing.buyerFee);
  const total = askPrice + buyerFee;
  const currency = listing.event.currency;

  return (
    <section className="min-h-screen bg-[#07080d] px-3 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-lg">

        {/* Back */}
        <a href="/resale" className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white/70">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Resale жагсаалт
        </a>

        <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d1017] shadow-[0_32px_80px_rgba(0,0,0,0.5)]">

          {/* Event image */}
          <div className="relative h-48 w-full overflow-hidden bg-white/[0.04]">
            {thumb ? (
              <Image src={thumb} alt={listing.event.title} fill className="object-cover" sizes="100vw" />
            ) : (
              <div className="h-full w-full bg-white/[0.04]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/40 to-transparent" />
            <div className="absolute bottom-4 left-5">
              <span className="rounded-full bg-[#ff7224]/20 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#ff7224]">
                Resale
              </span>
            </div>
          </div>

          {/* Event info */}
          <div className="px-4 pb-4 pt-5 sm:px-6">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/30">
              {listing.event.category.name}
            </p>
            <h1 className="mt-1 font-goldman text-xl font-bold text-white leading-tight">
              {listing.event.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/40 sm:gap-3">
              <span>{formatDateTime(listing.event.startsAt)}</span>
              <span>·</span>
              <span className="min-w-0 break-words">{listing.event.venue.name}, {listing.event.venue.city}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-dashed border-white/[0.07] sm:mx-6" />

          {/* Ticket info */}
          <div className="space-y-3 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-white/50">Тасалбарын төрөл</span>
              <span className="break-words font-semibold text-white sm:text-right">{listing.ticketType.name}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-white/50">Зарагч</span>
              <span className="break-words font-semibold text-white sm:text-right">{listing.seller.fullName}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-dashed border-white/[0.07] sm:mx-6" />

          {/* Price breakdown */}
          <div className="space-y-2 px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="text-white/50">Тасалбарын үнэ</span>
              <span className="text-right text-white">{formatCurrency(askPrice, currency)}</span>
            </div>
            {buyerFee > 0 && (
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-white/50">Үйлчилгээний хураамж</span>
                <span className="text-right text-white">{formatCurrency(buyerFee, currency)}</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 border-t border-white/[0.06] pt-2">
              <span className="font-bold text-white">Нийт дүн</span>
              <span className="text-right text-lg font-bold text-[#ff7224]">{formatCurrency(total, currency)}</span>
            </div>
          </div>

          {/* QR info */}
          <div className="mx-4 mb-5 rounded-xl bg-white/[0.04] px-4 py-3 sm:mx-6">
            <p className="text-xs text-white/40 leading-relaxed">
              Худалдаж авсны дараа <span className="text-white/70 font-semibold">шинэ QR код</span> автоматаар үүсч таны профайл дээр харагдана. Хуучин эзэмшигчийн QR хүчингүй болно.
            </p>
          </div>

          {/* Purchase button */}
          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <ResalePurchaseButton listingId={listing.id} total={formatCurrency(total, currency)} />
          </div>

        </div>
      </div>
    </section>
  );
}
