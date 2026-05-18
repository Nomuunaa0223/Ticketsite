"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/components/layout/lang-context";

export function LangDropdown() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-[#ff7224]/10 hover:text-[#ff7224] focus-visible:outline-none sm:h-9 sm:w-9"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl bg-[#0e1220] shadow-xl ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => { setLang("en"); setOpen(false); }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/[0.06] ${lang === "en" ? "font-semibold text-[#ff7224]" : "text-white/60"}`}
          >
            <span className="text-base">🇺🇸</span> English
          </button>
          <button
            type="button"
            onClick={() => { setLang("mn"); setOpen(false); }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/[0.06] ${lang === "mn" ? "font-semibold text-[#ff7224]" : "text-white/60"}`}
          >
            <span className="text-base">🇲🇳</span> Монгол
          </button>
        </div>
      )}
    </div>
  );
}
