import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { realtimeHub, startRealtimeBridge } from "../lib/realtime-events";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.SOCKET_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? `http://${hostname}:${port}`,
      credentials: true
    }
  });

  startRealtimeBridge();

  io.on("connection", (socket) => {
    socket.on("join-event", (eventId: number) => {
      if (Number.isFinite(eventId)) {
        socket.join(`event:${eventId}`);
      }
    });
  });

  realtimeHub.on("seat-updated", (payload) => {
    io.to(`event:${payload.eventId}`).emit("seat-updated", payload);
    io.emit("seat-updated", payload);
  });

  realtimeHub.on("sale-updated", (payload) => {
    io.to(`event:${payload.eventId}`).emit("sale-updated", payload);
  });

  realtimeHub.on("qr-scan", (payload) => {
    io.to(`event:${payload.eventId}`).emit("qr-scan", payload);
  });

  httpServer.listen(port, () => {
    console.log(`Tixora realtime server ready at http://${hostname}:${port}`);
  });
});
