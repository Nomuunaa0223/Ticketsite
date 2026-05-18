"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          !currentSlug
            ? "bg-[#ff7224] text-white"
            : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
        }`}
      >
        All
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/events#${cat.slug}`}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            currentSlug === cat.slug
              ? "bg-[#ff7224] text-white"
              : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"
          }`}
        >
          {cat.label}
        </Link>
      ))}
    </nav>
  );
}
