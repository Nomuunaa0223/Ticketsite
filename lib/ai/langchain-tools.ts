import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { recommendEvents, serializeRecommendedEvent } from "@/lib/ai/recommendations";
import { prisma } from "@/lib/prisma";

export function createTixoraTools(userId?: number) {
  return [
    tool(
      async ({ query, limit }) => {
        const events = await recommendEvents(query, limit ?? 5);
        return JSON.stringify(events.map(serializeRecommendedEvent));
      },
      {
        name: "searchEvents",
        description: "Find published events by keyword or semantic vibe, such as EDM, VIP, underground rave, sport, or city.",
        schema: z.object({
          query: z.string().min(1),
          limit: z.number().int().min(1).max(10).optional()
        })
      }
    ),
    tool(
      async ({ ticketTypeId, category }) => {
        const seats = await prisma.seat.findMany({
          where: {
            ticketTypeId,
            status: "AVAILABLE",
            ...(category ? { category } : {})
          },
          orderBy: [{ row: "asc" }, { number: "asc" }],
          take: 20,
          select: {
            id: true,
            label: true,
            row: true,
            number: true,
            category: true,
            isAccessible: true,
            status: true
          }
        });
        return JSON.stringify(seats);
      },
      {
        name: "searchSeats",
        description: "Search available seats for a ticket type. Use this when the user asks if VIP or specific seats are left.",
        schema: z.object({
          ticketTypeId: z.number().int().positive(),
          category: z.enum(["GA", "STANDARD", "PREMIUM", "VIP", "ACCESSIBLE"]).optional()
        })
      }
    ),
    tool(
      async () => {
        if (!userId) return JSON.stringify({ error: "User must be logged in." });
        const tickets = await prisma.ticket.findMany({
          where: { currentOwnerId: userId },
          include: {
            event: { select: { title: true, slug: true, startsAt: true } },
            seat: { select: { label: true } },
            ticketType: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        });
        return JSON.stringify(
          tickets.map((ticket) => ({
            code: ticket.code,
            status: ticket.status,
            event: ticket.event.title,
            eventSlug: ticket.event.slug,
            startsAt: ticket.event.startsAt,
            ticketType: ticket.ticketType.name,
            seat: ticket.seat?.label ?? null
          }))
        );
      },
      {
        name: "getUserTickets",
        description: "Return the current user's latest tickets.",
        schema: z.object({})
      }
    )
  ];
}
