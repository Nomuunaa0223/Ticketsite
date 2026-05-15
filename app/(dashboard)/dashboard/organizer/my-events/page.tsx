import { redirect } from "next/navigation";
import { requireExactRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizerShell } from "@/components/organizer/organizer-shell";

export default async function OrganizerMyEventsPage() {
  const user = await requireExactRole("ORGANIZER");
  if (!user.organizerProfile) redirect("/");

  const events = await prisma.event.findMany({
    where: { organizerId: user.organizerProfile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      imageUrl: true,
      cardImageUrl: true,
      category: { select: { name: true } },
      venue: { select: { name: true, city: true } },
    },
  });

  return (
    <OrganizerShell user={user}>
      <div>
        <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Organizer</p>
        <h1 className="mt-1 font-goldman text-2xl font-bold text-white">Миний арга хэмжээ</h1>
        <p className="mt-2 text-sm text-white/40">Таны илгээсэн болон нийтлэгдсэн бүх арга хэмжээ.</p>

        <div className="mt-6 space-y-2">
          {events.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/30">
              Одоогоор арга хэмжээ байхгүй байна.
            </div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-2xl bg-white/[0.03] px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
            >
              {event.cardImageUrl ?? event.imageUrl ? (
                <img
                  src={(event.cardImageUrl ?? event.imageUrl)!}
                  alt={event.title}
                  className="h-14 w-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/20">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="m3 9 5-5 4 4 3-3 6 6" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-goldman text-sm font-semibold text-white">{event.title}</p>
                <p className="mt-0.5 text-xs text-white/35">
                  {event.category.name} · {event.venue.name}, {event.venue.city}
                </p>
                <p className="mt-0.5 text-xs text-white/25">
                  {new Date(event.startsAt).toLocaleDateString("mn-MN")}
                </p>
              </div>

              <span className={`shrink-0 rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] ${
                event.status === "PUBLISHED"      ? "bg-emerald-400/15 text-emerald-300" :
                event.status === "PENDING_REVIEW" ? "bg-amber-400/15 text-amber-300" :
                event.status === "REJECTED"       ? "bg-red-400/15 text-red-300" :
                                                    "bg-white/10 text-white/40"
              }`}>
                {event.status === "PUBLISHED"      ? "Нийтлэгдсэн" :
                 event.status === "PENDING_REVIEW" ? "Хянагдаж байна" :
                 event.status === "REJECTED"       ? "Татгалзсан" : "Ноорог"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </OrganizerShell>
  );
}
