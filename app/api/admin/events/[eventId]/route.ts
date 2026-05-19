import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
import { createUserNotification, notifyAllUsersOfNewEvent } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ eventId: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const reviewer = await prisma.user.findUnique({
      where: { id: Number(session.sub) }
    });

    if (!reviewer || reviewer.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { eventId } = await context.params;
    const parsedEventId = Number(eventId);
    const body = (await request.json()) as {
      decision?: "approve" | "reject";
      reviewNotes?: string;
    };

    if (!body.decision) {
      return NextResponse.json({ error: "Decision is required." }, { status: 400 });
    }

    const nextStatus =
      body.decision === "approve" ? EventStatus.PUBLISHED : EventStatus.REJECTED;

    const event = await prisma.event.update({
      where: { id: parsedEventId },
      data: {
        status: nextStatus,
        reviewNotes: body.reviewNotes,
        reviewedById: reviewer.id,
        publishedAt: nextStatus === EventStatus.PUBLISHED ? new Date() : null
      },
      include: { organizer: { include: { user: true } }, category: true }
    });

    const isApproved = body.decision === "approve";

    if (event.organizer?.user) {
      await createUserNotification({
        userId: event.organizer.user.id,
        type: isApproved ? "EVENT_PUBLISHED" : "EVENT_REJECTED",
        title: isApproved ? "Таны event нийтлэгдлээ!" : "Event татгалзагдлаа",
        message: isApproved
          ? `"${event.title}" event амжилттай нийтлэгдэж, хэрэглэгчид харах боломжтой боллоо.`
          : `"${event.title}" event татгалзагдлаа.${body.reviewNotes ? ` Шалтгаан: ${body.reviewNotes}` : ""}`,
        actionUrl: `/organizer/dashboard`,
        eventId: event.id,
        dedupeKey: `event:${event.id}:${body.decision}`,
      });
    }

    if (isApproved) {
      void notifyAllUsersOfNewEvent({
        eventId: event.id,
        eventTitle: event.title,
        eventSlug: event.slug,
        category: event.category.name,
      });
    }

    await recordAuditLog({
      actorUserId: reviewer.id,
      action: body.decision === "approve" ? "EVENT_APPROVED" : "EVENT_REJECTED",
      entityType: "Event",
      entityId: event.id,
      description: `Review decision applied to ${event.title}`,
      metadata: { decision: body.decision, reviewNotes: body.reviewNotes ?? null }
    });

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to review event." }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { id: Number(session.sub) } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const { eventId } = await context.params;
    const id = Number(eventId);

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const ticketTypeIds = (await tx.ticketType.findMany({
        where: { eventId: id },
        select: { id: true },
      })).map((t) => t.id);

      const ticketIds = (await tx.ticket.findMany({
        where: { ticketTypeId: { in: ticketTypeIds } },
        select: { id: true },
      })).map((t) => t.id);

      await tx.checkIn.deleteMany({ where: { ticketId: { in: ticketIds } } });
      await tx.resaleListing.deleteMany({ where: { ticketId: { in: ticketIds } } });
      await tx.smallEventTicketClaim.deleteMany({ where: { eventId: id } });
      await tx.ticket.deleteMany({ where: { ticketTypeId: { in: ticketTypeIds } } });
      await tx.order.deleteMany({ where: { eventId: id } });
      await tx.aiAgentArtifact.deleteMany({ where: { eventId: id } });
      await tx.aiAgentRun.updateMany({ where: { eventId: id }, data: { eventId: null } });
      await tx.notification.deleteMany({ where: { eventId: id } });
      await tx.ticketType.deleteMany({ where: { eventId: id } });
      await tx.event.delete({ where: { id } });
    });

    await recordAuditLog({
      actorUserId: admin.id,
      action: "EVENT_DELETED",
      entityType: "Event",
      entityId: id,
      description: `Admin deleted event: ${event.title}`,
      metadata: { status: event.status }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete event." }, { status: 400 });
  }
}
