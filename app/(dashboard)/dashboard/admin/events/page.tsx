import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getPage, PaginationLinks } from "@/components/admin/pagination-links";

const PENDING_PAGE_SIZE = 3;
const PAGE_SIZE = 5;

type Props = {
  searchParams: Promise<{ page?: string | string[]; pendingPage?: string | string[] }>;
};

export default async function AdminEventsPage({ searchParams }: Props) {
  const user = await requireRole("ADMIN");
  const { page: rawPage, pendingPage: rawPendingPage } = await searchParams;
  const page = getPage(rawPage);
  const pendingPage = getPage(rawPendingPage);

  const [pendingEvents, totalPending, restEvents, totalRest] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PENDING_REVIEW", aiGenerated: false },
      orderBy: { createdAt: "desc" },
      skip: (pendingPage - 1) * PENDING_PAGE_SIZE,
      take: PENDING_PAGE_SIZE,
      include: { category: true, venue: true, organizer: { include: { user: true } } }
    }),
    prisma.event.count({ where: { status: "PENDING_REVIEW", aiGenerated: false } }),
    prisma.event.findMany({
      where: { status: { not: "PENDING_REVIEW" }, aiGenerated: false },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: true, venue: true, organizer: { include: { user: true } } }
    }),
    prisma.event.count({ where: { status: { not: "PENDING_REVIEW" }, aiGenerated: false } }),
  ]);

  const totalPendingPages = Math.max(1, Math.ceil(totalPending / PENDING_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(totalRest / PAGE_SIZE));

  return (
    <AdminShell user={user}>
      <div className="space-y-8">
        <div>
          <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Удирдах</p>
          <h1 className="mt-1 font-goldman text-2xl font-bold text-white">Бүх арга хэмжээ</h1>
        </div>

        {(totalPending > 0 || pendingEvents.length > 0) && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              Хүлээгдэж байгаа ({totalPending})
            </p>
            {pendingEvents.map((event) => (
              <EventRow key={event.id} event={event} highlight />
            ))}
            <div className="flex justify-end pt-1">
              <PaginationLinks
                basePath="/dashboard/admin/events"
                currentPage={Math.min(pendingPage, totalPendingPages)}
                totalPages={totalPendingPages}
                pageParam="pendingPage"
                preserveParams={{ page }}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
            Бүх арга хэмжээ ({totalRest})
          </p>
          {restEvents.length === 0 && totalPending === 0 && (
            <div className="rounded-2xl bg-white/[0.03] p-8 text-center text-sm text-white/30">
              Арга хэмжээ байхгүй байна.
            </div>
          )}
          {restEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
          <div className="flex justify-end pt-1">
            <PaginationLinks
              basePath="/dashboard/admin/events"
              currentPage={Math.min(page, totalPages)}
              totalPages={totalPages}
              pageParam="page"
              preserveParams={{ pendingPage }}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function EventRow({ event, highlight = false }: {
  event: {
    id: number;
    title: string;
    status: string;
    imageUrl: string | null;
    cardImageUrl: string | null;
    startsAt: Date;
    category: { name: string };
    venue: { name: string; city: string };
    organizer: { user: { fullName: string } };
  };
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/dashboard/admin/events/${event.id}`}
      className={`group flex items-center gap-4 rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${
        highlight ? "bg-amber-400/[0.06] hover:bg-amber-400/[0.09]" : "bg-[#0f1629] hover:bg-[#131d35]"
      }`}
    >
      {event.cardImageUrl || event.imageUrl ? (
        <img src={event.cardImageUrl ?? event.imageUrl ?? "/uploads/1.jpg"} alt={event.title} className="h-14 w-20 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/20">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m3 9 5-5 4 4 3-3 6 6" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-goldman font-semibold text-white transition group-hover:text-[#ff7224]">
          {event.title}
        </p>
        <p className="mt-0.5 text-xs text-white/40">
          {event.category.name} · {event.venue.name}, {event.venue.city}
        </p>
        <p className="mt-0.5 text-xs text-white/30">{event.organizer.user.fullName}</p>
      </div>

      <span className={`shrink-0 rounded-full px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em] ${getStatusClasses(event.status)}`}>
        {formatStatus(event.status)}
      </span>

      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-white/50" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function formatStatus(status: string) {
  if (status === "PUBLISHED") return "Нийтлэгдсэн";
  if (status === "PENDING_REVIEW") return "Хянагдаж байна";
  if (status === "REJECTED") return "Татгалзсан";
  return status.replaceAll("_", " ");
}

function getStatusClasses(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-400/16 text-emerald-300";
  if (status === "PENDING_REVIEW") return "bg-amber-400/16 text-amber-300";
  if (status === "REJECTED") return "bg-red-400/16 text-red-300";
  return "bg-white/10 text-white/60";
}
