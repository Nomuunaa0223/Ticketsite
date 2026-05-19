import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { cacheDel, cacheGet, cacheMGet, cacheSet, cacheSetNx } from "@/lib/redis";
import { emitRealtime } from "@/lib/realtime-events";

export type SeatLock = {
  seatId: number;
  ticketTypeId: number;
  eventId: number;
  label: string;
  userId: number;
  sessionId: string;
  expiresAt: string;
};

type LockInput = {
  seatId: number;
  userId: number;
  sessionId: string;
};

const keyForSeat = (seatId: number) => `seat-lock:${seatId}`;

function expiryDate() {
  return new Date(Date.now() + env.SEAT_LOCK_TTL_SECONDS * 1000);
}

function isSameHolder(lock: SeatLock, input: LockInput) {
  return lock.userId === input.userId && lock.sessionId === input.sessionId;
}

export async function cleanupExpiredSeatReservations(ticketTypeId?: number) {
  const now = new Date();
  const expired = await prisma.seatReservation.findMany({
    where: {
      expiresAt: { lt: now },
      ...(ticketTypeId ? { seat: { ticketTypeId } } : {})
    },
    select: { seatId: true }
  });

  if (expired.length === 0) return;

  const seatIds = expired.map((item) => item.seatId);
  await prisma.$transaction([
    prisma.seatReservation.deleteMany({ where: { seatId: { in: seatIds }, expiresAt: { lt: now } } }),
    prisma.seat.updateMany({
      where: { id: { in: seatIds }, status: "RESERVED" },
      data: { status: "AVAILABLE" }
    })
  ]);

  await cacheDel(...seatIds.map(keyForSeat));
}

export async function getSeatLock(seatId: number) {
  return cacheGet<SeatLock>(keyForSeat(seatId));
}

export async function getSeatLocks(seatIds: number[]) {
  const locks = await cacheMGet<SeatLock>(seatIds.map(keyForSeat));
  return new Map(seatIds.map((seatId, index) => [seatId, locks[index]]));
}

export async function lockSeat(input: LockInput) {
  const existing = await getSeatLock(input.seatId);
  if (existing && !isSameHolder(existing, input)) {
    throw new Error(`${existing.label} seat is already locked.`);
  }

  const seat = await prisma.seat.findUnique({
    where: { id: input.seatId },
    select: {
      id: true,
      label: true,
      status: true,
      ticketTypeId: true,
      ticketType: { select: { eventId: true } }
    }
  });

  if (!seat) throw new Error("Seat not found.");
  if (seat.status === "SOLD") throw new Error(`${seat.label} seat is already sold.`);

  const expiresAt = expiryDate();
  const lock: SeatLock = {
    seatId: seat.id,
    ticketTypeId: seat.ticketTypeId,
    eventId: seat.ticketType.eventId,
    label: seat.label,
    userId: input.userId,
    sessionId: input.sessionId,
    expiresAt: expiresAt.toISOString()
  };

  const cacheKey = keyForSeat(seat.id);
  const cacheLocked = existing
    ? (await cacheSet(cacheKey, lock, env.SEAT_LOCK_TTL_SECONDS), true)
    : await cacheSetNx(cacheKey, lock, env.SEAT_LOCK_TTL_SECONDS);

  if (!cacheLocked) {
    const latest = await getSeatLock(seat.id);
    throw new Error(`${latest?.label ?? seat.label} seat is already locked.`);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.seatReservation.findUnique({ where: { seatId: seat.id } });
      const activeReservation = reservation && reservation.expiresAt > new Date();

      if (activeReservation && (reservation.userId !== input.userId || reservation.sessionId !== input.sessionId)) {
        throw new Error(`${seat.label} seat is already reserved.`);
      }

      if (reservation && !activeReservation) {
        await tx.seatReservation.delete({ where: { id: reservation.id } });
      }

      await tx.seat.update({
        where: { id: seat.id },
        data: { status: "RESERVED" }
      });

      await tx.seatReservation.upsert({
        where: { seatId: seat.id },
        update: {
          userId: input.userId,
          sessionId: input.sessionId,
          expiresAt
        },
        create: {
          seatId: seat.id,
          userId: input.userId,
          sessionId: input.sessionId,
          expiresAt
        }
      });
    });
  } catch (error) {
    await cacheDel(cacheKey);
    throw error;
  }

  emitRealtime("seat-updated", {
    eventId: lock.eventId,
    ticketTypeId: lock.ticketTypeId,
    seatId: lock.seatId,
    label: lock.label,
    status: "RESERVED",
    lockedBy: lock.userId,
    expiresAt: lock.expiresAt
  });

  return lock;
}

export async function releaseSeatLock(input: LockInput) {
  const lock = await getSeatLock(input.seatId);
  if (lock && !isSameHolder(lock, input)) {
    return false;
  }

  const seat = await prisma.seat.findUnique({
    where: { id: input.seatId },
    select: {
      id: true,
      label: true,
      status: true,
      ticketTypeId: true,
      ticketType: { select: { eventId: true } },
      reservation: { select: { userId: true, sessionId: true } }
    }
  });

  if (!seat || seat.status === "SOLD") return false;
  if (seat.reservation && (seat.reservation.userId !== input.userId || seat.reservation.sessionId !== input.sessionId)) {
    return false;
  }

  await prisma.$transaction([
    prisma.seatReservation.deleteMany({ where: { seatId: seat.id, userId: input.userId, sessionId: input.sessionId } }),
    prisma.seat.update({ where: { id: seat.id }, data: { status: "AVAILABLE" } })
  ]);
  await cacheDel(keyForSeat(seat.id));

  emitRealtime("seat-updated", {
    eventId: seat.ticketType.eventId,
    ticketTypeId: seat.ticketTypeId,
    seatId: seat.id,
    label: seat.label,
    status: "AVAILABLE"
  });

  return true;
}

export async function releaseSoldSeatLocks(seatIds: number[]) {
  if (seatIds.length === 0) return;

  await prisma.seatReservation.deleteMany({ where: { seatId: { in: seatIds } } });
  await cacheDel(...seatIds.map(keyForSeat));
}

export async function assertSeatsUsableForOrder(input: {
  seats: Array<{ id: number; label: string; status: string }>;
  userId: number;
  sessionId?: string;
}) {
  const locks = await getSeatLocks(input.seats.map((seat) => seat.id));
  const reservations = await prisma.seatReservation.findMany({
    where: { seatId: { in: input.seats.map((seat) => seat.id) } },
    select: { seatId: true, userId: true, sessionId: true, expiresAt: true }
  });
  const reservationBySeat = new Map(reservations.map((reservation) => [reservation.seatId, reservation]));
  const now = new Date();

  for (const seat of input.seats) {
    if (seat.status === "SOLD") {
      throw new Error(`${seat.label} seat is already sold.`);
    }

    const lock = locks.get(seat.id);
    const reservation = reservationBySeat.get(seat.id);
    const reservedByOther =
      reservation &&
      reservation.expiresAt > now &&
      (reservation.userId !== input.userId || reservation.sessionId !== input.sessionId);
    const lockedByOther =
      lock &&
      (lock.userId !== input.userId || lock.sessionId !== input.sessionId);

    if (reservedByOther || lockedByOther) {
      throw new Error(`${seat.label} seat is locked by another buyer.`);
    }
  }
}

export type SeatLockTransaction = Prisma.TransactionClient;
