export default function ResaleLoading() {
  return (
    <section className="min-h-screen bg-[#07080d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mt-3 h-8 w-56 animate-pulse rounded-xl bg-white/[0.06]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl bg-[#0e1424] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-40 w-full animate-pulse bg-white/[0.06]" />
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-white/[0.06]" />
                <div className="h-3 w-1/2 animate-pulse rounded-lg bg-white/[0.04]" />
                <div className="h-3 w-2/3 animate-pulse rounded-lg bg-white/[0.04]" />
                <div className="mt-auto flex items-end justify-between">
                  <div className="h-6 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
                  <div className="h-8 w-16 animate-pulse rounded-xl bg-[#ff7224]/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
