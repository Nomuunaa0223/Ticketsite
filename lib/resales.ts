import { prisma } from "@/lib/prisma";

export async function getPublicResaleListings() {
  try {
    return await prisma.resaleListing.findMany({
      where: {
        status: {
          in: ["ACTIVE", "SOLD"]
        }
      },
      include: {
        seller: true,
        event: {
          include: {
            venue: true,
            category: true
          }
        },
        ticketType: true,
        ticket: true
      },
      orderBy: [{ status: "asc" }, { listedAt: "desc" }]
    });
  } catch {
    return [];
  }
}
