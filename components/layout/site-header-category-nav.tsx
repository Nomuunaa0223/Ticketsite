"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const categoryLinks = [
  { label: "Sports", slug: "sports" },
  { label: "Music", slug: "music" },
  { label: "Theater & Arts", slug: "theater-arts" },
  { label: "Comedy", slug: "comedy" },
  { label: "Festival", slug: "festival" },
  { label: "Conference", slug: "conference" }
] as const;

export function SiteHeaderCategoryNav() {
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
            {category.label}
          </Link>
        );
      })}
    </nav>
  );
}
