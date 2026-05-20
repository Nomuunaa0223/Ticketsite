"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/components/layout/lang-context";

type Result = {
  slug: string;
  title: string;
  cardImageUrl: string | null;
  imageUrl: string | null;
  category: { name: string } | null;
  venue: { name: string; city: string | null } | null;
};

export function NavSearch() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setResults([]);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleClose() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <div
        className={`flex items-center overflow-hidden rounded-full transition-all duration-300 ${
          open
            ? "w-[calc(100vw-13rem)] max-w-44 bg-white/[0.07] ring-1 ring-white/15 sm:w-64 sm:max-w-none"
            : "w-8 sm:w-9"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("headerSearchAria")}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-white/70 transition hover:text-white sm:h-9 sm:w-9"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>

        {open && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("headerSearchPlaceholder")}
            className="flex-1 bg-transparent pr-3 text-sm text-white placeholder-white/30 outline-none"
          />
        )}
      </div>

      {open && (query.length > 0) && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-72 overflow-hidden rounded-xl bg-[#0e1220] shadow-xl ring-1 ring-white/10 sm:w-80 sm:max-w-none">
          {loading ? (
            <p className="px-4 py-3 text-xs text-white/40">{t("headerSearchLoading")}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-white/40">{t("headerSearchEmpty")}</p>
          ) : (
            <div>
              {results.map((event) => (
                <Link
                  key={event.slug}
                  href={`/events/${event.slug}`}
                  onClick={handleClose}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.06]"
                >
                  {(event.cardImageUrl ?? event.imageUrl) ? (
                    <img
                      src={event.cardImageUrl ?? event.imageUrl ?? ""}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-white/[0.06]" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{event.title}</p>
                    <p className="truncate text-xs text-white/40">
                      {[event.category?.name, event.venue?.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
