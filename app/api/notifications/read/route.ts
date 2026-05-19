import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await requireUser();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.notification.deleteMany({
    where: { userId: user.id, createdAt: { lt: sevenDaysAgo } },
  });
  return NextResponse.json({ ok: true });
}
