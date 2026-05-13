import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentLang } from "@/lib/i18n-server";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/forms/profile-form";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { EventCard } from "@/components/cards/event-card";
import { ResaleListTicketForm } from "@/components/tickets/resale-list-ticket-form";
import { formatDateTime, toNumber } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requireUser();
  const lang = await getCurrentLang();
  const labels = lang === "mn"
    ? {
        email: "Имэйл",
        phone: "Утас",
        joined: "Нэгдсэн",
        tickets: "Тасалбар",
        ticketHistory: "Ticket түүх",
        ownedTickets: "Авсан ticket-үүд",
        empty: "Одоогоор ticket байхгүй байна.",
        onlyActive: "Зөвхөн active ticket зарах боломжтой.",
        resaleClosed: "Энэ ticket дээр resale хаалттай байна.",
        checkedIn: "Check-in хийсэн ticket зарах боломжгүй.",
        viewTickets: "Тасалбар харах"
      }
    : {
        email: "Email",
        phone: "Phone",
        joined: "Joined",
        tickets: "Tickets",
        ticketHistory: "Ticket History",
        ownedTickets: "Owned tickets",
        empty: "You do not have any tickets yet.",
        onlyActive: "Only active tickets can be sold.",
        resaleClosed: "Resale is disabled for this ticket.",
        checkedIn: "Checked-in tickets cannot be sold.",
        viewTickets: "View Tickets"
      };

  const [profile, activeResaleTicketIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true }
    }),
    prisma.resaleListing.findMany({
      where: {
        sellerId: user.id,
        status: "ACTIVE"
      },
      select: { ticketId: true }
    })
  ]);

  const tickets = await prisma.ticket.findMany({
    where: {
      currentOwnerId: user.id,
      id: {
        notIn: activeResaleTicketIds.map((listing) => listing.ticketId)
      }
    },
    orderBy: { createdAt: "desc" },
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
      ticketType: { select: { name: true, price: true, resaleAllowed: true, resalePriceCap: true } }
    }
  });

  if (!profile) notFound();

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-white/[0.07] bg-[#0d1017] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <ProfileAvatar avatarUrl={profile.avatarUrl} initials={initials} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-goldman text-4xl font-bold text-white">{profile.fullName}</h1>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">{labels.email}</p>
                <p className="mt-1 text-sm text-white/70">{profile.email}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">{labels.phone}</p>
                <p className="mt-1 text-sm text-white/70">{profile.phone || <span className="text-white/25">-</span>}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">{labels.joined}</p>
                <p className="mt-1 text-sm text-white/70">{new Date(profile.createdAt).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")}</p>
              </div>
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">{labels.tickets}</p>
                <p className="mt-1 text-sm text-white/70">{tickets.length}</p>
              </div>
            </div>

            <div className="mt-5">
              <ProfileForm profile={profile} />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">{labels.ticketHistory}</p>
          <h2 className="mt-2 font-goldman text-4xl font-bold text-white">{labels.ownedTickets}</h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tickets.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/40">
                {labels.empty}
              </div>
            ) : (
              tickets.map((ticket) => {
                const disabledReason =
                  ticket.status !== "ACTIVE"
                    ? labels.onlyActive
                    : !ticket.resaleAllowed || !ticket.ticketType.resaleAllowed
                      ? labels.resaleClosed
                      : ticket.checkedInAt
                        ? labels.checkedIn
                        : null;

                return (
                  <div key={ticket.id} className="relative">
                    <EventCard
                      event={{
                        ...ticket.event,
                        summary: `${ticket.ticketType.name} · ${formatDateTime(ticket.event.startsAt)}`,
                        ticketTypes: [{ price: ticket.ticketType.price }]
                      }}
                      ctaLabel={labels.viewTickets}
                    />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] ${
                        ticket.status === "ACTIVE"
                          ? "bg-emerald-400/16 text-emerald-300"
                          : ticket.status === "CHECKED_IN"
                            ? "bg-blue-400/16 text-blue-300"
                            : "bg-white/10 text-white/50"
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <ResaleListTicketForm
                      ticketId={ticket.id}
                      currency={ticket.event.currency}
                      originalPrice={toNumber(ticket.ticketType.price)}
                      resalePriceCap={ticket.ticketType.resalePriceCap ? toNumber(ticket.ticketType.resalePriceCap) : null}
                      disabledReason={disabledReason}
                      isListed={false}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
