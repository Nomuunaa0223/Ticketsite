import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SiteHeaderCategoryNav } from "@/components/layout/site-header-category-nav";
import {
  ensureReminderNotifications,
  getUnreadNotificationsCount
} from "@/lib/notifications";

export async function SiteHeader() {
  const session = await getSession();
  const unreadCount = session
    ? await ensureAndCountNotifications(session.sub)
    : 0;
  const profileLabel = session ? session.fullName.split(" ")[0]?.toUpperCase() ?? "USER" : "LOGIN";
  const profileInitial = session ? session.fullName.charAt(0).toUpperCase() : "L";

  return (
    <header className="z-40 bg-[linear-gradient(180deg,rgba(6,8,14,0.95),rgba(6,8,14,0.55),transparent)] backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[linear-gradient(180deg,rgba(10,14,25,0.98),rgba(9,12,22,0.94))] px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center gap-6 lg:gap-10">
            <Link href="/" className="flex items-center text-[#ff7224]">
              <span className="text-xl font-bold uppercase tracking-[0.08em] sm:text-[1.55rem]">TIXORA</span>
            </Link>
            <SiteHeaderCategoryNav />
          </div>

          {session ? (
            <nav className="flex items-center gap-3 text-sm text-white/82 lg:gap-5">
              <Link href="/notifications" className="flex items-center gap-2 transition hover:text-white">
                Notifications
                {unreadCount > 0 ? <span className="h-2 w-2 rounded-full bg-[#ff7224]" /> : null}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
              >
                {profileLabel}
              </Link>
              <Link
                href="/dashboard"
                aria-label="Open profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-semibold text-white transition hover:border-white/40"
              >
                {profileInitial}
              </Link>
            </nav>
          ) : (
            <nav className="flex items-center gap-3 text-sm text-white/82 lg:gap-5">
              <Link
                href="/login"
                className="rounded-full bg-[#ff7224] px-5 py-2.5 font-semibold text-white shadow-[0_10px_28px_rgba(255,114,36,0.3)] transition hover:bg-[#ff8443]"
              >
                Join Now
              </Link>
            </nav>
          )}
      </div>
    </header>
  );
}

async function ensureAndCountNotifications(userId: string) {
  await ensureReminderNotifications(userId);
  return getUnreadNotificationsCount(userId);
}
