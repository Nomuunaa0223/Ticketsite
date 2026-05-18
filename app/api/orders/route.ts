import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type OrderItemInput = {
  ticketTypeId?: number;
  quantity?: number;
  seatIds?: number[];
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
      return NextResponse.json({ error: "Дор хаяж нэг тасалбар сонгоно уу." }, { status: 400 });
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { id: { in: requestedItems.map((item) => item.ticketTypeId) } },
      include: { event: true },
    });

    if (ticketTypes.length !== requestedItems.length) {
      return NextResponse.json({ error: "Тасалбарын төрөл олдсонгүй." }, { status: 404 });
    }

    const firstEventId = ticketTypes[0]?.eventId;
    const allSameEvent = ticketTypes.every((t) => t.eventId === firstEventId);

    if (!allSameEvent || !firstEventId) {
      return NextResponse.json({ error: "Бүх тасалбар нэг арга хэмжээнд байх ёстой." }, { status: 400 });
    }

    // Суудалтай ticket type-уудын суудлуудыг нэг дор баталгаажуулна
    const seatItemsToValidate = requestedItems.filter((item) => item.seatIds && item.seatIds.length > 0);
    if (seatItemsToValidate.length > 0) {
      const allSeatIds = seatItemsToValidate.flatMap((item) => item.seatIds!);
      const seats = await prisma.seat.findMany({
        where: { id: { in: allSeatIds } },
        select: { id: true, ticketTypeId: true, status: true, label: true },
      });

      for (const item of seatItemsToValidate) {
        for (const seatId of item.seatIds!) {
          const seat = seats.find((s) => s.id === seatId);
          if (!seat) return NextResponse.json({ error: `Суудал (${seatId}) олдсонгүй.` }, { status: 404 });
          if (seat.ticketTypeId !== item.ticketTypeId)
            return NextResponse.json({ error: `Суудал ${seat.label} энэ тасалбарт хамаарахгүй.` }, { status: 400 });
          if (seat.status !== "AVAILABLE")
            return NextResponse.json({ error: `${seat.label} суудал аль хэдийн захиалагдсан байна.` }, { status: 409 });
        }
      }
    }

    let subtotal = 0;
    const itemCreates = requestedItems.map((item) => {
      const ticketType = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
      const quantity = item.quantity;

      if (quantity < 1 || quantity > ticketType.maxPerOrder) {
        throw new Error(`${ticketType.name}-ийн тоо хэмжээ хязгаараас гарсан байна.`);
      }

      if (!item.seatIds || item.seatIds.length === 0) {
        const remaining = Math.max(0, ticketType.quantityTotal - ticketType.quantitySold);
        if (quantity > remaining) {
          throw new Error(`${ticketType.name}-д хангалттай тасалбар үлдээгүй байна.`);
        }
      }

      const lineSubtotal = ticketType.price.toNumber() * quantity;
      subtotal += lineSubtotal;

      return {
        ticketTypeId: ticketType.id,
        quantity,
        seatIds: item.seatIds,
        unitPrice: ticketType.price,
        lineSubtotal: new Prisma.Decimal(lineSubtotal),
        lineBuyerFee: new Prisma.Decimal(0),
        lineSellerFee: new Prisma.Decimal(0),
        lineTotal: new Prisma.Decimal(lineSubtotal),
      };
    });

    const order = await prisma.order.create({
      data: {
        userId: sessionUserId,
        eventId: firstEventId,
        status: "PAID",
        subtotal: new Prisma.Decimal(subtotal),
        buyerFee: new Prisma.Decimal(0),
        sellerFee: new Prisma.Decimal(0),
        total: new Prisma.Decimal(subtotal),
        currency: ticketTypes[0].event.currency,
        items: {
          create: itemCreates.map(({ seatIds: _seatIds, ...rest }) => rest),
        },
        payment: {
          create: {
            userId: sessionUserId,
            amount: new Prisma.Decimal(subtotal),
            currency: ticketTypes[0].event.currency,
            provider: "direct",
            status: "CAPTURED",
            paidAt: new Date(),
          },
        },
      },
      include: { items: true, payment: true },
    });

    // Тасалбар үүсгэх + суудал хаах
    for (const item of itemCreates) {
      const ticketType = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
      const seatIds = item.seatIds ?? [];

      for (let i = 0; i < item.quantity; i++) {
        const code = `TIX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const qrToken = `QR-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
        const seatId = seatIds[i] ?? null;

        const newTicket = await prisma.ticket.create({
          data: {
            code,
            qrToken,
            eventId: firstEventId,
            ticketTypeId: ticketType.id,
            orderId: order.id,
            currentOwnerId: sessionUserId,
            status: "ACTIVE",
            originalPrice: ticketType.price,
            resaleAllowed: ticketType.resaleAllowed,
            ...(seatId ? { seatId } : {}),
          },
        });

        if (seatId) {
          await prisma.seat.update({ where: { id: seatId }, data: { status: "SOLD" } });
        }

        await prisma.ticketOwnershipHistory.create({
          data: { ticketId: newTicket.id, fromUserId: null, toUserId: sessionUserId, acquiredVia: "PURCHASE" },
        });
      }

      await prisma.ticketType.update({
        where: { id: ticketType.id },
        data: { quantitySold: { increment: item.quantity } },
      });
    }

    await recordAuditLog({
      actorUserId: sessionUserId,
      action: "ORDER_CREATED",
      entityType: "Order",
      entityId: order.id,
      description: "Created order",
      metadata: { items: requestedItems, total: subtotal },
    });

    const orderSummary = requestedItems
      .map((item) => {
        const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
        return `${item.quantity} ${tt.name}`;
      })
      .join(", ");

    await createUserNotification({
      userId: sessionUserId,
      type: "ORDER_CREATED",
      title: "Тасалбар амжилттай авлаа!",
      message: `${ticketTypes[0].event.title} — ${orderSummary} тасалбар таны эзэмшилд орлоо.`,
      actionUrl: "/profile",
      eventId: firstEventId,
      orderId: order.id,
      dedupeKey: `order:${order.id}:created`,
    });

    const eventStartsAt = new Date(ticketTypes[0].event.startsAt);
    const diffDays = Math.floor((eventStartsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays > 1) {
      await createUserNotification({
        userId: sessionUserId,
        type: "EVENT_REMINDER_24H",
        title: `Арга хэмжээ ${diffDays} хоногийн дараа!`,
        message: `${ticketTypes[0].event.title} ${diffDays} хоногийн дараа эхэлнэ.`,
        actionUrl: `/events/${ticketTypes[0].event.slug}`,
        eventId: firstEventId,
        dedupeKey: `order:${order.id}:reminder-7d`,
      });
    }

    return NextResponse.json({ ok: true, order, message: "Тасалбар амжилттай авлаа." }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Захиалга үүсгэхэд алдаа гарлаа.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function normalizeItems(body: { ticketTypeId?: number; quantity?: number; items?: OrderItemInput[] }) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items
      .map((item) => ({
        ticketTypeId: Number(item.ticketTypeId ?? 0),
        quantity: Array.isArray(item.seatIds) && item.seatIds.length > 0
          ? item.seatIds.length
          : Number(item.quantity ?? 0),
        seatIds: Array.isArray(item.seatIds) && item.seatIds.length > 0
          ? item.seatIds.map(Number)
          : undefined,
      }))
      .filter((item) => item.ticketTypeId > 0 && item.quantity > 0);
  }

  if (body.ticketTypeId && body.quantity) {
    return [{ ticketTypeId: Number(body.ticketTypeId), quantity: Number(body.quantity), seatIds: undefined }];
  }

  return [];
}
