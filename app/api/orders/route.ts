import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type OrderItemInput = {
  ticketTypeId?: number;
  quantity?: number;
};

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      ticketTypeId?: number;
      quantity?: number;
      items?: OrderItemInput[];
    };
    const sessionUserId = Number(session.sub);

    const requestedItems = normalizeItems(body);

    if (!requestedItems.length) {
      return NextResponse.json({ error: "At least one ticket selection is required." }, { status: 400 });
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        id: {
          in: requestedItems.map((item) => item.ticketTypeId)
        }
      },
      include: {
        event: true
      }
    });

    if (ticketTypes.length !== requestedItems.length) {
      return NextResponse.json({ error: "One or more ticket types were not found." }, { status: 404 });
    }

    const firstEventId = ticketTypes[0]?.eventId;
    const allSameEvent = ticketTypes.every((ticketType) => ticketType.eventId === firstEventId);

    if (!allSameEvent || !firstEventId) {
      return NextResponse.json({ error: "All selected tickets must belong to the same event." }, { status: 400 });
    }

    let subtotal = 0;
    let buyerFee = 0;
    let sellerFee = 0;
    let total = 0;

    const itemCreates = requestedItems.map((item) => {
      const ticketType = ticketTypes.find((entry) => entry.id === item.ticketTypeId)!;
      const quantity = Number(item.quantity);

      if (quantity < 1 || quantity > ticketType.maxPerOrder) {
        throw new Error(`Quantity is outside the allowed limit for ${ticketType.name}.`);
      }

      const remaining = Math.max(0, ticketType.quantityTotal - ticketType.quantitySold);

      if (quantity > remaining) {
        throw new Error(`Not enough inventory remaining for ${ticketType.name}.`);
      }

      const lineSubtotal = ticketType.price.toNumber() * quantity;

      subtotal += lineSubtotal;
      total += lineSubtotal;

      return {
        ticketTypeId: ticketType.id,
        quantity,
        unitPrice: ticketType.price,
        lineSubtotal: new Prisma.Decimal(lineSubtotal),
        lineBuyerFee: new Prisma.Decimal(0),
        lineSellerFee: new Prisma.Decimal(0),
        lineTotal: new Prisma.Decimal(lineSubtotal)
      };
    });

    const order = await prisma.order.create({
      data: {
        userId: sessionUserId,
        eventId: firstEventId,
        status: "PAID",
        subtotal: new Prisma.Decimal(subtotal),
        buyerFee: new Prisma.Decimal(buyerFee),
        sellerFee: new Prisma.Decimal(sellerFee),
        total: new Prisma.Decimal(total),
        currency: ticketTypes[0].event.currency,
        items: {
          create: itemCreates
        },
        payment: {
          create: {
            userId: sessionUserId,
            amount: new Prisma.Decimal(total),
            currency: ticketTypes[0].event.currency,
            provider: "direct",
            status: "CAPTURED",
            paidAt: new Date()
          }
        }
      },
      include: { items: true, payment: true }
    });

    // Ticket үүсгэх
    for (const item of itemCreates) {
      const ticketType = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
      for (let i = 0; i < item.quantity; i++) {
        const code = `TIX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const qrToken = `QR-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
        await prisma.ticket.create({
          data: {
            code,
            qrToken,
            eventId: firstEventId,
            ticketTypeId: ticketType.id,
            orderId: order.id,
            currentOwnerId: sessionUserId,
            status: "ACTIVE",
            originalPrice: ticketType.price,
            resaleAllowed: ticketType.resaleAllowed
          }
        });
      }
      await prisma.ticketType.update({
        where: { id: ticketType.id },
        data: { quantitySold: { increment: item.quantity } }
      });
    }

    await recordAuditLog({
      actorUserId: sessionUserId,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: order.id,
      description: "Created pending payment order",
      metadata: {
        items: requestedItems,
        total
      }
    });

    const orderSummary = requestedItems
      .map((item) => {
        const ticketType = ticketTypes.find((entry) => entry.id === item.ticketTypeId)!;
        return `${item.quantity} ${ticketType.name}`;
      })
      .join(", ");

    await createUserNotification({
      userId: sessionUserId,
      type: "ORDER_CREATED",
      title: "Тасалбар амжилттай авлаа!",
      message: `${ticketTypes[0].event.title} - ${orderSummary} тасалбар таны эзэмшилд орлоо.`,
      actionUrl: "/profile",
      eventId: firstEventId,
      orderId: order.id,
      dedupeKey: `order:${order.id}:created`
    });

    // 7 хоногийн reminder
    const eventStartsAt = new Date(ticketTypes[0].event.startsAt);
    const now = new Date();
    const diffDays = Math.floor((eventStartsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays > 1) {
      await createUserNotification({
        userId: sessionUserId,
        type: "EVENT_REMINDER_24H",
        title: `Event ${diffDays} хоногийн дараа!`,
        message: `${ticketTypes[0].event.title} ${diffDays} хоногийн дараа эхэлнэ. Бэлдэж эхлээрэй.`,
        actionUrl: `/events/${ticketTypes[0].event.slug}`,
        eventId: firstEventId,
        dedupeKey: `order:${order.id}:reminder-7d`
      });
    }

    return NextResponse.json(
      {
        ok: true,
        order,
        message: "Төлбөр амжилттай төлөгдлөө."
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Unable to create order.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function normalizeItems(body: {
  ticketTypeId?: number;
  quantity?: number;
  items?: OrderItemInput[];
}) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items
      .map((item) => ({
        ticketTypeId: Number(item.ticketTypeId ?? 0),
        quantity: Number(item.quantity ?? 0)
      }))
      .filter((item) => item.ticketTypeId > 0 && item.quantity > 0);
  }

  if (body.ticketTypeId && body.quantity) {
    return [
      {
        ticketTypeId: Number(body.ticketTypeId),
        quantity: Number(body.quantity)
      }
    ];
  }

  return [];
}
