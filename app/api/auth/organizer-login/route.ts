import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionForUser, applySessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const organizerLoginSchema = z.object({
  email: z.string().email(),
  registrationCode: z.string().min(6).max(6),
  oneTimePassword: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const payload = organizerLoginSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      include: { organizerProfile: true },
    });

    if (!user || user.role !== "ORGANIZER" || !user.passwordHash || !user.organizerProfile) {
      return NextResponse.json({ error: "Мэдээлэл буруу байна." }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Мэдээлэл буруу байна." }, { status: 401 });
    }

    if (user.organizerProfile.registrationCode !== payload.registrationCode) {
      return NextResponse.json({ error: "Мэдээлэл буруу байна." }, { status: 401 });
    }

    const validPassword = await verifyPassword(payload.oneTimePassword, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Мэдээлэл буруу байна." }, { status: 401 });
    }

    const token = await createSessionForUser(user);
    const responseData = NextResponse.json({ ok: true, role: user.role });
    return applySessionCookie(responseData, token);
  } catch {
    return NextResponse.json({ error: "Нэвтрэх үед алдаа гарлаа." }, { status: 400 });
  }
}
