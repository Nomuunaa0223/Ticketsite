import { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { queryEventEmbeddings } from "@/lib/ai/pinecone";

export async function recommendEvents(query: string, limit = 6) {
  const semanticMatches = await queryEventEmbeddings(query, limit);

  if (semanticMatches?.length) {
    const events = await prisma.event.findMany({
      where: {
        id: { in: semanticMatches.map((match) => match.eventId) },
        status: EventStatus.PUBLISHED,
        visibility: "PUBLIC"
      },
      include: {
        category: true,
        venue: true,
        ticketTypes: {
          orderBy: { price: "asc" },
          take: 1
        }
      }
    });
    const scoreById = new Map(semanticMatches.map((match) => [match.eventId, match.score]));

    return events
      .map((event) => ({ event, score: scoreById.get(event.id) ?? 0, source: "pinecone" as const }))
      .sort((a, b) => b.score - a.score);
  }

  const events = await prisma.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      visibility: "PUBLIC",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { summary: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
        { venue: { city: { contains: query, mode: "insensitive" } } }
      ]
    },
    include: {
      category: true,
      venue: true,
      ticketTypes: {
        orderBy: { price: "asc" },
        take: 1
      }
    },
    orderBy: { startsAt: "asc" },
    take: limit
  });

  return events.map((event) => ({ event, score: 0, source: "postgres" as const }));
}

export function serializeRecommendedEvent(item: Awaited<ReturnType<typeof recommendEvents>>[number]) {
  const lowestTicket = item.event.ticketTypes[0];

  return {
    id: item.event.id,
    title: item.event.title,
    slug: item.event.slug,
    summary: item.event.summary,
    startsAt: item.event.startsAt,
    imageUrl: item.event.cardImageUrl ?? item.event.imageUrl,
    category: item.event.category.name,
    venue: item.event.venue.name,
    city: item.event.venue.city,
    lowestPrice: lowestTicket ? Number(lowestTicket.price) : null,
    score: item.score,
    source: item.source
  };
}
