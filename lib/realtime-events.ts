import { EventEmitter } from "node:events";

export type SeatRealtimePayload = {
  eventId: number;
  ticketTypeId: number;
  seatId: number;
  label: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
  lockedBy?: number;
  expiresAt?: string;
};

export type SalesRealtimePayload = {
  eventId: number;
  ticketTypeId: number;
  quantitySold: number;
  orderId: number;
};

export type CheckInRealtimePayload = {
  eventId: number;
  ticketId: number;
  ticketCode: string;
  status: "VALID" | "ALREADY_USED";
  scannedAt: string;
};

type RealtimeEvents = {
  "seat-updated": SeatRealtimePayload;
  "sale-updated": SalesRealtimePayload;
  "qr-scan": CheckInRealtimePayload;
};

type GlobalWithRealtime = typeof globalThis & {
  tixoraRealtimeHub?: EventEmitter;
};

const globalForRealtime = globalThis as GlobalWithRealtime;

export const realtimeHub = globalForRealtime.tixoraRealtimeHub ?? new EventEmitter();
realtimeHub.setMaxListeners(50);
globalForRealtime.tixoraRealtimeHub = realtimeHub;

export function emitRealtime<EventName extends keyof RealtimeEvents>(
  eventName: EventName,
  payload: RealtimeEvents[EventName]
) {
  realtimeHub.emit(eventName, payload);
}
