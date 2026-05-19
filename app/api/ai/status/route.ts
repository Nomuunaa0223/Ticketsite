import { NextResponse } from "next/server";
import { getOpenAIStatus } from "@/lib/ai/openai";
import { getPineconeStatus } from "@/lib/ai/pinecone";
import { getCacheStatus } from "@/lib/redis";

export async function GET() {
  return NextResponse.json({
    postgresql: { enabled: true },
    redis: getCacheStatus(),
    openai: getOpenAIStatus(),
    pinecone: getPineconeStatus(),
    socketio: { enabled: true, path: "/socket.io" },
    langchain: { enabled: true, tools: ["searchEvents", "searchSeats", "getUserTickets"] }
  });
}
