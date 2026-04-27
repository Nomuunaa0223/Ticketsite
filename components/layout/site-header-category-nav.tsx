"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/events" ? searchParams.get("category") : null;

  return (
    <nav className="hidden flex-wrap items-center gap-5 text-sm text-white/70 md:flex lg:gap-8">
      {categoryLinks.map((category) => {
        const isActive = activeCategory === category.slug;

        return (
          <Link
            key={category.slug}
            href={{
              pathname: "/events",
              query: { category: category.slug }
            }}
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
