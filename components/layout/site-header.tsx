import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UserNavDropdown } from "@/components/layout/user-nav-dropdown";
import { LangDropdown } from "@/components/layout/lang-dropdown";
import { NavSearch } from "@/components/layout/nav-search";
import { NavNotificationBell } from "@/components/layout/nav-notification-bell";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const initial = user?.fullName?.charAt(0).toUpperCase() ?? "";

  return (
    <header className="z-40 bg-black">
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-8 sm:py-4 lg:px-12">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center text-[#ff7224]">
            <span className="text-lg font-bold uppercase tracking-[0.08em] sm:text-[1.55rem]">TIXORA</span>
          </Link>
          {user && (
            <Link
              href="/resale"
              className="font-goldman ml-4 mt-2 hidden text-sm font-semibold text-white/60 transition hover:text-white md:block lg:ml-10"
            >
              RESALE
            </Link>
          )}
        </div>

        <nav className="flex min-w-0 items-center gap-2 text-sm text-white/82 sm:gap-4">
          <NavSearch />
          <LangDropdown />
          {user ? (
            <>
              <NavNotificationBell />
              <UserNavDropdown initial={initial} fullName={user.fullName} />
            </>
          ) : (
            <Link href="/login" className="header-join-btn">
              Join Now
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
