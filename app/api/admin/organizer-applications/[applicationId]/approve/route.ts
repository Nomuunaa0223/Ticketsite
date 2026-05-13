import { NextResponse, type NextRequest } from "next/server";
import { OrganizerApplicationStatus, OrganizerStatus, Prisma, Role } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { env } from "@/lib/env";
import { sendPasswordSetupEmail } from "@/lib/mail";
import { createRawPasswordSetupToken, getPasswordSetupExpiry, hashPasswordSetupToken } from "@/lib/password-setup";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugs";

type Props = {
  params: Promise<{ applicationId: string }>;
};

export async function POST(request: NextRequest, { params }: Props) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { applicationId } = await params;
  const id = Number(applicationId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid application id." }, { status: 400 });
  }

  const rawToken = createRawPasswordSetupToken();
  const tokenHash = hashPasswordSetupToken(rawToken);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.organizerApplication.findUnique({ where: { id } });

      if (!application || application.status !== OrganizerApplicationStatus.PENDING) {
        throw new ApprovalError("Application is not pending.");
      }

      const existingUser = await tx.user.findUnique({ where: { email: application.email.toLowerCase() } });
      if (existingUser) {
        throw new ApprovalError("A user with this email already exists.");
      }

      const organizer = await tx.organizer.create({
        data: {
          companyName: application.companyName,
          contactEmail: application.email.toLowerCase(),
          phone: application.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          email: application.email.toLowerCase(),
          fullName: application.contactName,
          passwordHash: null,
          role: Role.ORGANIZER,
          organizerId: organizer.id,
          organizerProfile: {
            create: {
              companyName: application.companyName,
              slug: await createUniqueOrganizerSlug(tx, application.companyName),
              description: application.description,
              websiteUrl: application.websiteUrl,
              status: OrganizerStatus.APPROVED,
              approvedAt: new Date(),
              approvedById: admin.id,
            },
          },
        },
        include: { organizerProfile: true },
      });

      await tx.passwordSetupToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: getPasswordSetupExpiry(),
        },
      });

      await tx.organizerApplication.update({
        where: { id: application.id },
        data: {
          status: OrganizerApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedByAdminId: admin.id,
        },
      });

      return { application, user };
    });

    const setupUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/setup-password?token=${encodeURIComponent(rawToken)}`;
    await sendPasswordSetupEmail({
      to: result.application.email,
      contactName: result.application.contactName,
      companyName: result.application.companyName,
      setupUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApprovalError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Unable to approve organizer application." }, { status: 500 });
  }
}

class ApprovalError extends Error {}

async function getAdminFromRequest(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: Number(session.sub) }, select: { id: true, role: true } });
  return user?.role === Role.ADMIN ? user : null;
}

async function createUniqueOrganizerSlug(tx: Prisma.TransactionClient, companyName: string) {
  const baseSlug = slugify(companyName);
  let slug = baseSlug;
  let index = 1;

  while (await tx.organizerProfile.findUnique({ where: { slug } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  return slug;
}
