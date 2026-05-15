import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(64).max(64),
  password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой."),
});

export async function POST(request: Request) {
  try {
    const { token, password } = schema.parse(await request.json());

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordSetupToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Холбоос хүчингүй болсон байна." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordSetupToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "issues" in (error as { issues?: unknown })) {
      return NextResponse.json({ error: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." }, { status: 400 });
    }
    return NextResponse.json({ error: "Алдаа гарлаа." }, { status: 400 });
  }
}
