"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/components/layout/lang-context";

const categoryLinks = [
  { labelKey: "catSports", slug: "sports" },
  { labelKey: "catMusic", slug: "music" },
  { labelKey: "catTheater", slug: "theater-arts" },
  { labelKey: "catComedy", slug: "comedy" },
  { labelKey: "catFestival", slug: "festival" },
  { labelKey: "catConference", slug: "conference" }
] as const;

export function SiteHeaderCategoryNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const syncHash = () => {
      setActiveCategory(pathname === "/events" ? window.location.hash.replace("#", "") : "");
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  return (
    <nav className="hidden flex-wrap items-center gap-5 text-sm text-white/70 md:flex lg:gap-8">
      {categoryLinks.map((category) => {
        const isActive = activeCategory === category.slug;

        return (
          <Link
            key={category.slug}
            href={`/events#${category.slug}`}
            className={`transition hover:text-white ${
              isActive ? "border-b border-[#ff7224] pb-1 text-[#ff7224]" : ""
            }`}
          >
            {t(category.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
