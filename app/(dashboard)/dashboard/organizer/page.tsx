import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrganizerEventForm } from "@/components/forms/organizer-event-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function OrganizerDashboardPage() {
  const user = await requireRole("ORGANIZER");

  if (!user.organizerProfile) {
    redirect("/dashboard");
  }

  const [events, categories, venues] = await Promise.all([
    prisma.event.findMany({
      where: {
        organizerId: user.organizerProfile.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        venue: true,
        ticketTypes: true
      }
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" }
    }),
    prisma.venue.findMany({
      orderBy: { city: "asc" }
    })
  ]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-[#0b0d13] p-6 shadow-panel">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#ff7224]">Organizer action</p>
            <h1 className="mt-2 font-goldman text-4xl font-bold text-white">Create a new event</h1>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Submit your event to admin review. Users only see it after approval.
            </p>
          </div>
          <OrganizerEventForm categories={categories} venues={venues} />
          <Button href="/events" variant="secondary">
            Preview public marketplace
          </Button>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">Your catalog</p>
            <h2 className="mt-2 font-serif text-4xl text-accent">Organizer events</h2>
          </div>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">{event.title}</h3>
                    <p className="mt-2 text-sm text-black/65">
                      {event.venue.name} · {formatDateTime(event.startsAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-sand px-4 py-2 text-xs uppercase tracking-[0.2em] text-black/55">
                    {event.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-black/45">
                  <span>{event.ticketTypes.length} ticket types</span>
                  <span>Fee visibility on</span>
                  <span>{event.currency}</span>
                </div>
              </div>
            ))}
            {events.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-6 text-sm text-black/60">
                No events yet. Use the API payload example to create the first one.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
