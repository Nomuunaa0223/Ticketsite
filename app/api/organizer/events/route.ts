import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { createEventWithTicketTypes } from "@/lib/events";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const customVenueSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  country: z.string().min(2).max(80),
  address: z.string().min(4).max(240),
  timezone: z.string().min(3).max(80),
  capacity: z.coerce.number().int().positive().max(1_000_000),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      include: { organizerProfile: true }
    });

    if (!user || user.role !== "ORGANIZER" || !user.organizerProfile) {
      return NextResponse.json({ error: "Organizer access required." }, { status: 403 });
    }

    const body = await request.json();

    if (body.customVenue) {
      const customVenue = customVenueSchema.parse(body.customVenue);
      const existingVenue = await prisma.venue.findFirst({
        where: {
          name: customVenue.name,
          city: customVenue.city,
          address: customVenue.address
        }
      });
      const venue =
        existingVenue ??
        (await prisma.venue.create({
          data: customVenue
        }));

      body.venueId = venue.id;
      delete body.customVenue;
    }

    const event = await createEventWithTicketTypes(body, user);

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid event details." },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create event." }, { status: 400 });
  }
}
