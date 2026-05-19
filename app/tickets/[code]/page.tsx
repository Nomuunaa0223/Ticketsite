import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { canAccessOwnedTicket } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";
import { generateQRSvg } from "@/lib/qr";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function TicketPage({ params }: Props) {
  const { code } = await params;
  const user = await requireUser();
  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      event: { include: { venue: true, category: true } },
      ticketType: true,
      currentOwner: true,
      ownershipHistory: {
        include: { fromUser: true, toUser: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) notFound();

  const allowed = canAccessOwnedTicket({
    role: user.role,
    ticketOwnerId: ticket.currentOwnerId,
    viewerId: user.id,
  });

  if (!allowed) notFound();

  const isCheckedIn = ticket.status === "CHECKED_IN";
  const isVoid = ticket.status === "VOID";
  const isActive = ticket.status === "ACTIVE";

  const qrSvg = await generateQRSvg(ticket.code);

  return (
    <section className="min-h-screen bg-[#07080d] px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-lg">

        {/* Back */}
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white/70">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Миний тасалбарууд
        </Link>

        {/* Ticket card */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d1017] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

          {/* Header stripe */}
          <div className="bg-[#ff7224] px-4 py-4 sm:px-6">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-black/60">
              {ticket.event.category.name} · {ticket.event.venue.city}
            </p>
            <h1 className="mt-0.5 font-goldman text-xl font-bold text-black leading-tight">
              {ticket.event.title}
            </h1>
          </div>

          {/* QR section */}
          <div className="flex flex-col items-center px-4 py-6 sm:px-8 sm:py-8">
            {isVoid ? (
              <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white/[0.04] text-center sm:h-52 sm:w-52">
                <p className="text-sm font-semibold text-white/30">VOID</p>
              </div>
            ) : isCheckedIn ? (
              <div className="relative flex flex-col items-center gap-3">
                <div
                  className="h-44 w-44 rounded-2xl opacity-20 grayscale sm:h-52 sm:w-52 [&_svg]:h-full [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Ашигласан</p>
                </div>
              </div>
            ) : (
              <div
                className="h-44 w-44 rounded-2xl bg-white p-3 sm:h-52 sm:w-52 [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}

            {/* Status badge */}
            <span className={`mt-4 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${isActive ? "bg-emerald-400/14 text-emerald-300" :
                isCheckedIn ? "bg-blue-400/14 text-blue-300" :
                  "bg-white/10 text-white/40"
              }`}>
              {isActive ? "Идэвхтэй" : isCheckedIn ? "Ашигласан" : ticket.status}
            </span>

            {isActive && (
              <p className="mt-3 text-center text-xs text-white/30">
                Энэ QR кодыг event-д орохдоо scanner-т уншуулна уу
              </p>
            )}
          </div>

          {/* Dashed divider */}
          <div className="mx-4 border-t border-dashed border-white/[0.08] sm:mx-6" />

          {/* Info grid */}
          <div className="mx-4 my-5 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.04] p-px sm:mx-6 sm:my-6 sm:grid-cols-2">
            <div className="bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Тасалбарын төрөл</p>
              <p className="mt-1 break-words text-sm font-semibold text-white">{ticket.ticketType.name}</p>
            </div>
            <div className="bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Эзэмшигч</p>
              <p className="mt-1 text-sm font-semibold text-white truncate">{ticket.currentOwner.fullName}</p>
            </div>
            <div className="bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Огноо</p>
              <p className="mt-1 break-words text-sm font-semibold text-white">{formatDateTime(ticket.event.startsAt)}</p>
            </div>
            <div className="bg-[#0d1017] p-4">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/30">Үнэ</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {formatCurrency(toNumber(ticket.originalPrice), ticket.event.currency)}
              </p>
            </div>
          </div>

          {/* Ticket code */}
          <div className="mx-4 mb-5 rounded-xl bg-black/30 px-4 py-3 text-center sm:mx-6 sm:mb-6">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-white/25">Ticket code</p>
            <p className="mt-1 break-all font-mono text-sm font-bold tracking-widest text-white/80 sm:text-base">{ticket.code}</p>
          </div>

        </div>

        {/* Ownership history */}
        {ticket.ownershipHistory.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/25">
              Эзэмшлийн түүх
            </p>
            <div className="space-y-2">
              {ticket.ownershipHistory.map((h) => (
                <div key={h.id} className="rounded-xl border border-white/[0.06] bg-[#0d1017] px-4 py-3">
                  <p className="text-sm text-white/60">
                    {h.fromUser?.fullName ?? "Платформ"} → {h.toUser.fullName}
                  </p>
                  <p className="mt-0.5 text-xs text-white/30">
                    {h.acquiredVia} · {formatDateTime(h.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
