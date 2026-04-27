import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";
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
      where: { id: session.sub }
    });

    if (!reviewer || (reviewer.role !== "ADMIN" && reviewer.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
    }

    const { eventId } = await context.params;
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
      where: { id: eventId },
      data: {
        status: nextStatus,
        reviewNotes: body.reviewNotes,
        reviewedById: reviewer.id,
        publishedAt: nextStatus === EventStatus.PUBLISHED ? new Date() : null
      }
    });

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
