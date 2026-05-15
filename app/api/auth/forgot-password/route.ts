import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { env } from "@/lib/env";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) {
      console.log("[forgot-password] no user found for email:", email.toLowerCase());
      return NextResponse.json({ ok: true });
    }

    console.log("[forgot-password] sending reset email to:", user.email);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordSetupToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;

    sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetUrl })
      .then(() => console.log("[forgot-password] email sent OK"))
      .catch((err) => console.error("[forgot-password] email send failed:", err));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Алдаа гарлаа." }, { status: 400 });
  }
}
