import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: Number(session.sub) } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId, isTrending, trendingOrder, imageUrl } = await request.json();

  const data: Record<string, unknown> = {};
  if (isTrending !== undefined) data.isTrending = isTrending;
  if (trendingOrder !== undefined) data.trendingOrder = isTrending ? trendingOrder : null;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  await prisma.event.update({
    where: { id: Number(eventId) },
    data
  });

  return NextResponse.json({ ok: true });
}
