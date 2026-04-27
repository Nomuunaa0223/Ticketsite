import { NextResponse } from "next/server";
import { OrganizerStatus } from "@prisma/client";
import { applySessionCookie, createSessionForUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";
import { registerSchema } from "@/lib/validations/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
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
        organizerProfile:
          payload.role === "ORGANIZER"
            ? {
                create: {
                  companyName: payload.companyName!,
                  slug: await createUniqueOrganizerSlug(payload.companyName!),
                  websiteUrl: payload.websiteUrl,
                  status: OrganizerStatus.PENDING
                }
              }
            : undefined
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
    console.error(error);
    return NextResponse.json({ error: "Unable to register." }, { status: 400 });
  }
}

async function createUniqueOrganizerSlug(companyName: string) {
  const baseSlug = slugify(companyName);
  let slug = baseSlug;
  let index = 1;

  while (await prisma.organizerProfile.findUnique({ where: { slug } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return slug;
}
