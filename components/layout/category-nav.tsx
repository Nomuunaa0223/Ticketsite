"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useLang } from "@/components/layout/lang-context";

const CATEGORIES = [
  { labelKey: "catSports", slug: "sports" },
  { labelKey: "catMusic", slug: "music" },
  { labelKey: "catTheater", slug: "theater-arts" },
  { labelKey: "catComedy", slug: "comedy" },
  { labelKey: "catFestival", slug: "festival" },
  { labelKey: "catConference", slug: "conference" },
] as const;

type Props = {
  className?: string;
  activeSlug?: string;
};

export function CategoryNav({ className, activeSlug }: Props) {
  const pathname = usePathname();
  const { t } = useLang();
  const [activeHash, setActiveHash] = useState("");
  const currentSlug = activeHash || activeSlug;

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(window.location.hash.replace("#", ""));
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return (
    <nav
      className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
      aria-label="Event categories"
    >
      <Link
        href="/events"
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
          !currentSlug
            ? "bg-[#ff7224] text-white"
            : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
        }`}
      >
        {t("eventsAll")}
      </Link>
      {CATEGORIES.map((cat) => (
        <Fragment key={cat.slug}>
          {cat.slug === "comedy" ? <span className="category-nav-line-break" aria-hidden="true" /> : null}
          <Link
            href={`/events#${cat.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              currentSlug === cat.slug
                ? "bg-[#ff7224] text-white"
                : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
            }`}
          >
            {t(cat.labelKey)}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
