import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  const [ordersCount, ticketsCount, organizerEvents, pendingReviews] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.ticket.count({ where: { currentOwnerId: user.id } }),
    user.organizerProfile
      ? prisma.event.count({ where: { organizerId: user.organizerProfile.id } })
      : Promise.resolve(0),
    user.role === "ADMIN" || user.role === "MODERATOR"
      ? prisma.event.count({ where: { status: "PENDING_REVIEW" } })
      : Promise.resolve(0)
  ]);

  const cards = [
    { label: "Orders", value: ordersCount, description: "Purchases and payment state" },
    { label: "Tickets", value: ticketsCount, description: "Ownership-based access cards" }
  ];

  if (user.role === "ORGANIZER" && user.organizerProfile) {
    cards.push({
      label: "Organizer events",
      value: organizerEvents,
      description: "Drafts, review queue, and published events"
    });
  }

  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    cards.push({
      label: "Pending review",
      value: pendingReviews,
      description: "Events waiting for moderation"
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Dashboard</p>
          <h1 className="mt-2 font-serif text-5xl text-accent">{user.fullName}</h1>
          <p className="mt-3 text-lg text-black/65">
            Role: {user.role}. Tickets stay tied to the current owner throughout the lifecycle.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.role === "ORGANIZER" ? (
            <Button href="/dashboard/organizer">Organizer area</Button>
          ) : null}
          {(user.role === "ADMIN" || user.role === "MODERATOR") ? (
            <Button href="/dashboard/admin" variant="secondary">
              Review queue
            </Button>
          ) : null}
          <Button href="/api/auth/logout" variant="ghost">
            Logout
          </Button>
        </div>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">{card.label}</p>
            <p className="mt-4 font-serif text-5xl text-ink">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-black/65">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
