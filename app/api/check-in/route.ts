import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { canManageAllEvents } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification } from "@/lib/notifications";
import { checkInSchema } from "@/lib/validations/resale";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { organizerProfile: true }
    });

    if (!user || (user.role !== "ORGANIZER" && !canManageAllEvents(user.role))) {
      return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
    }

    const payload = checkInSchema.parse(await request.json());
    const ticket = await prisma.ticket.findUnique({
      where: { code: payload.ticketCode },
      include: {
        event: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const sameOrganizer =
      user.organizerProfile && ticket.event.organizerId === user.organizerProfile.id;

    if (!sameOrganizer && !canManageAllEvents(user.role)) {
      return NextResponse.json({ error: "You cannot check in tickets for this event." }, { status: 403 });
    }

    if (ticket.checkedInAt) {
      return NextResponse.json({ error: "Ticket has already been checked in." }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "CHECKED_IN",
          checkedInAt: new Date()
        }
      });

      await tx.checkIn.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          checkedInById: user.id
        }
      });

      return updatedTicket;
    });

    await recordAuditLog({
      actorUserId: user.id,
      action: "CHECK_IN",
      entityType: "Ticket",
      entityId: result.id,
      description: `Checked in ticket ${ticket.code}`
    });

    await createUserNotification({
      userId: ticket.currentOwnerId,
      type: "QR_CHECKED_IN",
      title: "Ticket checked in",
      message: `Your ticket for ${ticket.event.title} was scanned successfully.`,
      actionUrl: `/tickets/${ticket.code}`,
      eventId: ticket.eventId,
      ticketId: ticket.id,
      dedupeKey: `ticket:${ticket.id}:checked-in`
    });

    return NextResponse.json({ ok: true, ticket: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to check in ticket." }, { status: 400 });
  }
}
