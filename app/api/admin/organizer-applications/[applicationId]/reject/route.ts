import { NextResponse, type NextRequest } from "next/server";
import { OrganizerApplicationStatus, Role } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const application = await prisma.organizerApplication.findUnique({ where: { id } });
  if (!application || application.status !== OrganizerApplicationStatus.PENDING) {
    return NextResponse.json({ error: "Application is not pending." }, { status: 400 });
  }

  await prisma.organizerApplication.update({
    where: { id },
    data: {
      status: OrganizerApplicationStatus.REJECTED,
      reviewedAt: new Date(),
      reviewedByAdminId: admin.id,
    },
  });

  return NextResponse.json({ ok: true });
}

async function getAdminFromRequest(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: Number(session.sub) }, select: { id: true, role: true } });
  return user?.role === Role.ADMIN ? user : null;
}
