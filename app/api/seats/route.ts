import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanupExpiredSeatReservations, getSeatLocks, lockSeat, releaseSeatLock } from "@/lib/seat-locks";

const seatActionSchema = z.object({
  action: z.enum(["lock", "unlock"]),
  seatId: z.coerce.number().int().positive(),
  sessionId: z.string().min(8).max(120)
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketTypeId = Number(searchParams.get("ticketTypeId"));

  if (!ticketTypeId || isNaN(ticketTypeId)) {
    return NextResponse.json({ error: "ticketTypeId шаардлагатай." }, { status: 400 });
  }

  await cleanupExpiredSeatReservations(ticketTypeId);

  const seats = await prisma.seat.findMany({
    where: { ticketTypeId },
    orderBy: [{ row: "asc" }, { number: "asc" }],
    select: { id: true, row: true, number: true, label: true, status: true },
  });

  const locks = await getSeatLocks(seats.map((seat) => seat.id));

  return NextResponse.json({
    seats: seats.map((seat) => {
      const lock = locks.get(seat.id);
      return lock ? { ...seat, status: "RESERVED" as const, lockExpiresAt: lock.expiresAt } : seat;
    })
  });
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const payload = seatActionSchema.parse(await request.json());
    const userId = Number(session.sub);
    const result =
      payload.action === "lock"
        ? await lockSeat({ seatId: payload.seatId, userId, sessionId: payload.sessionId })
        : await releaseSeatLock({ seatId: payload.seatId, userId, sessionId: payload.sessionId });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(error);

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid seat action." }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update seat lock." },
      { status: 409 }
    );
  }
}
