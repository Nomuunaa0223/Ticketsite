import { EventCard } from "@/components/cards/event-card";
import { requireUser } from "@/lib/auth";
import { getCurrentLang } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyResalePage() {
  const user = await requireUser();
  const lang = await getCurrentLang();
  const labels = lang === "mn"
    ? {
        title: "Миний resale",
        empty: "Одоогоор resale хийсэн ticket байхгүй байна.",
        onResale: "RESALE ДЭЭР",
        sold: "ЗАРАГДСАН",
        listedPrice: "Оруулсан үнэ",
        fee: "Хураамж",
        payout: "Танд орох дүн",
        viewTickets: "Тасалбар харах"
      }
    : {
        title: "My Resale",
        empty: "You have not listed any resale tickets yet.",
        onResale: "ON RESALE",
        sold: "SOLD",
        listedPrice: "Listed price",
        fee: "Fee",
        payout: "Payout",
        viewTickets: "View Tickets"
      };
  const listings = await prisma.resaleListing.findMany({
    where: {
      sellerId: user.id,
      status: { in: ["ACTIVE", "SOLD"] }
    },
    orderBy: { listedAt: "desc" },
    take: 12,
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          startsAt: true,
          currency: true,
          imageUrl: true,
          cardImageUrl: true,
          category: { select: { name: true, slug: true } },
          venue: { select: { name: true, city: true } }
        }
      },
      ticketType: { select: { name: true, price: true } },
      ticket: { select: { code: true } }
    }
  });

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="mt-2 font-goldman text-2xl font-bold text-white sm:ml-16 sm:text-3xl">{labels.title}</h1>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/40">
              {labels.empty}
            </div>
          ) : (
            listings.map((listing) => {
              const sellerFee = toNumber(listing.sellerFee);
              const payout = Math.max(0, toNumber(listing.askPrice) - sellerFee);

              return (
                <div key={listing.id} className="relative">
                  <EventCard
                    event={{
                      ...listing.event,
                      summary: `${listing.ticketType.name} · ${formatDateTime(listing.event.startsAt)}`,
                      ticketTypes: [{ price: listing.askPrice }]
                    }}
                    ctaLabel={labels.viewTickets}
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] ${
                      listing.status === "ACTIVE" ? "bg-[#ffb000]/18 text-[#ffe3a3]" : "bg-emerald-400/16 text-emerald-300"
                    }`}
                  >
                    {listing.status === "ACTIVE" ? labels.onResale : labels.sold}
                  </span>
                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/20 p-3 text-xs text-white/48">
                    <div className="flex items-center justify-between gap-3">
                      <span>{labels.listedPrice}</span>
                      <span className="font-bold text-white">{formatCurrency(listing.askPrice, listing.event.currency)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span>{labels.fee}</span>
                      <span>{formatCurrency(sellerFee, listing.event.currency)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-white/72">
                      <span>{labels.payout}</span>
                      <span className="font-bold">{formatCurrency(payout, listing.event.currency)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
