"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="mn">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#07080d] px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff7224]">Алдаа гарлаа</p>
        <h1 className="mt-3 text-2xl font-bold text-white">Хуудасыг ачаалахад алдаа гарлаа</h1>
        <p className="mt-2 text-sm text-white/40">Түр хугацааны алдаа байж болзошгүй. Дахин оролдоно уу.</p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-[#ff7224] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#e5641a]"
        >
          Дахин оролдох
        </button>
      </body>
    </html>
  );
}
