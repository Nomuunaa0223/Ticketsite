import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getPage, PaginationLinks } from "@/components/admin/pagination-links";

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export default async function AdminPartnershipsPage({ searchParams }: Props) {
  const user = await requireRole("ADMIN");
  const page = getPage((await searchParams).page);

  const [total, requests] = await Promise.all([
    prisma.contactInquiry.count({ where: { ticketType: "Partnership" } }),
    prisma.contactInquiry.findMany({
      where: { ticketType: "Partnership" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell user={user}>
      <div className="border-b border-white/[0.06] pb-5">
        <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Admin</p>
        <h1 className="mt-1 font-goldman text-2xl font-bold text-white">Хамтрах хүсэлтүүд</h1>
        <p className="mt-2 text-sm text-white/40">Партнерийн хүсэлтийг доороос харна уу.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1rem] bg-[#121a30] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-[1fr_0.8fr_1.6fr_0.9fr] gap-4 px-5 py-3 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/30">
          <span>Имэйл</span>
          <span>Утас</span>
          <span>Мессеж</span>
          <span>Огноо</span>
        </div>
        <div className="space-y-px bg-white/[0.03]">
          {requests.map((req) => (
            <article
              key={req.id}
              className="grid grid-cols-[1fr_0.8fr_1.6fr_0.9fr] gap-4 bg-[#121a30] px-5 py-4 text-sm text-white/72"
            >
              <p className="truncate font-semibold text-white">{req.email}</p>
              <p className="truncate text-white/60">{req.phone || "—"}</p>
              <p className="line-clamp-3 text-white/62">{req.message}</p>
              <time className="text-xs font-semibold text-white/40" dateTime={req.createdAt.toISOString()}>
                {formatDate(req.createdAt)}
              </time>
            </article>
          ))}
          {requests.length === 0 && (
            <div className="px-5 py-10 text-sm text-white/42">Одоогоор хүсэлт байхгүй байна.</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <PaginationLinks
          basePath="/dashboard/admin/partnerships"
          currentPage={Math.min(page, totalPages)}
          totalPages={totalPages}
        />
      </div>
    </AdminShell>
  );
}

function formatDate(value: Date) {
  const d = value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
