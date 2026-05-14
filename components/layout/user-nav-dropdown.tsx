"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  initial: string;
  fullName: string;
};

const menuItems = [
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M9 17a3 3 0 0 0 6 0" />
      </svg>
    ),
  },
  {
    label: "My Tickets",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9a2 2 0 0 0 0 6v3h16v-3a2 2 0 0 0 0-6V6H4z" />
        <path d="M12 6v12" />
      </svg>
    ),
  },
  {
    label: "My Resale",
    href: "/my-resale",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18" />
        <path d="M6 7V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M12 12v4" />
        <path d="M10 14h4" />
      </svg>
    ),
  },
] as const;

export function UserNavDropdown({ initial, fullName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "GET", redirect: "manual" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${fullName} menu`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7224] text-sm font-bold text-white transition hover:bg-[#e5641a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7224]/60"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl bg-[#0e1220] shadow-xl ring-1 ring-white/10">
          <div className="border-b border-white/[0.07] px-4 py-3">
            <p className="truncate text-xs font-semibold text-white">{fullName}</p>
          </div>

          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                <span className="text-white/40">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/[0.07] py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80 transition hover:bg-white/[0.06] hover:text-red-400"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
