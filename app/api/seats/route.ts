import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketTypeId = Number(searchParams.get("ticketTypeId"));

  if (!ticketTypeId || isNaN(ticketTypeId)) {
    return NextResponse.json({ error: "ticketTypeId шаардлагатай." }, { status: 400 });
  }

  const seats = await prisma.seat.findMany({
    where: { ticketTypeId },
    orderBy: [{ row: "asc" }, { number: "asc" }],
    select: { id: true, row: true, number: true, label: true, status: true },
  });

  return NextResponse.json({ seats });
}
