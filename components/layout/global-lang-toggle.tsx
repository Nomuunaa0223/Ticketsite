"use client";

import { useLang } from "@/components/layout/lang-context";

export function GlobalLangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex overflow-hidden rounded-full border border-white/10 bg-[#0d1017] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider transition-colors ${
          lang === "en"
            ? "bg-[#ff7224] text-white"
            : "text-white/40 hover:text-white"
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("mn")}
        className={`px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider transition-colors ${
          lang === "mn"
            ? "bg-[#ff7224] text-white"
            : "text-white/40 hover:text-white"
        }`}
        aria-label="Монгол хэл рүү солих"
      >
        MN
      </button>
    </div>
  );
}
