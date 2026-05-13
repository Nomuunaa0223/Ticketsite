import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const customVenueSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  country: z.string().min(2).max(80),
  address: z.string().min(4).max(240),
  timezone: z.string().min(3).max(80),
  capacity: z.coerce.number().int().positive().max(1_000_000),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

const relatedImageSchema = z.object({
  type: z.string().min(2).max(40),
  title: z.string().min(1).max(80),
  url: z.string().max(500)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      include: { organizerProfile: true }
    });

    if (!user || user.role !== "ORGANIZER" || !user.organizerProfile) {
      return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
    }

    const event = await prisma.event.findFirst({
      where: { id: Number(eventId), organizerId: user.organizerProfile.id, createdById: user.id }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    let venueId = event.venueId;

    if (body.customVenue) {
      const customVenue = customVenueSchema.parse(body.customVenue);
      const existingVenue = await prisma.venue.findFirst({
        where: {
          name: customVenue.name,
          city: customVenue.city,
          address: customVenue.address
        }
      });
      const venue =
        existingVenue ??
        (await prisma.venue.create({
          data: customVenue
        }));

      venueId = venue.id;
    }

    const relatedImages =
      body.relatedImages === undefined
        ? undefined
        : z.array(relatedImageSchema).max(3).parse(body.relatedImages);

    const updated = await prisma.event.update({
      where: { id: Number(eventId) },
      data: {
        categoryId: Number(body.categoryId),
        venueId,
        title: body.title,
        imageUrl: body.imageUrl ?? null,
        cardImageUrl: body.cardImageUrl || null,
        ...(relatedImages !== undefined ? { relatedImages } : {}),
        summary: body.summary,
        description: body.description,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        saleStartsAt: new Date(body.saleStartsAt),
        saleEndsAt: new Date(body.saleEndsAt),
        status: "PENDING_REVIEW",
      }
    });

    const ticketType = body.ticketTypes?.[0];
    if (ticketType) {
      const existingTicketType = await prisma.ticketType.findFirst({
        where: { eventId: Number(eventId) },
        orderBy: { price: "asc" }
      });

      if (existingTicketType) {
        await prisma.ticketType.update({
          where: { id: existingTicketType.id },
          data: {
            name: String(ticketType.name),
            price: ticketType.price,
            quantityTotal: Number(ticketType.quantityTotal),
            maxPerOrder: Number(ticketType.maxPerOrder ?? existingTicketType.maxPerOrder),
            resaleAllowed: Boolean(ticketType.resaleAllowed ?? existingTicketType.resaleAllowed)
          }
        });
      } else {
        await prisma.ticketType.create({
          data: {
            eventId: Number(eventId),
            name: String(ticketType.name),
            price: ticketType.price,
            quantityTotal: Number(ticketType.quantityTotal),
            maxPerOrder: Number(ticketType.maxPerOrder ?? 8),
            resaleAllowed: Boolean(ticketType.resaleAllowed ?? true)
          }
        });
      }
    }

    return NextResponse.json({ ok: true, event: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update event" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      include: { organizerProfile: true }
    });

    if (!user || user.role !== "ORGANIZER" || !user.organizerProfile) {
      return NextResponse.json({ error: "Organizer access required" }, { status: 403 });
    }

    const event = await prisma.event.findFirst({
      where: { id: Number(eventId), organizerId: user.organizerProfile.id, createdById: user.id }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await prisma.ticketType.deleteMany({ where: { eventId: Number(eventId) } });
    await prisma.event.delete({ where: { id: Number(eventId) } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete event" }, { status: 400 });
  }
}
