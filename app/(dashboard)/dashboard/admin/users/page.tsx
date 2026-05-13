import { requireRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getPage, PaginationLinks } from "@/components/admin/pagination-links";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 5;

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const user = await requireRole("ADMIN");
  const page = getPage((await searchParams).page);
  const [users, totalUsers, activeUsers] = await Promise.all([
    getUsers(page),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "USER", status: "ACTIVE" } })
  ]);
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  return (
    <AdminShell user={user}>
      <div className="space-y-5">
        <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="mt-1 text-sm text-white/42">Regular customer accounts only.</p>
          </div>
          <p className="text-sm font-semibold text-white/52">{totalUsers} users</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <UserStatCard label="Customer users" value={totalUsers} />
          <UserStatCard label="Active users" value={activeUsers} />
        </div>

        <UserTable users={users} emptyMessage="No customer users found." />
        <div className="flex justify-end">
          <PaginationLinks basePath="/dashboard/admin/users" currentPage={Math.min(page, totalPages)} totalPages={totalPages} />
        </div>
      </div>
    </AdminShell>
  );
}

async function getUsers(page: number) {
  return prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          ownedTickets: true
        }
      }
    }
  });
}

type UserRow = Awaited<ReturnType<typeof getUsers>>[number];

function UserTable({ users, emptyMessage }: { users: UserRow[]; emptyMessage: string }) {
  return (
    <section className="overflow-hidden rounded-xl bg-[#0f1629] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="hidden grid-cols-[1.4fr_1.5fr_0.9fr_1fr_0.9fr] gap-3 px-4 py-3 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/26 lg:grid">
        <span>Name</span>
        <span>Email</span>
        <span>Status</span>
        <span>Activity</span>
        <span>Joined</span>
      </div>

      <div className="space-y-px bg-white/[0.03]">
        {users.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 bg-[#121a30] px-4 py-4 text-sm text-white/70 lg:grid-cols-[1.4fr_1.5fr_0.9fr_1fr_0.9fr] lg:items-center"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{item.fullName}</p>
              <p className="mt-1 truncate text-xs text-white/38">User</p>
            </div>
            <p className="truncate">{item.email}</p>
            <div>
              <span className={`rounded-full px-2.5 py-1 text-[0.64rem] font-bold ${getStatusClasses(item.status)}`}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-white/50">
              {item._count.orders} orders - {item._count.ownedTickets} tickets
            </p>
            <p className="text-xs font-semibold text-white/42">{formatDate(item.createdAt)}</p>
          </div>
        ))}

        {users.length === 0 ? (
          <div className="px-4 py-6 text-sm text-white/42">{emptyMessage}</div>
        ) : null}
      </div>
    </section>
  );
}

function UserStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#ff8b3d]">
        {new Intl.NumberFormat("en-US").format(value)}
      </p>
    </div>
  );
}

function getStatusClasses(status: string) {
  if (status === "ACTIVE") return "bg-emerald-400/16 text-emerald-300";
  return "bg-red-400/16 text-red-300";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(value);
}
