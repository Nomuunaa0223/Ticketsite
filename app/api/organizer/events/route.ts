import { NextResponse } from "next/server";
import { createEventWithTicketTypes } from "@/lib/events";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { organizerProfile: true }
    });

    if (!user || user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
    }

    const event = await createEventWithTicketTypes(await request.json(), user);

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create event." }, { status: 400 });
  }
}
