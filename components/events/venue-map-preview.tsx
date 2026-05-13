type Props = {
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export function VenueMapPreview({ name, latitude, longitude }: Props) {
  const hasCoords =
    typeof latitude === "number" && typeof longitude === "number";

  if (!hasCoords) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-white/[0.03] text-sm text-white/30">
        <div className="text-center">
          <MapPinIcon className="mx-auto mb-2 h-8 w-8 text-white/20" />
          <span>{name}</span>
          <p className="mt-1 text-xs text-white/20">Location not available</p>
        </div>
      </div>
    );
  }

  const googleMapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${latitude},${longitude}`;

  return (
    <div className="overflow-hidden rounded-xl">
      <div className="relative h-48 w-full bg-[#0a0f17]">
        <iframe
          title={`Map of ${name}`}
          src={googleMapsUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
      </div>
      <div className="flex items-center justify-between rounded-b-xl bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <MapPinIcon className="h-4 w-4 text-[#ff7224]" />
          <span>{name}</span>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#ff7224] transition hover:text-[#ff8b46]"
        >
          Get directions
        </a>
      </div>
    </div>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}
