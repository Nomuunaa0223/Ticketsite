import { NextResponse } from "next/server";
import { createSessionForUser, applySessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      include: { organizerProfile: true }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const validPassword = await verifyPassword(payload.password, user.passwordHash);

    if (!validPassword || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionForUser(user);
    const responseData = NextResponse.json({ ok: true, role: user.role });
    await recordAuditLog({
      actorUserId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      description: "User signed in"
    });
    return applySessionCookie(responseData, token);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 400 });
  }
}
