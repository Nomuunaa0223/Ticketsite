import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const CLOUDINARY_FOLDER = "tixora/events";

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(session.sub) },
    });

    if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Upload access required." }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const extension = allowedTypes.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are supported." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    if (isCloudinaryConfigured()) {
      const { default: cloudinary } = await import("@/lib/cloudinary");
      const secureUrl = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: CLOUDINARY_FOLDER, resource_type: "image" }, (error, result) => {
            if (error || !result) {
              reject(new Error(error?.message ?? "Cloudinary upload failed."));
            } else {
              resolve(result.secure_url);
            }
          })
          .end(bytes);
      });
      return NextResponse.json({ ok: true, url: secureUrl });
    }

    // Local fallback
    const fileName = `${randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "events");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), bytes);
    return NextResponse.json({ ok: true, url: `/uploads/events/${fileName}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[/api/uploads]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
  );
}
