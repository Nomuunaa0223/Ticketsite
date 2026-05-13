import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getPage, PaginationLinks } from "@/components/admin/pagination-links";

const PAGE_SIZE = 5;

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export default async function AdminRequestsPage({ searchParams }: Props) {
  const user = await requireRole("ADMIN");
  const page = getPage((await searchParams).page);

  const [total, requests] = await Promise.all([
    prisma.contactInquiry.count(),
    prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell user={user}>
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Partnership Requests</h1>
          <p className="mt-1 text-sm text-white/42">Contact inquiries only. Organizer approvals are handled from Applications.</p>
        </div>
        <Link href="/admin/organizer-applications" className="text-sm font-semibold text-[#ff8b3d] transition hover:text-[#ffb47d]">
          Applications
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1rem] bg-[#121a30] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-[1fr_0.65fr_1.15fr_0.75fr_1fr] gap-4 px-5 py-3 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/30">
          <span>Contact</span>
          <span>Type</span>
          <span>Intro</span>
          <span>Date</span>
          <span>Action</span>
        </div>
        <div className="space-y-px bg-white/[0.03]">
          {requests.map((request) => (
            <article
              key={request.id}
              className="grid grid-cols-[1fr_0.65fr_1.15fr_0.75fr_1fr] gap-4 bg-[#121a30] px-5 py-4 text-sm text-white/72"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{request.email}</p>
                <p className="mt-1 truncate text-xs text-white/42">{request.phone || "-"}</p>
              </div>
              <span className="h-fit w-fit rounded-full bg-[#ff8b3d]/14 px-2.5 py-1 text-[0.64rem] font-bold text-[#ffb47d]">
                {request.ticketType}
              </span>
              <p className="line-clamp-3 text-white/62">{request.message}</p>
              <time className="text-xs font-semibold text-white/40" dateTime={request.createdAt.toISOString()}>
                {formatDate(request.createdAt)}
              </time>
              <Link href="/admin/organizer-applications" className="text-sm font-semibold text-[#ff8b3d] transition hover:text-[#ffb47d]">
                Applications
              </Link>
            </article>
          ))}
          {requests.length === 0 ? (
            <div className="px-5 py-10 text-sm text-white/42">No contact inquiries yet.</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <PaginationLinks basePath="/dashboard/admin/requests" currentPage={Math.min(page, totalPages)} totalPages={totalPages} />
      </div>
    </AdminShell>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
