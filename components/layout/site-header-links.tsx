"use client";

import Link from "next/link";
import { useLang } from "@/components/layout/lang-context";

export function SiteHeaderUserLinks() {
  const { t } = useLang();

  return (
    <>
      <Link
        href="/resale"
        className="font-goldman ml-4 mt-2 hidden text-sm font-semibold text-white/60 transition hover:text-white md:block lg:ml-10"
      >
        {t("headerResale")}
      </Link>
      <Link
        href={"/special" as never}
        className="font-goldman mt-2 hidden text-sm font-semibold text-white/60 transition hover:text-white md:block"
      >
        {t("headerSpecial")}
      </Link>
    </>
  );
}

export function SiteHeaderJoinLink() {
  const { t } = useLang();

  return (
    <Link href="/login" className="header-join-btn">
      {t("headerJoinNow")}
    </Link>
  );
}
