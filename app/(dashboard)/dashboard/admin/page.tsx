import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { SalesChart, type BarPoint, type WeekComparison } from "@/components/admin/sales-chart";
import { TopEventsChart } from "@/components/admin/top-events-chart";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");

  const [
    orderStats,
    ticketsSold,
    activeEvents,
    totalUsers,
    recentOrders,
    popularEvents,
    pendingReviewCount,
    dailyRevenue,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.ticket.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true, event: true } }),
    prisma.event.findMany({ where: { status: "PUBLISHED", isTrending: true }, orderBy: { trendingOrder: "asc" }, include: { category: true, venue: true, ticketTypes: { select: { quantityTotal: true, quantitySold: true } } } }),
    prisma.event.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: "PAID" },
      _sum: { total: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, status: "PAID" },
      _sum: { total: true },
      orderBy: { createdAt: "asc" }
    }),
  ]);

  const topEventRaw = await prisma.order.groupBy({
    by: ["eventId"],
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: "PAID" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 3,
  });

  const topEventTitles = topEventRaw.length
    ? await prisma.event.findMany({
        where: { id: { in: topEventRaw.map((e) => e.eventId) } },
        select: { id: true, title: true },
      })
    : [];

  const topEvents = topEventRaw.map((e) => ({
    title: topEventTitles.find((t) => t.id === e.eventId)?.title ?? "—",
    count: e._count.id,
  }));

  const totalSales = Number(orderStats._sum.total ?? 0);
  const statCards = [
    { label: "Total Sales", value: formatCompactCurrency(totalSales), change: "+12.5% vs last month" },
    { label: "Tickets Sold", value: formatCompactNumber(ticketsSold), change: "+8.2% vs last month" },
    { label: "Active Events", value: formatCompactNumber(activeEvents), change: pendingReviewCount ? `${pendingReviewCount} pending review` : "Stable performance" },
    { label: "Total Users", value: formatCompactNumber(totalUsers), change: "+15.1% new signups" }
  ];
  const monthlyBars = buildMonthlyBars(dailyRevenue);
  const weekComparison = buildWeekComparison(monthlyRevenue);

  return (
    <AdminShell user={user}>
      <div className="border-b border-white/[0.06] pb-5">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/38">
                      {card.label}
                    </p>
                    <p className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[#ff8b3d]">
                      {card.value}
                    </p>
                  </div>
                  <div className="rounded-[0.7rem] bg-[#1b243c] p-2 text-[#ff8b3d]">
                    <StatIcon label={card.label} />
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-emerald-400">{card.change}</p>
              </div>
            ))}
          </div>

          <SalesChart monthlyBars={monthlyBars} weekComparison={weekComparison} />

          <TopEventsChart events={topEvents} />

          <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
            <div className="rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.03em] text-white">Сүүлийн гүйлгээ</h2>
                  <p className="mt-0.5 text-sm text-white/38">Системд шинээр үүссэн захиалгууд</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {recentOrders.length === 0 ? (
                  <div className="rounded-xl bg-white/[0.03] px-4 py-8 text-center text-sm text-white/30">
                    Одоогоор гүйлгээ байхгүй байна.
                  </div>
                ) : recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff7224]/15 text-[0.7rem] font-bold text-[#ff8b46]">
                      {order.user.fullName.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{order.user.fullName}</p>
                      <p className="truncate text-xs text-white/38">{order.event.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-white">{formatCompactCurrency(Number(order.total), order.currency)}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${getStatusClasses(order.status)}`}>
                        {order.status === "PAID" ? "Төлөгдсөн" : order.status === "PENDING_PAYMENT" ? "Хүлээгдэж буй" : order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
              <h2 className="text-xl font-bold tracking-[-0.04em] text-white sm:text-3xl">Trending Events</h2>

              <div className="mt-5 space-y-4">
                {popularEvents.map((event) => {
                  const total = event.ticketTypes.reduce((s, t) => s + t.quantityTotal, 0);
                  const sold = Math.min(total, event.ticketTypes.reduce((s, t) => s + t.quantitySold, 0));
                  const percent = total > 0 ? Math.round((sold / total) * 100) : 0;
                  return (
                    <div
                      key={event.id}
                      className="rounded-[0.95rem] bg-[#0f1629] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[0.8rem] bg-[#161f36] text-[#ff8b3d]">
                          <EventThumbIcon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">{event.title}</p>
                          <p className="truncate text-xs text-white/38">
                            {event.category.name} - {event.venue.name}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-[#ff8b3d]">{sold} ш</p>
                          <p className="text-[0.62rem] text-white/30">{total} -аас</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#ff7a2b_0%,#ff9c52_100%)]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {popularEvents.length === 0 ? (
                  <div className="rounded-[0.95rem] bg-[#0f1629] px-4 py-6 text-sm text-white/42 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                    No published events yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
    </AdminShell>
  );
}

function formatCompactCurrency(amount: number, currency = "MNT") {
  if (currency === "MNT") {
    return new Intl.NumberFormat("mn-MN", { style: "currency", currency: "MNT", maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getStatusClasses(status: string) {
  if (status === "PAID") {
    return "bg-emerald-400/16 text-emerald-300";
  }

  if (status === "PENDING_PAYMENT") {
    return "bg-amber-400/16 text-amber-300";
  }

  return "bg-white/10 text-white/60";
}

type RevenueRow = { createdAt: Date; _sum: { total: unknown } };

function buildMonthlyBars(data: RevenueRow[]): BarPoint[] {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    const value = data.filter((r) => r.createdAt.toISOString().slice(0, 10) === dateStr).reduce((s, r) => s + Number(r._sum.total ?? 0), 0);
    return { label, value };
  });
}

function buildWeekComparison(data: RevenueRow[]): WeekComparison {
  const now = new Date();
  const mnDays = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
  const labels: string[] = [];
  const current: number[] = [];
  const previous: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const currD = new Date(now); currD.setDate(currD.getDate() - i);
    const prevD = new Date(now); prevD.setDate(prevD.getDate() - i - 7);
    labels.push(mnDays[currD.getDay()]);
    const sum = (d: Date) => data.filter((r) => r.createdAt.toISOString().slice(0, 10) === d.toISOString().slice(0, 10)).reduce((s, r) => s + Number(r._sum.total ?? 0), 0);
    current.push(sum(currD));
    previous.push(sum(prevD));
  }

  return { labels, current, previous };
}

function StatIcon({ label }: { label: string }) {
  if (label === "Total Sales") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }

  if (label === "Tickets Sold") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" />
        <path d="M12 6v12" />
      </svg>
    );
  }

  if (label === "Active Events") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10h18" />
        <path d="M5 10V7l7-3 7 3v3" />
        <path d="M4 18h16" />
        <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3" />
      <path d="M20 8v6M23 11h-6" />
    </svg>
  );
}

function EventThumbIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 14 3-3 3 3 4-5 3 4" />
    </svg>
  );
}

