import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { SalesChart } from "@/components/admin/sales-chart";

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
    monthlyRevenue
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.ticket.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true, event: true } }),
    prisma.event.findMany({ where: { status: "PUBLISHED" }, take: 4, orderBy: { orders: { _count: "desc" } }, include: { category: true, venue: true, ticketTypes: { select: { quantityTotal: true, quantitySold: true } } } }),
    prisma.event.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, status: "PAID" },
      _sum: { total: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, status: "PAID" },
      _sum: { total: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  const totalSales = Number(orderStats._sum.total ?? 0);
  const statCards = [
    { label: "Total Sales", value: formatCompactCurrency(totalSales), change: "+12.5% vs last month" },
    { label: "Tickets Sold", value: formatCompactNumber(ticketsSold), change: "+8.2% vs last month" },
    { label: "Active Events", value: formatCompactNumber(activeEvents), change: pendingReviewCount ? `${pendingReviewCount} pending review` : "Stable performance" },
    { label: "Total Users", value: formatCompactNumber(totalUsers), change: "+15.1% new signups" }
  ];
  const trendPoints = buildRealTrendPoints(dailyRevenue);
  const monthlyTrendPoints = buildMonthlyTrendPoints(monthlyRevenue);

  return (
    <AdminShell user={user}>
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <a href="/api/auth/logout" className="text-sm text-white/40 transition hover:text-red-400">Logout</a>
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

          <SalesChart dailyPoints={trendPoints} monthlyPoints={monthlyTrendPoints} />

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-[-0.04em] text-white">Recent Transactions</h2>
                  <p className="mt-1 text-sm text-white/42">Latest orders created in the system.</p>
                </div>
                <Link href="/dashboard" className="text-sm font-semibold text-[#ff8b3d] transition hover:text-[#ffb47d]">
                  View All
                </Link>
              </div>

              <div className="mt-5 overflow-hidden rounded-[0.9rem] bg-[#0f1629] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="grid grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr] gap-3 px-4 py-3 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/26">
                  <span>Customer</span>
                  <span>Event</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                <div className="space-y-px bg-white/[0.03]">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid grid-cols-[1.1fr_1.1fr_0.8fr_0.8fr] gap-3 bg-[#121a30] px-4 py-4 text-sm text-white/72"
                    >
                      <span className="truncate font-semibold text-white">{order.user.fullName}</span>
                      <span className="truncate">{order.event.title}</span>
                      <span className="font-semibold text-white">{formatCompactCurrency(Number(order.total), order.currency)}</span>
                      <span>
                        <span className={`rounded-full px-2.5 py-1 text-[0.64rem] font-bold ${getStatusClasses(order.status)}`}>
                          {order.status}
                        </span>
                      </span>
                    </div>
                  ))}
                  {recentOrders.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-white/42">No transactions yet.</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
              <h2 className="text-3xl font-bold tracking-[-0.04em] text-white">Popular Events</h2>

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
                        <span className="text-xs font-bold text-[#ff8b3d]">{percent}% Sold</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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

function buildMonthlyTrendPoints(monthlyRevenue: Array<{ createdAt: Date; _sum: { total: unknown } }>) {
  const now = new Date();
  const months: { label: string; value: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d).toUpperCase();
    const y = d.getFullYear();
    const m = d.getMonth();
    const revenue = monthlyRevenue
      .filter((r) => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === y && rd.getMonth() === m;
      })
      .reduce((s, r) => s + Number(r._sum.total ?? 0), 0);
    months.push({ label, value: revenue });
  }

  const maxVal = Math.max(...months.map((d) => d.value), 1);
  return months.map((d, index) => ({
    label: d.label,
    value: d.value,
    x: 28 + index * 88,
    y: 210 - (d.value / maxVal) * 150
  }));
}

function buildRealTrendPoints(dailyRevenue: Array<{ createdAt: Date; _sum: { total: unknown } }>) {
  // Сүүлийн 9 өдрийг авна
  const now = new Date();
  const days: { label: string; value: number }[] = [];

  for (let i = 8; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(d).toUpperCase();
    const dateStr = d.toISOString().slice(0, 10);
    const revenue = dailyRevenue
      .filter((r) => r.createdAt.toISOString().slice(0, 10) === dateStr)
      .reduce((s, r) => s + Number(r._sum.total ?? 0), 0);
    days.push({ label, value: revenue });
  }

  const maxVal = Math.max(...days.map((d) => d.value), 1);

  return days.map((d, index) => ({
    label: d.label,
    value: d.value,
    x: 28 + index * 88,
    y: 210 - (d.value / maxVal) * 150
  }));
}

function buildTrendPoints(seedValue: number) {
  const base = [0.22, 0.26, 0.24, 0.42, 0.68, 0.8, 0.74, 0.58, 0.86];
  const labels = ["OCT 03", "OCT 07", "OCT 10", "OCT 15", "OCT 21", "OCT 24", "OCT 28", "NOV 01", "NOV 05"];

  return base.map((point, index) => ({
    label: labels[index],
    value: Math.round(seedValue * point),
    x: 28 + index * 88,
    y: 210 - point * 150
  }));
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function buildAreaPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) {
    return "";
  }

  const first = points[0];
  const last = points[points.length - 1];
  return `${buildLinePath(points)} L ${last.x} 220 L ${first.x} 220 Z`;
}

function SidebarIcon({ label }: { label: string }) {
  if (label === "Dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="4" rx="1" />
        <rect x="14" y="10" width="7" height="11" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (label === "Events") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }

  if (label === "Analytics") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5M10 19v-8M16 19v-4M22 19H2" />
      </svg>
    );
  }

  if (label === "Users") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 4.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
