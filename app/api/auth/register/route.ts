import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { applySessionCookie, createSessionForUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    if (payload.role === "ORGANIZER") {
      return NextResponse.json({ error: "Organizer accounts require admin approval. Please submit an application." }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        passwordHash,
        role: payload.role,
      },
      include: { organizerProfile: true }
    });

    const token = await createSessionForUser(user);
    const response = NextResponse.json({ ok: true }, { status: 201 });

    await recordAuditLog({
      actorUserId: user.id,
      action: "REGISTER",
      entityType: "User",
      entityId: user.id,
      description: `Created ${user.role.toLowerCase()} account`
    });

    return applySessionCookie(response, token);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to register. Please try again." }, { status: 400 });
  }
}
