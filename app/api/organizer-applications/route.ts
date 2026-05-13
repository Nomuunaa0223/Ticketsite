import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { organizerApplicationSchema } from "@/lib/validations/organizer-application";

export async function POST(request: Request) {
  try {
    const payload = organizerApplicationSchema.parse(await request.json());

    const application = await prisma.organizerApplication.create({
      data: {
        companyName: payload.companyName,
        contactName: payload.contactName,
        email: payload.email.toLowerCase(),
        phone: payload.phone,
        description: payload.description,
        websiteUrl: payload.websiteUrl,
        socialUrl: payload.socialUrl,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: application.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to submit organizer application." }, { status: 400 });
  }
}
