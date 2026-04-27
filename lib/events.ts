import {
  EventStatus,
  OrganizerStatus,
  Prisma,
  type User
} from "@prisma/client";
import { recordAuditLog } from "@/lib/audit";
import { calculateFromPrismaAmounts } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import { eventInputSchema, type EventInput } from "@/lib/validations/event";

export async function getPublicEvents(categorySlug?: string) {
  try {
    return await prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        ...(categorySlug
          ? {
              category: {
                slug: categorySlug
              }
            }
          : {})
      },
      include: {
        venue: true,
        category: true,
        organizer: true,
        ticketTypes: {
          orderBy: {
            price: "asc"
          }
        }
      },
      orderBy: {
        startsAt: "asc"
      }
    });
  } catch {
    return [];
  }
}

export async function getEventBySlug(slug: string) {
  try {
    return await prisma.event.findUnique({
      where: { slug },
      include: {
        venue: true,
        category: true,
        subcategory: true,
        organizer: {
          include: {
            user: true
          }
        },
        ticketTypes: {
          orderBy: {
            price: "asc"
          }
        }
      }
    });
  } catch {
    return null;
  }
}

export async function getTicketTypeCards(eventId: string) {
  let event;

  try {
    event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: {
          orderBy: {
            price: "asc"
          }
        }
      }
    });
  } catch {
    return [];
  }

  if (!event) {
    return [];
  }

  return event.ticketTypes.map((ticketType) => ({
    ...ticketType,
    fees: calculateFromPrismaAmounts({
      unitPrice: ticketType.price,
      quantity: 1,
      platformFeeBps: event.platformFeeBps,
      serviceFeeBps: event.serviceFeeBps
    })
  }));
}

export async function createEventWithTicketTypes(input: EventInput, actor: User) {
  const validated = eventInputSchema.parse(input);
  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId: actor.id }
  });

  if (!organizerProfile) {
    throw new Error("Organizer profile not found for this account.");
  }

  const baseSlug = slugify(validated.title);
  const slug = await createUniqueEventSlug(baseSlug);
  const status =
    organizerProfile.status === OrganizerStatus.APPROVED
      ? EventStatus.PENDING_REVIEW
      : EventStatus.DRAFT;

  const event = await prisma.event.create({
    data: {
      organizerId: organizerProfile.id,
      createdById: actor.id,
      categoryId: validated.categoryId,
      subcategoryId: validated.subcategoryId || null,
      venueId: validated.venueId,
      title: validated.title,
      slug,
      summary: validated.summary,
      description: validated.description,
      startsAt: validated.startsAt,
      endsAt: validated.endsAt,
      saleStartsAt: validated.saleStartsAt,
      saleEndsAt: validated.saleEndsAt,
      status,
      currency: validated.currency.toUpperCase(),
      platformFeeBps: validated.platformFeeBps,
      serviceFeeBps: validated.serviceFeeBps,
      ticketTypes: {
        create: validated.ticketTypes.map((ticketType) => ({
          name: ticketType.name,
          description: ticketType.description,
          price: new Prisma.Decimal(ticketType.price),
          quantityTotal: ticketType.quantityTotal,
          maxPerOrder: ticketType.maxPerOrder,
          resaleAllowed: ticketType.resaleAllowed,
          resalePriceCap: ticketType.resalePriceCap
            ? new Prisma.Decimal(ticketType.resalePriceCap)
            : null,
          startsAt: ticketType.startsAt,
          endsAt: ticketType.endsAt
        }))
      }
    },
    include: {
      ticketTypes: true
    }
  });

  await recordAuditLog({
    actorUserId: actor.id,
    action: "EVENT_CREATED",
    entityType: "Event",
    entityId: event.id,
    description: `Created event ${event.title}`,
    metadata: { status: event.status, slug: event.slug }
  });

  return event;
}

async function createUniqueEventSlug(baseSlug: string) {
  let slug = baseSlug;
  let index = 1;

  while (await prisma.event.findUnique({ where: { slug } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return slug;
}
