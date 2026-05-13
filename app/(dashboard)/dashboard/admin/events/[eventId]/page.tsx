import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEventReviewActions } from "@/components/forms/admin-event-review-actions";
import { VenueMapPreview } from "@/components/events/venue-map-preview";
import { formatCurrency, formatDateTime, toNumber } from "@/lib/utils";

type Props = { params: Promise<{ eventId: string }> };
type RelatedImage = { type: string; title: string; url: string };

function getStatusClasses(status: string) {
  if (status === "PUBLISHED") return "bg-emerald-400/16 text-emerald-300";
  if (status === "PENDING_REVIEW") return "bg-amber-400/16 text-amber-300";
  if (status === "REJECTED") return "bg-red-400/16 text-red-300";
  return "bg-white/10 text-white/60";
}

function parseRelatedImages(value: unknown): RelatedImage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((image): image is RelatedImage => {
      if (!image || typeof image !== "object") return false;
      return typeof (image as Record<string, unknown>).url === "string";
    })
    .map((image) => ({
      type: typeof image.type === "string" ? image.type : "Related",
      title: typeof image.title === "string" ? image.title : "Related image",
      url: image.url
    }))
    .slice(0, 3);
}

export default async function AdminEventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const user = await requireRole("ADMIN");

  const event = await prisma.event.findUnique({
    where: { id: Number(eventId) },
    include: {
      category: true,
      venue: true,
      organizer: { include: { user: true } },
      ticketTypes: { orderBy: { price: "asc" } }
    }
  });

  if (!event) notFound();

  const relatedImages = parseRelatedImages(event.relatedImages);
  const primaryTicket = event.ticketTypes[0];
  const startingPrice = event.ticketTypes.length
    ? Math.min(...event.ticketTypes.map((ticketType) => toNumber(ticketType.price))) : 0;
  const totalSeats = event.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantityTotal, 0);
  const soldSeats = Math.min(
    totalSeats,
    event.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantitySold, 0)
  );
  const remainingSeats = Math.max(0, totalSeats - soldSeats);

  return (
    <AdminShell user={user}>
      <div className="max-w-6xl space-y-6">
        <Link href="/dashboard/admin/events" className="inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All events
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Review Event</p>
            <h1 className="mt-1 font-goldman text-2xl font-bold text-white">{event.title}</h1>
            <p className="mt-2 text-sm text-white/40">Organizer-ийн засдаг form-той ижил харагдацаар шалгана.</p>
          </div>
          <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClasses(event.status)}`}>
            {event.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="organizer-event-form mx-auto max-w-6xl space-y-4 rounded-[1.25rem] bg-[#0f1629] p-5">
          <div className="relative h-80 overflow-hidden rounded-xl">
            <img src={event.imageUrl ?? "/uploads/1.jpg"} alt={event.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f17] via-[#0a0f17]/20 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#ff8b46]">{event.category.name}</p>
              <p className="font-goldman text-lg font-bold text-white">{event.title}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="organizer-field">
                <span>Small event card image (event list only)</span>
                {event.cardImageUrl ? (
                  <div className="relative aspect-[12/5] overflow-hidden rounded-xl bg-black/20">
                    <img src={event.cardImageUrl} alt={`${event.title} card image`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/30 to-transparent" />
                  </div>
                ) : (
                  <p className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/42">No small card image uploaded.</p>
                )}
              </label>

              <label className="organizer-field">
                <span>Category</span>
                <input readOnly value={event.category.name} />
              </label>

              <label className="organizer-field">
                <span>Event title</span>
                <input readOnly value={event.title} />
              </label>

              <label className="organizer-field">
                <span>Summary</span>
                <input readOnly value={event.summary} />
              </label>

              <label className="organizer-field">
                <span>Description</span>
                <textarea readOnly rows={4} value={event.description} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="organizer-field">
                  <span>Starts at</span>
                  <input readOnly value={formatDateTime(event.startsAt)} />
                </label>
                <label className="organizer-field">
                  <span>Ends at</span>
                  <input readOnly value={formatDateTime(event.endsAt)} />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="organizer-field">
                  <span>Sale starts</span>
                  <input readOnly value={formatDateTime(event.saleStartsAt)} />
                </label>
                <label className="organizer-field">
                  <span>Sale ends</span>
                  <input readOnly value={formatDateTime(event.saleEndsAt)} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="organizer-field">
                  <span>Ticket</span>
                  <input readOnly value={primaryTicket?.name ?? "No ticket"} />
                </label>
                <label className="organizer-field">
                  <span>Price</span>
                  <input readOnly value={formatCurrency(startingPrice, event.currency)} />
                </label>
                <label className="organizer-field">
                  <span>Total quantity</span>
                  <input readOnly value={String(totalSeats)} />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="organizer-field">
                  <span>Sold</span>
                  <input readOnly value={String(soldSeats)} />
                </label>
                <label className="organizer-field">
                  <span>Remaining</span>
                  <input readOnly value={String(remainingSeats)} />
                </label>
              </div>

              <div className="space-y-3 rounded-xl bg-white/[0.03] p-3">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white/48">Related images (max 3)</p>
                {relatedImages.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {relatedImages.map((image) => (
                      <div key={image.url} className="overflow-hidden rounded-xl bg-black/20">
                        <img src={image.url} alt={image.title} className="aspect-[4/3] w-full object-cover" />
                        <div className="p-2">
                          <p className="truncate text-xs font-bold text-white">{image.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/42">No related images uploaded.</p>
                )}
              </div>

              <div className="space-y-3 rounded-xl bg-white/[0.03] p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="organizer-field">
                    <span>Venue name</span>
                    <input readOnly value={event.venue.name} />
                  </label>
                  <label className="organizer-field">
                    <span>City</span>
                    <input readOnly value={event.venue.city} />
                  </label>
                  <label className="organizer-field">
                    <span>Country</span>
                    <input readOnly value={event.venue.country} />
                  </label>
                </div>

                <label className="organizer-field">
                  <span>Address</span>
                  <input readOnly value={event.venue.address} />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="organizer-field">
                    <span>Venue capacity</span>
                    <input readOnly value={String(event.venue.capacity)} />
                  </label>
                  <label className="organizer-field">
                    <span>Timezone</span>
                    <input readOnly value={event.venue.timezone} />
                  </label>
                </div>

                <VenueMapPreview
                  name={event.venue.name}
                  latitude={event.venue.latitude}
                  longitude={event.venue.longitude}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">Ticket types</p>
                {event.ticketTypes.map((ticketType) => (
                  <div key={ticketType.id} className="rounded-xl bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{ticketType.name}</p>
                      <p className="font-goldman font-bold text-white">{formatCurrency(toNumber(ticketType.price), event.currency)}</p>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {Math.min(ticketType.quantitySold, ticketType.quantityTotal)} sold / {Math.max(0, ticketType.quantityTotal - ticketType.quantitySold)} remaining / {ticketType.quantityTotal} total
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {event.status === "PENDING_REVIEW" ? (
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="mb-4 text-sm font-semibold text-white">Review decision</p>
              <AdminEventReviewActions eventId={event.id} />
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
