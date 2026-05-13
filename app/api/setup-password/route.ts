import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { hashPasswordSetupToken } from "@/lib/password-setup";
import { prisma } from "@/lib/prisma";
import { passwordSetupSchema } from "@/lib/validations/organizer-application";

export async function POST(request: Request) {
  try {
    const payload = passwordSetupSchema.parse(await request.json());
    const tokenHash = hashPasswordSetupToken(payload.token);
    const now = new Date();

    const setupToken = await prisma.passwordSetupToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      include: { user: true },
    });

    if (!setupToken) {
      return NextResponse.json({ error: "This setup link is invalid or expired." }, { status: 400 });
    }

    const passwordHash = await hashPassword(payload.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: setupToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordSetupToken.update({
        where: { id: setupToken.id },
        data: { usedAt: now },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to set password." }, { status: 400 });
  }
}
