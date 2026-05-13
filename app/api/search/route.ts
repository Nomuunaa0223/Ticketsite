import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) return NextResponse.json([]);

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { venue: { name: { contains: q, mode: "insensitive" } } },
      ]
    },
    select: { slug: true, title: true, imageUrl: true, cardImageUrl: true, category: { select: { name: true } }, venue: { select: { name: true, city: true } } },
    take: 6,
    orderBy: { startsAt: "asc" }
  });

  return NextResponse.json(events);
}
