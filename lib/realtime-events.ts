import { EventEmitter } from "node:events";
import Redis from "ioredis";

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
  tixoraRealtimePublisher?: Redis;
  tixoraRealtimeSubscriber?: Redis;
  tixoraRealtimeBridgeStarted?: boolean;
  tixoraRealtimeSourceId?: string;
};

const globalForRealtime = globalThis as GlobalWithRealtime;
const realtimeChannel = "tixora:realtime-events";
const sourceId =
  globalForRealtime.tixoraRealtimeSourceId ??
  `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

globalForRealtime.tixoraRealtimeSourceId = sourceId;

export const realtimeHub = globalForRealtime.tixoraRealtimeHub ?? new EventEmitter();
realtimeHub.setMaxListeners(50);
globalForRealtime.tixoraRealtimeHub = realtimeHub;

export function emitRealtime<EventName extends keyof RealtimeEvents>(
  eventName: EventName,
  payload: RealtimeEvents[EventName]
) {
  realtimeHub.emit(eventName, payload);

  const publisher = getRealtimePublisher();
  if (publisher) {
    publisher
      .publish(realtimeChannel, JSON.stringify({ sourceId, eventName, payload }))
      .catch((error) => console.error("[realtime:publish]", error));
  }
}

export function startRealtimeBridge() {
  if (!process.env.REDIS_URL || globalForRealtime.tixoraRealtimeBridgeStarted) return;

  const subscriber =
    globalForRealtime.tixoraRealtimeSubscriber ??
    new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

  globalForRealtime.tixoraRealtimeSubscriber = subscriber;
  globalForRealtime.tixoraRealtimeBridgeStarted = true;

  subscriber.subscribe(realtimeChannel).catch((error) => console.error("[realtime:subscribe]", error));
  subscriber.on("message", (_channel, message) => {
    try {
      const event = JSON.parse(message) as {
        sourceId: string;
        eventName: keyof RealtimeEvents;
        payload: RealtimeEvents[keyof RealtimeEvents];
      };

      if (event.sourceId === sourceId) return;
      realtimeHub.emit(event.eventName, event.payload);
    } catch (error) {
      console.error("[realtime:message]", error);
    }
  });
}

function getRealtimePublisher() {
  if (!process.env.REDIS_URL) return null;

  const publisher =
    globalForRealtime.tixoraRealtimePublisher ??
    new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });

  globalForRealtime.tixoraRealtimePublisher = publisher;
  return publisher;
}
