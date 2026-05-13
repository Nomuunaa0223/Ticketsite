import { prisma } from "@/lib/prisma";

export async function getPublicResaleListings(take = 12) {
  try {
    return await prisma.resaleListing.findMany({
      where: {
        status: {
          in: ["ACTIVE", "SOLD"]
        }
      },
      select: {
        id: true,
        status: true,
        askPrice: true,
        buyerFee: true,
        listedAt: true,
        soldAt: true,
        sellerId: true,
        seller: { select: { fullName: true } },
        event: {
          select: {
            title: true,
            slug: true,
            currency: true,
            imageUrl: true,
            cardImageUrl: true,
            venue: { select: { name: true, city: true } },
            category: { select: { name: true, slug: true } }
          }
        },
        ticketType: { select: { name: true } }
      },
      orderBy: [{ status: "asc" }, { listedAt: "desc" }],
      take
    });
  } catch {
    return [];
  }
}
