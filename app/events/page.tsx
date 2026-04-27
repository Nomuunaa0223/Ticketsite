import { EventCard } from "@/components/cards/event-card";
import { getPublicEvents } from "@/lib/events";

const categoryLabels: Record<string, string> = {
  sports: "Sports",
  music: "Music",
  "theater-arts": "Theater & Arts",
  comedy: "Comedy",
  festival: "Festival",
  conference: "Conference"
};

type EventsPageProps = {
  searchParams?: Promise<{
    category?: string;
  }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedCategory = resolvedSearchParams?.category;
  const events = await getPublicEvents(selectedCategory);
  const categoryLabel = selectedCategory ? categoryLabels[selectedCategory] : null;
  const isSportsCategory = selectedCategory === "sports";
  const description = categoryLabel
    ? `Browse approved ${categoryLabel.toLowerCase()} events. Organizer submissions appear here after admin approval.`
    : "Browse approved events with visible pricing and verified ticket inventory.";

  return (
    <section className="min-h-screen bg-[#160905] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff7224]">
          {categoryLabel ? `${categoryLabel} events` : "All events"}
        </p>
        <h1 className="mt-3 font-goldman text-4xl font-bold leading-tight text-white sm:text-6xl">
          <span className={isSportsCategory ? "text-sports-gradient" : ""}>
            {categoryLabel ? `${categoryLabel} events` : "Live events with visible pricing"}
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {events.length === 0 ? (
        <div className="mt-8 rounded-[1rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
          {categoryLabel
            ? `No ${categoryLabel.toLowerCase()} events are published yet.`
            : "No events are published yet."}
        </div>
      ) : null}
      </div>
    </section>
  );
}
