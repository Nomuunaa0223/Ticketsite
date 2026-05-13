import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { calculateTransparentFees } from "@/lib/fees";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { resaleListingSchema } from "@/lib/validations/resale";
import { NotificationType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = resaleListingSchema.parse(await request.json());
    const ticket = await prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: {
        ticketType: true,
        event: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const sessionUserId = Number(session.sub);

    if (ticket.currentOwnerId !== sessionUserId) {
      return NextResponse.json({ error: "Only the current owner can list this ticket." }, { status: 403 });
    }

    if (!ticket.resaleAllowed || !ticket.ticketType.resaleAllowed) {
      return NextResponse.json({ error: "Resale is disabled for this ticket." }, { status: 400 });
    }

    if (ticket.checkedInAt) {
      return NextResponse.json({ error: "Checked-in tickets cannot be resold." }, { status: 400 });
    }

    if (ticket.ticketType.resalePriceCap && payload.askPrice > ticket.ticketType.resalePriceCap.toNumber()) {
      return NextResponse.json({ error: "Listing price exceeds organizer cap." }, { status: 400 });
    }

    const activeListing = await prisma.resaleListing.findFirst({
      where: {
        ticketId: ticket.id,
        status: "ACTIVE"
      }
    });

    if (activeListing) {
      return NextResponse.json({ error: "Ticket is already listed for resale." }, { status: 409 });
    }

    const fees = calculateTransparentFees({
      unitPrice: payload.askPrice,
      sellerFeeBps: 500,
      serviceFeeBps: 0,
      platformFeeBps: 0
    });

    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.resaleListing.create({
        data: {
          ticketId: ticket.id,
          sellerId: sessionUserId,
          eventId: ticket.eventId,
          ticketTypeId: ticket.ticketTypeId,
          status: "ACTIVE",
          askPrice: new Prisma.Decimal(payload.askPrice),
          buyerFee: new Prisma.Decimal(fees.buyerFee),
          sellerFee: new Prisma.Decimal(fees.sellerFee),
          expiresAt: payload.expiresAt ?? null
        }
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          currentListedPrice: new Prisma.Decimal(payload.askPrice)
        }
      });

      return created;
    });

    await recordAuditLog({
      actorUserId: sessionUserId,
      action: "RESALE_CREATED",
      entityType: "ResaleListing",
      entityId: listing.id,
      description: `Created resale listing for ticket ${ticket.code}`,
      metadata: { askPrice: payload.askPrice }
    });

    await createUserNotification({
      userId: sessionUserId,
      type: NotificationType.ORDER_CREATED,
      title: "Resale жагсаалт үүслээ",
      message: `${ticket.event.title} - ${ticket.ticketType.name} тасалбар дахин худалдаанд гарлаа.`,
      actionUrl: `/events/${ticket.event.slug}`,
      eventId: ticket.eventId,
      ticketId: ticket.id,
      dedupeKey: `resale:${listing.id}:created`
    });

    return NextResponse.json({ ok: true, listing }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create resale listing." }, { status: 400 });
  }
}
