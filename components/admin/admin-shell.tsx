"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/admin",
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
    label: "Events",
    href: "/dashboard/admin/events",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
  },
  {
    label: "Organizers",
    href: "/dashboard/admin/organizers",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 4.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Applications",
    href: "/dashboard/admin/applications",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Trending",
    href: "/dashboard/admin/trending",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="3" />
        <path d="M20 8v6M23 11h-6" />
      </svg>
    ),
  },
  {
    label: "Partnerships",
    href: "/dashboard/admin/partnerships",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18" />
        <path d="M8 9h8" strokeLinecap="round" />
        <path d="M8 15h8" strokeLinecap="round" />
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    ),
  },
];

type Props = {
  user: User;
  children: ReactNode;
};

export function AdminShell({ user, children }: Props) {
  const [open, setOpen] = useState(false);

  const initials = user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const sidebar = (
    <aside className={`fixed inset-y-0 left-0 z-30 flex h-dvh w-60 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0a0f1a] transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
        <Link href="/dashboard/admin" className="text-lg font-bold uppercase tracking-[0.08em] text-[#ff7224]">
          TIXORA
        </Link>
        <span className="rounded-md bg-[#ff7224]/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#ff7224]">
          Admin
        </span>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href as never}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/52 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <span className="text-[#ff7224]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff7224]/20 text-[0.7rem] font-bold text-[#ff7224]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user.fullName}</p>
            <p className="truncate text-[0.65rem] text-white/40">{user.email}</p>
          </div>
          <a
            href="/api/auth/logout"
            title="Гарах"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-red-500/15 hover:text-red-400"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#070b14]">
      {sidebar}

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#0a0f1a] px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.06] hover:text-white"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-base font-bold uppercase tracking-[0.08em] text-[#ff7224]">TIXORA</span>
          <span className="rounded-md bg-[#ff7224]/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[#ff7224]">Admin</span>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
