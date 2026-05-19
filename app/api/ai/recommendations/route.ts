import { NextResponse } from "next/server";
import { recommendEvents, serializeRecommendedEvent } from "@/lib/ai/recommendations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "q query is required." }, { status: 400 });
  }

  const events = await recommendEvents(query, Number(searchParams.get("limit") ?? 6));
  return NextResponse.json({
    events: events.map(serializeRecommendedEvent)
  });
}
