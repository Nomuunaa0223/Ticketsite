import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
      select: { role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE" || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Upload access required." }, { status: 403 });
    }

    const body = (await req.json()) as { image?: unknown };

    if (typeof body.image !== "string" || !body.image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }

    if (body.image.length > 7_000_000) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const uploaded = await cloudinary.uploader.upload(body.image, {
      folder: "events",
    });

    return NextResponse.json({
      url: uploaded.secure_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[/api/upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
