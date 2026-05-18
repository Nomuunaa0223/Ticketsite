import { createHash, randomUUID } from "crypto";
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
      include: { organizerProfile: true },
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
      const uploaded = await uploadToCloudinary(bytes, file.type);
      return NextResponse.json({ ok: true, url: uploaded.secureUrl });
    }

    const fileName = `${randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "events");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, bytes);

    return NextResponse.json({ ok: true, url: `/uploads/events/${fileName}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
  );
}

async function uploadToCloudinary(bytes: Buffer, contentType: string) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME!.toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1")
    .update(`folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  const form = new FormData();
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;

  form.set("file", new Blob([arrayBuffer], { type: contentType }));
  form.set("api_key", env.CLOUDINARY_API_KEY!);
  form.set("timestamp", timestamp);
  form.set("folder", CLOUDINARY_FOLDER);
  form.set("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  const payload = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message ?? "Cloudinary upload failed.");
  }

  return { secureUrl: payload.secure_url };
}
