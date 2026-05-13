import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, role: true, createdAt: true }
  });

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName, phone, avatarUrl } = await request.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(fullName?.trim() && { fullName: fullName.trim() }),
      phone: phone?.trim() || null,
      avatarUrl: avatarUrl?.trim() || null,
    },
    select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true, role: true }
  });

  return NextResponse.json(updated);
}
