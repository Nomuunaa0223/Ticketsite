"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

export function HeroSearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) {
      router.push(`/events?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/events");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 flex w-full max-w-xl overflow-hidden rounded-full border border-white/10 bg-white/[0.05] shadow-[0_0_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition focus-within:border-[#ff7224]/40 focus-within:shadow-[0_0_40px_rgba(255,114,36,0.15)]"
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Search events, artists, venues..."
        className="flex-1 bg-transparent px-6 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
      />
      <button
        type="submit"
        className="m-1 rounded-full bg-[#ff7224] px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(255,114,36,0.4)] transition hover:bg-[#ff8442]"
      >
        Search
      </button>
    </form>
  );
}
