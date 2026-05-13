import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { phone, email, ticketType, message } = await request.json();
    const data = {
      phone: String(phone ?? "").trim(),
      email: String(email ?? "").trim(),
      ticketType: String(ticketType ?? "").trim(),
      message: String(message ?? "").trim(),
    };

    if (!data.email || !data.ticketType || !data.message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await prisma.contactInquiry.create({
      data,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
