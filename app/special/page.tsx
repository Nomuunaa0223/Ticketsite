import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SpecialPage() {
  const events = await prisma.event.findMany({
    where: { aiGenerated: true, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      venue: true,
      ticketTypes: { orderBy: { price: "asc" } },
    },
  });

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-14">

        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
            Tixy AI
          </p>
          <h1 className="mt-2 font-goldman text-2xl font-bold text-white sm:text-3xl">
            Special Events
          </h1>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-sm text-white/30">
            Одоогоор AI арга хэмжээ байхгүй байна.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const thumb = event.cardImageUrl ?? event.imageUrl;
              const startingPrice = event.ticketTypes.length
                ? Math.min(...event.ticketTypes.map((t) => toNumber(t.price)))
                : 0;

              return (
                <div key={event.id} className="group flex flex-col overflow-hidden rounded-2xl bg-[#0e1424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                  <div className="relative h-40 w-full overflow-hidden bg-white/[0.04]">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={event.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/[0.04]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424]/80 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-violet-500/20 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-300">
                      AI Special
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/30">
                        {event.category.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-base font-bold text-white">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {event.ticketTypes[0]?.name ?? "General Admission"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[0.7rem] text-white/40">
                      <span>{formatDateTime(event.startsAt)}</span>
                      <span>·</span>
                      <span>{event.venue.name}</span>
                    </div>

                    <div className="mt-auto flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[0.6rem] text-white/30">үнэ</p>
                        <p className="break-words text-lg font-bold text-white">
                          {startingPrice > 0
                            ? formatCurrency(startingPrice, event.currency)
                            : "Үнэгүй"}
                        </p>
                      </div>
                      <Link
                        href={`/events/${event.slug}` as never}
                        className="w-full rounded-xl bg-[#ff7224] px-4 py-2 text-center text-xs font-bold text-white transition hover:bg-[#ff8c42] sm:w-auto"
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
