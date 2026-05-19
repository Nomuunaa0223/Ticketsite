import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getPage, PaginationLinks } from "@/components/admin/pagination-links";

const PAGE_SIZE = 10;

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function AdminAiEventsPage({ searchParams }: Props) {
  const user = await requireRole("ADMIN");
  const { page: rawPage } = await searchParams;
  const page = getPage(rawPage);

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: { aiGenerated: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: true,
        venue: true,
        organizer: { include: { user: true } },
        createdBy: true,
      },
    }),
    prisma.event.count({ where: { aiGenerated: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell user={user}>
      <div className="space-y-8">
        <div>
          <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Удирдах</p>
          <h1 className="mt-1 font-goldman text-2xl font-bold text-white">AI Events</h1>
          <p className="mt-1 text-sm text-white/40">Tixy AI-аар үүсгэсэн арга хэмжээнүүд</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
            Нийт ({total})
          </p>

          {events.length === 0 && (
            <div className="rounded-2xl bg-white/[0.03] p-8 text-center text-sm text-white/30">
              AI-аар үүсгэсэн арга хэмжээ байхгүй байна.
            </div>
          )}

          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/admin/events/${event.id}`}
              className="group flex items-center gap-4 rounded-2xl bg-[#0f1629] px-5 py-4 transition-all hover:-translate-y-0.5 hover:bg-[#131d35] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            >
              {event.cardImageUrl || event.imageUrl ? (
                <img
                  src={event.cardImageUrl ?? event.imageUrl ?? ""}
                  alt={event.title}
                  className="h-14 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/20">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="m3 9 5-5 4 4 3-3 6 6" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-goldman font-semibold text-white transition group-hover:text-[#ff7224]">
                    {event.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-violet-400/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-violet-300">
                    AI
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/40">
                  {event.category.name} · {event.venue.name}, {event.venue.city}
                </p>
                <p className="mt-0.5 text-xs text-white/30">
                  {event.createdBy?.fullName ?? event.organizer.user.fullName}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em] ${getStatusClasses(event.status)}`}
              >
                {formatStatus(event.status)}
              </span>

              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-white/50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}

          <div className="flex justify-end pt-1">
            <PaginationLinks
              basePath="/dashboard/admin/ai-events"
              currentPage={Math.min(page, totalPages)}
              totalPages={totalPages}
              pageParam="page"
              preserveParams={{}}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function formatStatus(status: string) {
  if (status === "PUBLISHED") return "Нийтлэгдсэн";
  if (status === "PENDING_REVIEW") return "Хянагдаж байна";
  if (status === "DRAFT") return "Ноорог";
  if (status === "REJECTED") return "Татгалзсан";
  return status.replaceAll("_", " ");
}

function getStatusClasses(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-400/16 text-emerald-300";
  if (status === "PENDING_REVIEW") return "bg-amber-400/16 text-amber-300";
  if (status === "DRAFT") return "bg-white/10 text-white/50";
  if (status === "REJECTED") return "bg-red-400/16 text-red-300";
  return "bg-white/10 text-white/60";
}
