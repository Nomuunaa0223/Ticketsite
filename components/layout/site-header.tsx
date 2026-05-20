import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { UserNavDropdown } from "@/components/layout/user-nav-dropdown";
import { LangDropdown } from "@/components/layout/lang-dropdown";
import { NavSearch } from "@/components/layout/nav-search";
import { NavNotificationBell } from "@/components/layout/nav-notification-bell";
import { SiteHeaderJoinLink, SiteHeaderUserLinks } from "@/components/layout/site-header-links";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const initial = user?.fullName?.charAt(0).toUpperCase() ?? "";

  return (
    <header className="site-header z-40 bg-black">
      <div className="flex min-w-0 items-center justify-between gap-1.5 px-2 py-2 sm:gap-4 sm:px-8 sm:py-4 lg:px-12">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center text-[#ff7224]">
            <span className="site-header__logo login-card__brand">TIXORA</span>
          </Link>
          {user ? <SiteHeaderUserLinks /> : null}
        </div>

        <nav className="flex min-w-0 shrink items-center justify-end gap-1.5 text-sm text-white/82 sm:gap-4">
          {user ? <NavSearch /> : null}
          <LangDropdown />
          {user ? (
            <>
              <NavNotificationBell />
              <UserNavDropdown initial={initial} fullName={user.fullName} />
            </>
          ) : (
            <SiteHeaderJoinLink />
          )}
        </nav>
      </div>
    </header>
  );
}
