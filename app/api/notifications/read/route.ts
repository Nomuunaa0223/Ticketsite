import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);

  return NextResponse.json({ ok: true });
}
