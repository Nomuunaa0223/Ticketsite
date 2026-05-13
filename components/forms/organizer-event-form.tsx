"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type OrganizerEventFormProps = {
  categories: Array<{ id: string | number; name: string }>;
  venues?: Array<{ id: string | number; name: string; city: string }>;
};

function toIso(value: string) {
  return new Date(value).toISOString();
}

export function OrganizerEventForm({ categories, venues }: OrganizerEventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      categoryId: String(form.get("categoryId")),
      venueId: String(form.get("venueId")),
      title: String(form.get("title")),
      summary: String(form.get("summary")),
      description: String(form.get("description")),
      startsAt: toIso(String(form.get("startsAt"))),
      endsAt: toIso(String(form.get("endsAt"))),
      saleStartsAt: toIso(String(form.get("saleStartsAt"))),
      saleEndsAt: toIso(String(form.get("saleEndsAt"))),
      currency: "USD",
      platformFeeBps: 900,
      serviceFeeBps: 350,
      ticketTypes: [
        {
          name: String(form.get("ticketName")),
          price: Number(form.get("price")),
          quantityTotal: Number(form.get("quantityTotal")),
          maxPerOrder: 8,
          resaleAllowed: true
        }
      ]
    };

    const response = await fetch("/api/organizer/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage("Event request failed. Check every field and try again.");
      return;
    }

    event.currentTarget.reset();
    setMessage("Event request sent to admin review.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="organizer-field">
          <span>Category</span>
          <select name="categoryId" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="organizer-field">
          <span>Venue</span>
          <select name="venueId" required>
            {(venues ?? []).map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}, {venue.city}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="organizer-field">
        <span>Event title</span>
        <input name="title" required minLength={4} placeholder="Midnight Jazz" />
      </label>

      <label className="organizer-field">
        <span>Summary</span>
        <input name="summary" required minLength={10} placeholder="A warm live set with transparent ticket pricing." />
      </label>

      <label className="organizer-field">
        <span>Description</span>
        <textarea name="description" required minLength={40} rows={4} placeholder="Write the full event description for admin review." />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="organizer-field">
          <span>Starts at</span>
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label className="organizer-field">
          <span>Ends at</span>
          <input name="endsAt" type="datetime-local" required />
        </label>
        <label className="organizer-field">
          <span>Sale starts</span>
          <input name="saleStartsAt" type="datetime-local" required />
        </label>
        <label className="organizer-field">
          <span>Sale ends</span>
          <input name="saleEndsAt" type="datetime-local" required />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="organizer-field sm:col-span-1">
          <span>Ticket</span>
          <input name="ticketName" required defaultValue="General Admission" />
        </label>
        <label className="organizer-field">
          <span>Price</span>
          <input name="price" type="number" min="1" step="0.01" required />
        </label>
        <label className="organizer-field">
          <span>Quantity</span>
          <input name="quantityTotal" type="number" min="1" required />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="hero-primary-btn w-full px-5 py-3 disabled:opacity-60">
        {isSubmitting ? "Sending..." : "Send to admin review"}
      </button>
      {message ? <p className="text-sm text-white/68">{message}</p> : null}
    </form>
  );
}
