"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

const CATEGORIES = [
  { label: "Sports", slug: "sports" },
  { label: "Music", slug: "music" },
  { label: "Theater & Arts", slug: "theater-arts" },
  { label: "Comedy", slug: "comedy" },
  { label: "Festival", slug: "festival" },
  { label: "Conference", slug: "conference" },
];

type Props = {
  className?: string;
  activeSlug?: string;
};

export function CategoryNav({ className, activeSlug }: Props) {
  const pathname = usePathname();
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
        All
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
            {cat.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
