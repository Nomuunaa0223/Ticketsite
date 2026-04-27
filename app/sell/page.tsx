import { ResaleCard } from "@/components/cards/resale-card";
import { getPublicResaleListings } from "@/lib/resales";

export default async function SellPage() {
  const listings = await getPublicResaleListings();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 rounded-[2rem] border border-white/10 bg-white p-8 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-tertiary-accent">
          Community resale
        </p>
        <h1 className="mt-3 font-serif text-5xl leading-tight text-accent sm:text-6xl">
          Resale tickets with clear rules
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-black/65">
          Explore community listings with transparent buyer fees, ownership-based transfers, and
          marketplace rules that stay visible from list price to final total.
        </p>
      </div>

      <div className="space-y-6">
        {listings.map((listing) => (
          <ResaleCard key={listing.id} listing={listing} />
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-6 text-sm text-black/60">
          No resale tickets have been listed yet.
        </div>
      ) : null}
    </section>
  );
}
