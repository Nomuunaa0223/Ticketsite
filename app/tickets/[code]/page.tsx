import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canAccessOwnedTicket } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function TicketPage({ params }: Props) {
  const { code } = await params;
  const user = await requireUser();
  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      event: true,
      ticketType: true,
      currentOwner: true,
      ownershipHistory: {
        include: {
          fromUser: true,
          toUser: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!ticket) {
    notFound();
  }

  const allowed = canAccessOwnedTicket({
    role: user.role,
    ticketOwnerId: ticket.currentOwnerId,
    viewerId: user.id
  });

  if (!allowed) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-[2.5rem] border border-black/10 bg-white p-8 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">Ownership-based ticket</p>
            <h1 className="mt-2 font-serif text-3xl text-accent sm:text-5xl">{ticket.event.title}</h1>
            <p className="mt-3 text-lg text-black/65">{ticket.ticketType.name}</p>
          </div>
          <div className="rounded-[2rem] bg-ink px-6 py-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Ticket code</p>
            <p className="mt-2 text-2xl font-semibold">{ticket.code}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-black/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Current owner</p>
            <p className="mt-2 text-sm font-medium text-black/75">{ticket.currentOwner.fullName}</p>
          </div>
          <div className="rounded-[2rem] border border-black/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Access time</p>
            <p className="mt-2 text-sm font-medium text-black/75">{formatDateTime(ticket.event.startsAt)}</p>
          </div>
          <div className="rounded-[2rem] border border-black/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Original price</p>
            <p className="mt-2 text-sm font-medium text-black/75">
              {formatCurrency(toNumber(ticket.originalPrice), ticket.event.currency)}
            </p>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Ownership history</p>
          <div className="mt-4 space-y-3">
            {ticket.ownershipHistory.map((history) => (
              <div key={history.id} className="rounded-[1.75rem] border border-black/10 p-5">
                <p className="text-sm font-medium text-black/75">
                  {history.fromUser?.fullName ?? "Platform issuance"} to {history.toUser.fullName}
                </p>
                <p className="mt-1 text-sm text-black/55">
                  {history.acquiredVia} · {formatDateTime(history.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
