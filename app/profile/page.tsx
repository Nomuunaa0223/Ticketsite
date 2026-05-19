import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentLang } from "@/lib/i18n-server";
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
        email: "Имэйл", phone: "Утас", joined: "Нэгдсэн", tickets: "Тасалбар",
        ownedTickets: "Миний тасалбарууд",
        empty: "Одоогоор тасалбар байхгүй байна.",
        onlyActive: "Зөвхөн идэвхтэй тасалбар зарах боломжтой.",
        resaleClosed: "Энэ тасалбар дээр дахин зарах хаалттай.",
        checkedIn: "Check-in хийсэн тасалбар зарах боломжгүй.",
        viewTickets: "Тасалбар харах"
      }
    : {
        email: "Email", phone: "Phone", joined: "Joined", tickets: "Tickets",
        ownedTickets: "My Tickets",
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
      where: { sellerId: user.id, status: "ACTIVE" },
      select: { ticketId: true }
    })
  ]);

  const tickets = await prisma.ticket.findMany({
    where: {
      currentOwnerId: user.id,
      id: { notIn: activeResaleTicketIds.map((l) => l.ticketId) }
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      event: {
        select: {
          title: true, slug: true, startsAt: true, currency: true,
          imageUrl: true, cardImageUrl: true,
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
    <section className="min-h-screen bg-[#07080d] px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* Left: avatar + info + edit */}
          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#0d1017] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-6 lg:sticky lg:top-24 lg:w-72 lg:self-start">
            <div className="flex flex-col items-center">
              <ProfileAvatar avatarUrl={profile.avatarUrl} initials={initials} />
            </div>
            <div className="space-y-3">
              <h1 className="break-words text-center font-goldman text-xl font-bold text-white sm:text-2xl">{profile.fullName}</h1>
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">{labels.email}</p>
                  <p className="mt-1 break-all text-sm text-white/70">{profile.email}</p>
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
            </div>
            <ProfileForm profile={profile} />
          </div>

          {/* Right: tickets */}
          <div className="min-w-0 flex-1">
            <div>
              <h2 className="font-goldman text-2xl font-bold text-white sm:text-4xl">{labels.ownedTickets}</h2>

              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
                          href={`/tickets/${ticket.code}`}
                          ctaLabel={labels.viewTickets}
                          hideBadges
                        />
                        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] ${
                          ticket.status === "ACTIVE"
                            ? "bg-emerald-400/16 text-emerald-300"
                            : ticket.status === "CHECKED_IN"
                              ? "bg-blue-400/16 text-blue-300"
                              : "bg-white/10 text-white/50"
                        }`}>
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

        </div>
      </div>
    </section>
  );
}
