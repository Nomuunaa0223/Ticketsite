import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { calculateTransparentFees } from "@/lib/fees";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      ticketTypeId?: string;
      quantity?: number;
    };

    if (!body.ticketTypeId || !body.quantity) {
      return NextResponse.json({ error: "ticketTypeId and quantity are required." }, { status: 400 });
    }

    const quantity = Number(body.quantity);
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: body.ticketTypeId },
      include: {
        event: true
      }
    });

    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found." }, { status: 404 });
    }

    if (quantity < 1 || quantity > ticketType.maxPerOrder) {
      return NextResponse.json({ error: "Quantity is outside the allowed limit." }, { status: 400 });
    }

    const remaining = ticketType.quantityTotal - ticketType.quantitySold;

    if (quantity > remaining) {
      return NextResponse.json({ error: "Not enough inventory remaining." }, { status: 409 });
    }

    const fees = calculateTransparentFees({
      unitPrice: ticketType.price.toNumber(),
      quantity,
      platformFeeBps: ticketType.event.platformFeeBps,
      serviceFeeBps: ticketType.event.serviceFeeBps
    });

    const order = await prisma.order.create({
      data: {
        userId: session.sub,
        eventId: ticketType.eventId,
        status: "PENDING_PAYMENT",
        subtotal: new Prisma.Decimal(fees.subtotal),
        buyerFee: new Prisma.Decimal(fees.buyerFee),
        sellerFee: new Prisma.Decimal(fees.sellerFee),
        total: new Prisma.Decimal(fees.total),
        currency: ticketType.event.currency,
        items: {
          create: {
            ticketTypeId: ticketType.id,
            quantity,
            unitPrice: ticketType.price,
            lineSubtotal: new Prisma.Decimal(fees.subtotal),
            lineBuyerFee: new Prisma.Decimal(fees.buyerFee),
            lineSellerFee: new Prisma.Decimal(fees.sellerFee),
            lineTotal: new Prisma.Decimal(fees.total)
          }
        },
        payment: {
          create: {
            userId: session.sub,
            amount: new Prisma.Decimal(fees.total),
            currency: ticketType.event.currency,
            provider: "pending_integration",
            status: "PENDING",
            metadata: {
              reason: "Connect your payment provider webhook to capture and issue tickets."
            }
          }
        }
      },
      include: {
        items: true,
        payment: true
      }
    });

    await recordAuditLog({
      actorUserId: session.sub,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: order.id,
      description: "Created pending payment order",
      metadata: {
        ticketTypeId: ticketType.id,
        quantity,
        total: fees.total
      }
    });

    await createUserNotification({
      userId: session.sub,
      type: "ORDER_CREATED",
      title: "Ticket order created",
      message: `Your order for ${quantity} ${ticketType.name} ticket(s) to ${ticketType.event.title} was created.`,
      actionUrl: "/dashboard",
      eventId: ticketType.eventId,
      orderId: order.id,
      dedupeKey: `order:${order.id}:created`
    });

    return NextResponse.json(
      {
        ok: true,
        order,
        message:
          "Pending order created. Connect a payment provider to capture funds and mint tickets after confirmation."
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create order." }, { status: 400 });
  }
}
