import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { calculateTransparentFees } from "@/lib/fees";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { resaleListingSchema } from "@/lib/validations/resale";

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

    if (ticket.currentOwnerId !== session.sub) {
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
      serviceFeeBps: 250,
      platformFeeBps: 400
    });

    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.resaleListing.create({
        data: {
          ticketId: ticket.id,
          sellerId: session.sub,
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
      actorUserId: session.sub,
      action: "RESALE_CREATED",
      entityType: "ResaleListing",
      entityId: listing.id,
      description: `Created resale listing for ticket ${ticket.code}`,
      metadata: { askPrice: payload.askPrice }
    });

    return NextResponse.json({ ok: true, listing }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create resale listing." }, { status: 400 });
  }
}
