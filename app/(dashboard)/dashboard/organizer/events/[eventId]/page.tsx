import { redirect, notFound } from "next/navigation";
import { requireExactRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizerShell } from "@/components/organizer/organizer-shell";
import { OrganizerEventEditForm } from "@/components/forms/organizer-event-edit-form";

type Props = { params: Promise<{ eventId: string }> };
type RelatedImage = { type: string; title: string; url: string };

function parseRelatedImages(value: unknown): RelatedImage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((image): image is RelatedImage => {
      if (!image || typeof image !== "object") return false;
      const candidate = image as Record<string, unknown>;
      return typeof candidate.url === "string";
    })
    .map((image) => ({
      type: typeof image.type === "string" ? image.type : "Related",
      title: typeof image.title === "string" ? image.title : "Related image",
      url: image.url
    }))
    .slice(0, 3);
}

export default async function OrganizerEventEditPage({ params }: Props) {
  const { eventId } = await params;
  const user = await requireExactRole("ORGANIZER");
  if (!user.organizerProfile) redirect("/");

  const [event, categories] = await Promise.all([
    prisma.event.findFirst({
      where: { id: Number(eventId), organizerId: user.organizerProfile.id, createdById: user.id },
      include: {
        ticketTypes: { orderBy: { price: "asc" } },
        venue: true
      }
    }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })
  ]);

  if (!event) notFound();

  const primaryTicket = event.ticketTypes[0];
  const totalSeats = event.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantityTotal, 0);
  const soldSeats = Math.min(
    totalSeats,
    event.ticketTypes.reduce((sum, ticketType) => sum + ticketType.quantitySold, 0)
  );
  const remainingSeats = Math.max(0, totalSeats - soldSeats);

  return (
    <OrganizerShell user={user}>
      <div className="max-w-6xl">
        <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Edit Event</p>
        <h1 className="mt-1 font-goldman text-2xl font-bold text-white">{event.title}</h1>
        <p className="mt-2 text-sm text-white/40">After saving, your changes will be sent to admin review.</p>
        <div className="mt-6">
          <OrganizerEventEditForm
            event={{
              id: String(event.id),
              title: event.title,
              imageUrl: event.imageUrl,
              cardImageUrl: event.cardImageUrl,
              relatedImages: parseRelatedImages(event.relatedImages),
              summary: event.summary,
              description: event.description,
              categoryId: String(event.categoryId),
              startsAt: event.startsAt,
              endsAt: event.endsAt,
              saleStartsAt: event.saleStartsAt,
              saleEndsAt: event.saleEndsAt,
              status: event.status,
              ticketName: primaryTicket?.name ?? "General Admission",
              price: primaryTicket?.price.toString() ?? "1",
              quantityTotal: String(primaryTicket?.quantityTotal ?? 1),
              totalQuantity: String(totalSeats),
              soldQuantity: String(soldSeats),
              remainingQuantity: String(remainingSeats),
              venue: {
                name: event.venue.name,
                city: event.venue.city,
                country: event.venue.country,
                address: event.venue.address,
                timezone: event.venue.timezone,
                capacity: String(event.venue.capacity),
                latitude: event.venue.latitude?.toString() ?? "",
                longitude: event.venue.longitude?.toString() ?? ""
              }
            }}
            categories={categories.map((category) => ({ id: String(category.id), name: category.name }))}
          />
        </div>
      </div>
    </OrganizerShell>
  );
}
