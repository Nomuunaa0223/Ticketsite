import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { upsertEventEmbedding } from "@/lib/ai/pinecone";
import { canManageAllEvents } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      select: { role: true }
    });

    if (!user || !canManageAllEvents(user.role)) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { eventId?: number };
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        ...(body.eventId ? { id: Number(body.eventId) } : {})
      },
      include: { category: true, venue: true },
      take: body.eventId ? 1 : 100
    });

    const results = await Promise.all(
      events.map(async (event) => {
        try {
          const result = await upsertEventEmbedding({
            id: event.id,
            title: event.title,
            slug: event.slug,
            summary: event.summary,
            description: event.description,
            category: event.category.name,
            city: event.venue.city
          });

          return { eventId: event.id, title: event.title, ...result };
        } catch (error) {
          return {
            eventId: event.id,
            title: event.title,
            indexed: false,
            reason: error instanceof Error ? error.message : "Unknown indexing error."
          };
        }
      })
    );

    return NextResponse.json({
      indexed: results.filter((result) => result.indexed).length,
      skipped: results.filter((result) => !result.indexed).length,
      total: results.length,
      results
    });
  } catch (error) {
    console.error("[ai:index-events]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to index events." },
      { status: 500 }
    );
  }
}
