"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type RelatedImage = { type: string; title: string; url: string };

type EventData = {
  id: string;
  title: string;
  imageUrl: string | null;
  cardImageUrl: string | null;
  relatedImages: RelatedImage[];
  summary: string | null;
  description: string | null;
  categoryId: string;
  startsAt: Date;
  endsAt: Date;
  saleStartsAt: Date;
  saleEndsAt: Date;
  status: string;
  ticketName: string;
  price: string;
  quantityTotal: string;
  totalQuantity: string;
  soldQuantity: string;
  remainingQuantity: string;
  venue: {
    name: string;
    city: string;
    country: string;
    address: string;
    timezone: string;
    capacity: string;
    latitude: string;
    longitude: string;
  };
};

type Category = { id: string; name: string };

type Props = {
  event: EventData;
  categories: Category[];
};

function toLocalDatetime(date: Date): string {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toIso(value: string): string {
  return new Date(value).toISOString();
}

function ImageUploadSlot({
  value,
  onChange,
  label,
  aspect = "16/6",
}: {
  value: string | null;
  onChange: (url: string) => void;
  label: string;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.set("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload амжилтгүй боллоо.");
      } else {
        onChange(data.url);
      }
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="relative w-full overflow-hidden rounded-xl disabled:cursor-not-allowed"
        style={{ aspectRatio: aspect }}
      >
        {value ? (
          <Image src={value} alt={label} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/[0.04] text-white/30 transition hover:bg-white/[0.07]">
            {uploading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
              </svg>
            )}
            <span className="text-[0.7rem] font-semibold">
              {uploading ? "Байршуулж байна..." : "Зураг оруулах"}
            </span>
          </div>
        )}
        {value && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
            <span className="text-xs font-semibold text-white">
              {uploading ? "Байршуулж байна..." : "Солих"}
            </span>
          </div>
        )}
      </button>
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

export function OrganizerEventEditForm({ event, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [useCustomVenue, setUseCustomVenue] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(event.imageUrl);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(event.cardImageUrl);
  const [galleryImages, setGalleryImages] = useState<[string | null, string | null]>([
    event.relatedImages[0]?.url ?? null,
    event.relatedImages[1]?.url ?? null,
  ]);

  const [values, setValues] = useState({
    categoryId: event.categoryId,
    title: event.title,
    summary: event.summary ?? "",
    description: event.description ?? "",
    startsAt: toLocalDatetime(event.startsAt),
    endsAt: toLocalDatetime(event.endsAt),
    saleStartsAt: toLocalDatetime(event.saleStartsAt),
    saleEndsAt: toLocalDatetime(event.saleEndsAt),
    ticketName: event.ticketName,
    price: event.price,
    quantityTotal: event.quantityTotal,
    // Venue
    venueName: event.venue.name,
    venueCity: event.venue.city,
    venueCountry: event.venue.country,
    venueAddress: event.venue.address,
    venueTimezone: event.venue.timezone,
    venueCapacity: event.venue.capacity,
    venueLatitude: event.venue.latitude,
    venueLongitude: event.venue.longitude,
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function setGalleryImage(i: 0 | 1, url: string) {
    setGalleryImages((prev) => {
      const next: [string | null, string | null] = [...prev] as [string | null, string | null];
      next[i] = url;
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const relatedImages = galleryImages
          .filter(Boolean)
          .map((url, i) => ({ type: "gallery", title: `Image ${i + 2}`, url: url! }));

        const payload: Record<string, unknown> = {
          categoryId: values.categoryId,
          title: values.title,
          imageUrl: imageUrl || null,
          cardImageUrl: cardImageUrl || null,
          relatedImages: relatedImages.length ? relatedImages : [],
          summary: values.summary,
          description: values.description,
          startsAt: toIso(values.startsAt),
          endsAt: toIso(values.endsAt),
          saleStartsAt: toIso(values.saleStartsAt),
          saleEndsAt: toIso(values.saleEndsAt),
          ticketTypes: [
            {
              name: values.ticketName,
              price: Number(values.price),
              quantityTotal: Number(values.quantityTotal),
              maxPerOrder: 8,
              resaleAllowed: true,
            },
          ],
        };

        if (useCustomVenue) {
          payload.customVenue = {
            name: values.venueName,
            city: values.venueCity,
            country: values.venueCountry,
            address: values.venueAddress,
            timezone: values.venueTimezone,
            capacity: Number(values.venueCapacity),
            latitude: Number(values.venueLatitude),
            longitude: Number(values.venueLongitude),
          };
        }

        const res = await fetch(`/api/organizer/events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setFeedback({
            message: data.error ?? "Failed to save changes.",
            type: "error",
          });
        } else {
          router.push("/dashboard/organizer/my-events");
        }
      } catch {
        setFeedback({
          message: "Network error. Please try again.",
          type: "error",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#0f1629] p-4">
        <div className="text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">Total</p>
          <p className="mt-1 text-2xl font-bold text-white">{event.totalQuantity}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">Sold</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{event.soldQuantity}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">Remaining</p>
          <p className="mt-1 text-2xl font-bold text-[#ff7224]">{event.remainingQuantity}</p>
        </div>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
            event.status === "PUBLISHED"
              ? "bg-emerald-400/16 text-emerald-300"
              : event.status === "PENDING_REVIEW"
                ? "bg-amber-400/16 text-amber-300"
                : event.status === "REJECTED"
                  ? "bg-red-400/16 text-red-300"
                  : "bg-white/10 text-white/50"
          }`}
        >
          {event.status.replaceAll("_", " ")}
        </span>
      </div>

      {/* Basic info */}
      <div className="space-y-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
          Event Details
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className={labelClass}>Category</label>
            <select
              id="categoryId"
              name="categoryId"
              required
              value={values.categoryId}
              onChange={handleChange}
              className={inputClass}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="title" className={labelClass}>Event Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              minLength={4}
              value={values.title}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
            Images
          </p>
          <ImageUploadSlot
            value={imageUrl}
            onChange={setImageUrl}
            label="Cover image (main)"
            aspect="16/6"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadSlot
              value={cardImageUrl}
              onChange={setCardImageUrl}
              label="Card image"
              aspect="4/3"
            />
            <ImageUploadSlot
              value={galleryImages[0]}
              onChange={(url) => setGalleryImage(0, url)}
              label="Gallery image 1"
              aspect="4/3"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadSlot
              value={galleryImages[1]}
              onChange={(url) => setGalleryImage(1, url)}
              label="Gallery image 2"
              aspect="4/3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="summary" className={labelClass}>Summary</label>
          <input
            id="summary"
            name="summary"
            type="text"
            required
            minLength={10}
            value={values.summary}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea
            id="description"
            name="description"
            required
            minLength={40}
            rows={5}
            value={values.description}
            onChange={handleChange}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
          Schedule
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { id: "startsAt", label: "Starts at", name: "startsAt" },
              { id: "endsAt", label: "Ends at", name: "endsAt" },
              { id: "saleStartsAt", label: "Sale starts", name: "saleStartsAt" },
              { id: "saleEndsAt", label: "Sale ends", name: "saleEndsAt" },
            ] as const
          ).map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className={labelClass}>
                {field.label}
              </label>
              <input
                id={field.id}
                name={field.name}
                type="datetime-local"
                required
                value={values[field.name]}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ticket type */}
      <div className="space-y-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
          Primary Ticket Type
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label htmlFor="ticketName" className={labelClass}>Ticket Name</label>
            <input
              id="ticketName"
              name="ticketName"
              type="text"
              required
              value={values.ticketName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="price" className={labelClass}>Price</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={values.price}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="quantityTotal" className={labelClass}>Total Quantity</label>
            <input
              id="quantityTotal"
              name="quantityTotal"
              type="number"
              min="1"
              required
              value={values.quantityTotal}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#ff7224]">
            Venue
          </p>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-white/50">
            <input
              type="checkbox"
              checked={useCustomVenue}
              onChange={(e) => setUseCustomVenue(e.target.checked)}
              className="accent-[#ff7224]"
            />
            Change venue
          </label>
        </div>

        {useCustomVenue ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { id: "venueName", label: "Venue Name", name: "venueName" },
                { id: "venueCity", label: "City", name: "venueCity" },
                { id: "venueCountry", label: "Country", name: "venueCountry" },
                { id: "venueTimezone", label: "Timezone", name: "venueTimezone" },
                { id: "venueCapacity", label: "Capacity", name: "venueCapacity", type: "number" },
                { id: "venueLatitude", label: "Latitude", name: "venueLatitude", type: "number" },
                { id: "venueLongitude", label: "Longitude", name: "venueLongitude", type: "number" },
              ] as const
            ).map((field) => (
              <div key={field.id} className={field.id === "venueName" ? "sm:col-span-2" : ""}>
                <label htmlFor={field.id} className={labelClass}>
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.name}
                  type={"type" in field ? field.type : "text"}
                  value={values[field.name]}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label htmlFor="venueAddress" className={labelClass}>Address</label>
              <input
                id="venueAddress"
                name="venueAddress"
                type="text"
                value={values.venueAddress}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white/[0.03] px-4 py-3 text-sm text-white/60">
            <p className="font-semibold text-white">{event.venue.name}</p>
            <p className="text-xs text-white/40">
              {event.venue.address}, {event.venue.city}, {event.venue.country}
            </p>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-red-400/10 text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[#ff7224] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#ff8442] disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save and submit for review"}
      </button>
    </form>
  );
}

const labelClass =
  "block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30 [&>option]:bg-[#0f1629]";
