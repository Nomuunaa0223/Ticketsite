import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Organizer approvals now use /admin/organizer-applications." },
    { status: 410 }
  );
}
