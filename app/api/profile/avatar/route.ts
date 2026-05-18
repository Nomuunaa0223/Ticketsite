import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Зураг файл шаардлагатай." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Зөвхөн JPG, PNG, WebP, GIF зураг дэмжигдэнэ." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Зурагны хэмжээ 5MB-аас бага байх ёстой." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    let avatarUrl: string;

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      const { default: cloudinary } = await import("@/lib/cloudinary");
      avatarUrl = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "tixora/avatars", resource_type: "image", transformation: [{ width: 400, height: 400, crop: "fill" }] },
            (error, result) => {
              if (error || !result) reject(new Error(error?.message ?? "Cloudinary upload failed."));
              else resolve(result.secure_url);
            }
          )
          .end(bytes);
      });
    } else {
      return NextResponse.json({ error: "Image upload тохируулагдаагүй байна." }, { status: 500 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[/api/profile/avatar]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
