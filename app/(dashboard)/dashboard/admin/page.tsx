import { requireRole } from "@/lib/auth";
import { AdminEventReviewActions } from "@/components/forms/admin-event-review-actions";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await requireRole("MODERATOR");
  const reviewQueue = await prisma.event.findMany({
    where: {
      status: "PENDING_REVIEW"
    },
    include: {
      organizer: true,
      venue: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.24em] text-black/45">Review queue</p>
        <h1 className="mt-2 font-serif text-5xl text-accent">Moderator and admin controls</h1>
        <p className="mt-3 text-lg leading-8 text-black/65">
          {user.role} access includes event review, audit visibility, and operational control.
        </p>
      </div>
      <div className="space-y-4">
        {reviewQueue.map((event) => (
          <div key={event.id} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink">{event.title}</h2>
                <p className="mt-2 text-sm leading-6 text-black/65">
                  {event.organizer.companyName} · {event.venue.name} · {formatDateTime(event.startsAt)}
                </p>
              </div>
              <AdminEventReviewActions eventId={event.id} />
            </div>
          </div>
        ))}
        {reviewQueue.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-6 text-sm text-black/60">
            No events are waiting for review right now.
          </div>
        ) : null}
      </div>
    </section>
  );
}
