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
    <header className="z-40 bg-[linear-gradient(180deg,rgba(6,8,14,0.95),rgba(6,8,14,0.55),transparent)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 bg-[linear-gradient(180deg,rgba(10,14,25,0.98),rgba(9,12,22,0.9))] px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center text-[#ff7224]">
            <span className="text-xl font-bold uppercase tracking-[0.08em] sm:text-[1.55rem]">TIXORA</span>
          </Link>
          {user && (
            <Link
              href="/resale"
              className="font-goldman hidden mt-2 ml-10 text-sm font-semibold text-white/60 transition hover:text-white sm:block"
            >
              RESALE
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-4 text-sm text-white/82">
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
