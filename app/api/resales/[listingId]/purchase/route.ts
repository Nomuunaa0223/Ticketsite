import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { listingId } = await context.params;
    const parsedListingId = Number(listingId);

    if (!Number.isInteger(parsedListingId) || parsedListingId <= 0) {
      return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
    }

    const buyerId = Number(session.sub);

    const result = await prisma.$transaction(async (tx) => {
      const listing = await tx.resaleListing.findUnique({
        where: { id: parsedListingId },
        include: {
          ticket: true,
          event: true,
          ticketType: true,
          seller: true
        }
      });

      if (!listing) {
        throw new Error("Listing not found.");
      }

      if (listing.status !== "ACTIVE") {
        throw new Error("This ticket is no longer available.");
      }

      if (listing.sellerId === buyerId) {
        throw new Error("You cannot buy your own ticket.");
      }

      if (listing.ticket.currentOwnerId !== listing.sellerId) {
        throw new Error("Ticket owner changed. Listing is no longer valid.");
      }

      if (listing.ticket.checkedInAt || listing.ticket.status !== "ACTIVE") {
        throw new Error("This ticket cannot be transferred.");
      }

      const askPrice = listing.askPrice;
      const buyerFee = listing.buyerFee;
      const sellerFee = listing.sellerFee;
      const total = askPrice.add(buyerFee);

      const claimed = await tx.resaleListing.updateMany({
        where: {
          id: listing.id,
          status: "ACTIVE",
          sellerId: listing.sellerId
        },
        data: {
          status: "SOLD",
          buyerId,
          soldAt: new Date()
        }
      });

      if (claimed.count !== 1) {
        throw new Error("This ticket was just purchased by another user.");
      }

      const order = await tx.order.create({
        data: {
          userId: buyerId,
          eventId: listing.eventId,
          status: "PAID",
          subtotal: askPrice,
          buyerFee,
          sellerFee,
          total,
          currency: listing.event.currency,
          items: {
            create: {
              ticketTypeId: listing.ticketTypeId,
              quantity: 1,
              unitPrice: askPrice,
              lineSubtotal: askPrice,
              lineBuyerFee: buyerFee,
              lineSellerFee: sellerFee,
              lineTotal: total
            }
          },
          payment: {
            create: {
              userId: buyerId,
              amount: total,
              currency: listing.event.currency,
              provider: "resale-direct",
              status: "CAPTURED",
              paidAt: new Date(),
              metadata: {
                resaleListingId: listing.id,
                sellerId: listing.sellerId,
                ticketId: listing.ticketId
              }
            }
          }
        }
      });

      await tx.ticket.update({
        where: { id: listing.ticketId },
        data: {
          currentOwnerId: buyerId,
          currentListedPrice: null,
          orderId: order.id,
          status: "ACTIVE"
        }
      });

      await tx.resaleListing.update({
        where: { id: listing.id },
        data: { saleOrderId: order.id }
      });

      await tx.resaleListing.updateMany({
        where: {
          ticketId: listing.ticketId,
          status: "ACTIVE"
        },
        data: {
          status: "CANCELLED"
        }
      });

      await tx.ticketOwnershipHistory.create({
        data: {
          ticketId: listing.ticketId,
          fromUserId: listing.sellerId,
          toUserId: buyerId,
          acquiredVia: "RESALE",
          notes: `Purchased resale listing #${listing.id}`
        }
      });

      return { listing, order };
    });

    await recordAuditLog({
      actorUserId: buyerId,
      action: "RESALE_PURCHASED",
      entityType: "ResaleListing",
      entityId: result.listing.id,
      description: `Purchased resale ticket ${result.listing.ticket.code}`,
      metadata: {
        orderId: result.order.id,
        ticketId: result.listing.ticketId,
        sellerId: result.listing.sellerId
      }
    });

    await Promise.all([
      createUserNotification({
        userId: buyerId,
        type: "ORDER_CREATED",
        title: "Ticket таны profile рүү шилжлээ",
        message: `${result.listing.event.title} - ${result.listing.ticketType.name} ticket таны эзэмшилд орлоо.`,
        actionUrl: "/profile",
        eventId: result.listing.eventId,
        ticketId: result.listing.ticketId,
        orderId: result.order.id,
        dedupeKey: `resale:${result.listing.id}:buyer`
      }),
      createUserNotification({
        userId: result.listing.sellerId,
        type: "ORDER_CREATED",
        title: "Таны ticket зарагдлаа",
        message: `${result.listing.event.title} - ${result.listing.ticketType.name} ticket шинэ эзэмшигч рүү шилжлээ.`,
        actionUrl: "/profile",
        eventId: result.listing.eventId,
        ticketId: result.listing.ticketId,
        orderId: result.order.id,
        dedupeKey: `resale:${result.listing.id}:seller`
      })
    ]);

    return NextResponse.json({ ok: true, orderId: result.order.id });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Unable to purchase resale ticket.";
    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
