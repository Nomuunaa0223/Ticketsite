import { redirect } from "next/navigation";
import { requireExactRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizerShell } from "@/components/organizer/organizer-shell";
import { OrganizerEventForm } from "@/components/forms/organizer-event-form";

export default async function OrganizerEventsPage() {
  const user = await requireExactRole("ORGANIZER");
  if (!user.organizerProfile) redirect("/");

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <OrganizerShell user={user}>
      <div>
        <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Шинэ арга хэмжээ</p>
        <h1 className="mt-1 font-goldman text-2xl font-bold text-white">Арга хэмжээ нэмэх</h1>
        <div className="mt-6">
          <OrganizerEventForm categories={categories} />
        </div>
      </div>
    </OrganizerShell>
  );
}
