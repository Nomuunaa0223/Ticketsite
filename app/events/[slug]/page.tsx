import { notFound } from "next/navigation";
import { FeeBreakdown } from "@/components/tickets/fee-breakdown";
import { Button } from "@/components/ui/button";
import { getEventBySlug, getTicketTypeCards } from "@/lib/events";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const ticketTypes = await getTicketTypeCards(event.id);
  const leadTicket = ticketTypes[0];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">
              {event.category.name}
            </p>
            <h1 className="font-serif text-5xl text-accent">{event.title}</h1>
            <p className="max-w-3xl text-lg leading-8 text-black/68">{event.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">When</p>
              <p className="mt-2 text-sm font-medium text-black/75">
                {formatDateTime(event.startsAt)} to {formatDateTime(event.endsAt)}
              </p>
            </div>
            <div className="rounded-[2rem] border border-black/10 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Venue</p>
              <p className="mt-2 text-sm font-medium text-black/75">
                {event.venue.name}, {event.venue.city}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-black/45">Ticket types</p>
                <h2 className="mt-2 font-serif text-3xl text-accent">Choose your experience</h2>
              </div>
              <span className="rounded-full bg-sand px-4 py-2 text-xs uppercase tracking-[0.2em] text-black/55">
                Resale controlled
              </span>
            </div>
            <div className="space-y-4">
              {ticketTypes.map((ticketType) => (
                <div
                  key={ticketType.id}
                  className="rounded-[1.75rem] border border-black/10 p-5 transition hover:border-black/20"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{ticketType.name}</h3>
                      <p className="mt-2 text-sm text-black/65">
                        {ticketType.description ?? "Ownership-based access with QR verification."}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-black/45">
                        Face value
                      </p>
                      <p className="text-xl font-semibold text-ink">
                        {formatCurrency(toNumber(ticketType.price), event.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-black/45">
                    <span>{ticketType.quantityTotal - ticketType.quantitySold} remaining</span>
                    <span>Max {ticketType.maxPerOrder} per order</span>
                    <span>{ticketType.resaleAllowed ? "Resale enabled" : "No resale"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {leadTicket ? (
            <FeeBreakdown
              subtotal={leadTicket.fees.subtotal}
              platformFee={leadTicket.fees.platformFee}
              serviceFee={leadTicket.fees.serviceFee}
              total={leadTicket.fees.total}
              currency={event.currency}
            />
          ) : null}
          <div className="rounded-[2rem] border border-black/10 bg-ink p-6 text-white shadow-panel">
            <p className="text-xs uppercase tracking-[0.22em] text-white/60">Purchase flow</p>
            <h2 className="mt-3 font-serif text-3xl">Checkout hooks are ready</h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Orders, payments, tickets, ownership history, resale listings, and audit logs are
              modeled. Plug your payment provider into the checkout endpoint to capture funds and
              issue tickets.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/login" variant="secondary">
                Create account
              </Button>
              <Button href="/dashboard" variant="ghost" className="text-white hover:bg-white/10">
                Open dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
