"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

export function OrganizerEventEditForm({ event, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [useCustomVenue, setUseCustomVenue] = useState(false);

  const [values, setValues] = useState({
    categoryId: event.categoryId,
    title: event.title,
    imageUrl: event.imageUrl ?? "",
    cardImageUrl: event.cardImageUrl ?? "",
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          categoryId: values.categoryId,
          title: values.title,
          imageUrl: values.imageUrl || null,
          cardImageUrl: values.cardImageUrl || null,
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
          setFeedback({
            message: "Changes saved and sent to admin review.",
            type: "success",
          });
          router.refresh();
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="imageUrl" className={labelClass}>Image URL</label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={values.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cardImageUrl" className={labelClass}>Card Image URL</label>
            <input
              id="cardImageUrl"
              name="cardImageUrl"
              type="url"
              value={values.cardImageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
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
