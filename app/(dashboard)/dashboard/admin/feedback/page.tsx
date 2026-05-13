import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { PaginationLinks, getPage } from "@/components/admin/pagination-links";
import { formatDateTime } from "@/lib/utils";

const PER_PAGE = 8;

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const { page: pageParam } = await searchParams;
  const page = getPage(pageParam);

  const [total, inquiries] = await Promise.all([
    prisma.contactInquiry.count(),
    prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <AdminShell user={user}>
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedback</h1>
          <p className="mt-1 text-sm text-white/40">Хэрэглэгчдийн санал, гомдлууд</p>
        </div>
        <span className="rounded-full bg-[#ff7224]/15 px-3 py-1 text-xs font-bold text-[#ff7224]">
          {total} нийт
        </span>
      </div>

      <div className="mt-6">
        {inquiries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/30">
            Одоогоор санал гомдол ирээгүй байна.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {inquiries.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/[0.06] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/40">
                      {(page - 1) * PER_PAGE + index + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-white">{item.email}</p>
                      {item.phone && (
                        <p className="text-xs text-white/40">{item.phone}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-white/25">{formatDateTime(item.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <PaginationLinks
          basePath="/dashboard/admin/feedback"
          currentPage={page}
          totalPages={totalPages}
        />
      </div>
    </AdminShell>
  );
}
