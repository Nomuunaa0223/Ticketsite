import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { TrendingEventsManager } from "@/components/admin/trending-events-manager";

export default async function AdminTrendingPage() {
  const user = await requireRole("ADMIN");

  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isTrending: "desc" }, { trendingOrder: "asc" }, { startsAt: "asc" }],
    select: { id: true, title: true, isTrending: true, trendingOrder: true, imageUrl: true, startsAt: true, category: { select: { name: true } }, venue: { select: { name: true } } }
  });

  return (
    <AdminShell user={user}>
      <div className="space-y-4">
        <div>
          <p className="font-goldman text-xs font-bold uppercase tracking-[0.28em] text-[#ff7224]">Удирдах</p>
          <h2 className="mt-1 font-goldman text-2xl font-bold text-white">Онцлох арга хэмжээнүүд</h2>
          <p className="mt-1 text-sm text-white/40">Нүүр хуудсан дээр харагдах онцлох арга хэмжээнүүдийг сонгоно уу.</p>
        </div>
        <TrendingEventsManager
          events={events.map((e) => ({
            id: String(e.id),
            title: e.title,
            category: e.category.name,
            venue: e.venue.name,
            startsAt: e.startsAt.toISOString().slice(0, 10),
            isTrending: e.isTrending,
            trendingOrder: e.trendingOrder,
            imageUrl: e.imageUrl,
          }))}
        />
      </div>
    </AdminShell>
  );
}
