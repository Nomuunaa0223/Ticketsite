import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${user.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const avatarUrl = `/uploads/avatars/${filename}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  return NextResponse.json({ avatarUrl });
}
