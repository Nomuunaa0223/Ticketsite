import { redirect } from "next/navigation";
import { requireExactRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizerShell } from "@/components/organizer/organizer-shell";
import { getPage, PaginationLinks } from "@/components/admin/pagination-links";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

const slugImages: Record<string, string> = {
  "summit-finals-2026": "/uploads/1.jpg",
  "basketball-league-night": "/uploads/2.jpg",
  "football-cup-2026": "/uploads/3.jpg",
  "neon-nights-concert": "/uploads/4.jpg",
  "acoustic-sessions-live": "/uploads/5.jpg",
  "rock-the-arena": "/uploads/1.jpg",
  "hamlet-reimagined": "/uploads/2.jpg",
  "contemporary-dance-gala": "/uploads/3.jpg",
  "art-exhibition-opening": "/uploads/4.jpg",
  "laugh-factory-live": "/uploads/5.jpg",
  "stand-up-showcase": "/uploads/1.jpg",
  "comedy-gala-2026": "/uploads/2.jpg",
  "summer-vibes-festival": "/uploads/3.jpg",
  "urban-street-fest": "/uploads/4.jpg",
  "horizon-music-festival": "/uploads/5.jpg",
  "techforward-summit": "/uploads/1.jpg",
  "startup-founders-day": "/uploads/2.jpg",
  "design-ux-conference": "/uploads/3.jpg",
};

const categoryImages: Record<string, string> = {
  sports: "/uploads/1.jpg",
  music: "/uploads/2.jpg",
  "theater-arts": "/uploads/3.jpg",
  comedy: "/uploads/4.jpg",
  festival: "/uploads/5.jpg",
  conference: "/uploads/1.jpg",
};

function getImage(slug: string, categorySlug: string, cardImageUrl?: string | null, imageUrl?: string | null) {
  return cardImageUrl ?? imageUrl ?? slugImages[slug] ?? categoryImages[categorySlug] ?? "/uploads/1.jpg";
}

function getStatusClasses(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-400/16 text-emerald-300";
  if (status === "PENDING_REVIEW") return "bg-amber-400/16 text-amber-300";
  if (status === "REJECTED") return "bg-red-400/16 text-red-300";
  return "bg-white/10 text-white/60";
}

const PAGE_SIZE = 9;

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function OrganizerDashboardPage({ searchParams }: Props) {
  const user = await requireExactRole("ORGANIZER");
  if (!user.organizerProfile) redirect("/");

  const page = getPage((await searchParams).page);
  const ownerFilter = { organizerId: user.organizerProfile.id, createdById: user.id };
  const [myEvents, totalEvents, totalDraft, totalApproved, totalPending] = await Promise.all([
    prisma.event.findMany({
      where: ownerFilter,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { venue: true, category: true, ticketTypes: true }
    }),
    prisma.event.count({ where: ownerFilter }),
    prisma.event.count({ where: { ...ownerFilter, status: "DRAFT" } }),
    prisma.event.count({ where: { ...ownerFilter, status: "PUBLISHED" } }),
    prisma.event.count({ where: { ...ownerFilter, status: "PENDING_REVIEW" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalEvents / PAGE_SIZE));

  const stats = [
    { label: "My events", value: totalEvents },
    { label: "Approved", value: totalApproved },
    { label: "Pending review", value: totalPending },
    { label: "Draft", value: totalDraft },
  ];

  return (
    <OrganizerShell user={user}>
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-[#0f1629] p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/38">{stat.label}</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-[#ff8b3d]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Catalog</p>
          <h2 className="mt-1 font-goldman text-xl font-bold text-white">My events</h2>

          {myEvents.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
              You have not created any events yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {myEvents.map((event) => {
                const img = getImage(event.slug, event.category.slug ?? "", event.cardImageUrl, event.imageUrl);
                const prices = event.ticketTypes.map((t) => toNumber(t.price));
                const startingPrice = prices.length ? Math.min(...prices) : 0;
                const totalSeats = event.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantityTotal, 0);
                const soldSeats = Math.min(
                  totalSeats,
                  event.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantitySold, 0)
                );
                const remainingSeats = Math.max(0, totalSeats - soldSeats);

                return (
                  <div key={event.id} className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#0d1017] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={img}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/30 to-transparent" />
                      <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] ${getStatusClasses(event.status)}`}>
                        {event.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="font-goldman text-base font-bold leading-tight text-white">{event.title}</h3>
                      <p className="text-xs text-white/40">{event.category.name} / {event.venue.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-white/35">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                        </svg>
                        <span>{formatDateTime(event.startsAt)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                          <p className="font-bold text-white">{soldSeats}</p>
                          <p className="text-white/35">Sold</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                          <p className="font-bold text-white">{remainingSeats}</p>
                          <p className="text-white/35">Remaining</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-3">
                        <div>
                          <p className="font-goldman text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/30">Starts from</p>
                          <p className="font-goldman text-base font-bold text-white">{formatCurrency(startingPrice, event.currency)}</p>
                        </div>
                        <a
                          href={`/dashboard/organizer/events/${event.id}`}
                          className="rounded-xl bg-[#ff7224] px-4 py-2 text-[0.7rem] font-bold text-white transition hover:bg-[#ff8442]"
                        >
                          Edit
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-5">
            <PaginationLinks basePath="/dashboard/organizer" currentPage={Math.min(page, totalPages)} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </OrganizerShell>
  );
}
