"use client";

import { useState } from "react";

type Result = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  lat: number | null;
  lon: number | null;
  onChange: (lat: number, lon: number, label: string) => void;
};

export function LocationPicker({ lat, lon, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "mn,en" } }
      );
      const data = (await res.json()) as Result[];
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  function pick(r: Result) {
    const parsed = { lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
    setLabel(r.display_name);
    setResults([]);
    setQuery("");
    onChange(parsed.lat, parsed.lon, r.display_name);
  }

  const mapSrc =
    lat !== null && lon !== null
      ? `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="Газрын нэрээр хайх..."
          className="w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/20 outline-none ring-1 ring-white/[0.07] transition focus:ring-white/20"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="shrink-0 rounded-xl bg-white/[0.07] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.12] disabled:opacity-50"
        >
          {loading ? "..." : "Хайх"}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-xl bg-[#0d1117] ring-1 ring-white/[0.08]">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(r)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.05] first:rounded-t-xl last:rounded-b-xl"
            >
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7224]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map preview */}
      {mapSrc && (
        <div className="overflow-hidden rounded-xl">
          <div className="relative h-48 w-full bg-[#0a0f17]">
            <iframe
              title="Location preview"
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
          </div>
          {label && (
            <div className="flex items-center gap-2 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#ff7224]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11Z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
              <span className="line-clamp-1">{label}</span>
            </div>
          )}
        </div>
      )}

      {!mapSrc && (
        <div className="flex h-36 items-center justify-center rounded-xl bg-white/[0.03] text-xs text-white/25">
          Газар хайж сонгоно уу
        </div>
      )}
    </div>
  );
}
