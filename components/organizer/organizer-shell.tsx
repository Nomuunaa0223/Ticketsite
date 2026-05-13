import Link from "next/link";
import type { ReactNode } from "react";

type OrganizerProfile = {
  id: number;
  companyName: string;
};

type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  organizerProfile: OrganizerProfile | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/organizer",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="4" rx="1" />
        <rect x="14" y="10" width="7" height="11" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Create Event",
    href: "/dashboard/organizer/events",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Check-in",
    href: "/organizer/check-in",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m15 15 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

type Props = {
  user: User;
  children: ReactNode;
};

export function OrganizerShell({ user, children }: Props) {
  const initials = user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen bg-[#070b14]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/[0.06] bg-[#0a0f1a]">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/[0.06] px-5">
          <Link href="/dashboard/organizer" className="text-lg font-bold uppercase tracking-[0.08em] text-[#ff7224]">
            TIXORA
          </Link>
          <span className="ml-2 rounded-md bg-[#ff7224]/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#ff7224]">
            Org
          </span>
        </div>

        {/* Company name */}
        {user.organizerProfile && (
          <div className="border-b border-white/[0.06] px-5 py-3">
            <p className="truncate text-xs font-semibold text-white/60">
              {user.organizerProfile.companyName}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href as never}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/52 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <span className="text-[#ff7224]">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7224]/20 text-[0.7rem] font-bold text-[#ff7224]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user.fullName}</p>
              <p className="truncate text-[0.65rem] text-white/40">{user.email}</p>
            </div>
          </div>
          <a
            href="/api/auth/logout"
            className="mt-3 block rounded-xl bg-white/[0.04] px-3 py-2 text-center text-xs font-semibold text-white/40 transition hover:bg-white/[0.08] hover:text-red-400"
          >
            Logout
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col pl-60">
        <main className="flex-1 px-6 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
