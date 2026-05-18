"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LocationPicker } from "@/components/forms/location-picker";

type TicketType = {
  name: string;
  price: string;
  quantityTotal: string;
  hasSeatMap: boolean;
  seatRows: string;
  seatsPerRow: string;
};

type OrganizerEventFormProps = {
  categories: Array<{ id: string | number; name: string }>;
};

function toIso(value: string) {
  return new Date(value).toISOString();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#ff8b46]">
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1rem] bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/20 outline-none ring-1 ring-white/[0.07] transition focus:ring-white/20";

const selectCls =
  "w-full rounded-xl bg-[#0d1117] px-4 py-3 text-sm text-white outline-none ring-1 ring-white/[0.07] transition focus:ring-white/20 [&>option]:bg-[#0d1117] [&>option]:text-white";

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
      <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">{label}</span>
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

export function OrganizerEventForm({ categories }: OrganizerEventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [venueLat, setVenueLat] = useState<number | null>(null);
  const [venueLon, setVenueLon] = useState<number | null>(null);
  const [extraImages, setExtraImages] = useState<[string | null, string | null]>([null, null]);

  const [tickets, setTickets] = useState<TicketType[]>([
    { name: "General Admission", price: "", quantityTotal: "", hasSeatMap: false, seatRows: "", seatsPerRow: "" },
  ]);

  function setExtraImage(i: 0 | 1, url: string) {
    setExtraImages((prev) => {
      const next: [string | null, string | null] = [...prev] as [string | null, string | null];
      next[i] = url;
      return next;
    });
  }

  function addTicket() {
    setTickets((prev) => [
      ...prev,
      { name: "", price: "", quantityTotal: "", hasSeatMap: false, seatRows: "", seatsPerRow: "" },
    ]);
  }

  function removeTicket(i: number) {
    setTickets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTicket(i: number, field: keyof TicketType, value: string) {
    setTickets((prev) =>
      prev.map((t, idx) => {
        if (idx !== i) return t;
        if (field === "hasSeatMap") return { ...t, hasSeatMap: value === "true" };
        return { ...t, [field]: value };
      })
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);

    const relatedImages = extraImages
      .filter(Boolean)
      .map((url, i) => ({ type: "gallery", title: `Image ${i + 2}`, url: url! }));

    const payload = {
      categoryId: String(form.get("categoryId")),
      imageUrl: coverImage ?? undefined,
      relatedImages: relatedImages.length ? relatedImages : undefined,
      title: String(form.get("title")),
      summary: String(form.get("summary")),
      description: String(form.get("description")),
      startsAt: toIso(String(form.get("startsAt"))),
      endsAt: toIso(String(form.get("endsAt"))),
      saleStartsAt: toIso(String(form.get("saleStartsAt"))),
      saleEndsAt: toIso(String(form.get("saleEndsAt"))),
      currency: "MNT",
      platformFeeBps: 900,
      serviceFeeBps: 350,
      ticketTypes: tickets.map((t) => {
        const rows = t.hasSeatMap
          ? t.seatRows.split(",").map((r) => r.trim()).filter(Boolean)
          : [];
        const perRow = t.hasSeatMap ? Number(t.seatsPerRow) || 0 : 0;
        const autoQty = t.hasSeatMap && rows.length > 0 && perRow > 0 ? rows.length * perRow : null;
        return {
          name: t.name,
          price: Number(t.price),
          quantityTotal: autoQty ?? Number(t.quantityTotal),
          maxPerOrder: 8,
          resaleAllowed: true,
          hasSeatMap: t.hasSeatMap,
          ...(t.hasSeatMap ? { seatRows: t.seatRows, seatsPerRow: perRow } : {}),
        };
      }),
      customVenue: {
        name: String(form.get("venueName")),
        city: String(form.get("venueCity")),
        country: String(form.get("venueCountry") || "Mongolia"),
        address: String(form.get("venueCity") || form.get("venueName")),
        timezone: "Asia/Ulaanbaatar",
        capacity: 1000,
        latitude: venueLat ?? 47.9077,
        longitude: venueLon ?? 106.8832,
      },
    };

    const response = await fetch("/api/organizer/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const err = (await response.json()) as { error?: string };
      setMessage({ text: err.error ?? "Event request failed. Check every field and try again.", ok: false });
      return;
    }

    event.currentTarget.reset();
    setTickets([{ name: "General Admission", price: "", quantityTotal: "", hasSeatMap: false, seatRows: "", seatsPerRow: "" }]);
    setCoverImage(null);
    setExtraImages([null, null]);
    setMessage({ text: "Event request sent to admin review.", ok: true });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">

      {/* Images */}
      <Card>
        <SectionLabel>Images</SectionLabel>
        <div className="grid gap-4">
          <ImageUploadSlot
            value={coverImage}
            onChange={setCoverImage}
            label="Cover image (main)"
            aspect="16/6"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadSlot
              value={extraImages[0]}
              onChange={(url) => setExtraImage(0, url)}
              label="Image 2"
              aspect="4/3"
            />
            <ImageUploadSlot
              value={extraImages[1]}
              onChange={(url) => setExtraImage(1, url)}
              label="Image 3"
              aspect="4/3"
            />
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card>
        <SectionLabel>Event info</SectionLabel>
        <div className="grid gap-4">
          <Field label="Event title">
            <input name="title" required minLength={4} placeholder="Midnight Jazz" className={inputCls} />
          </Field>
          <Field label="Category">
            <select name="categoryId" required className={selectCls}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      {/* About */}
      <Card>
        <SectionLabel>About the experience</SectionLabel>
        <div className="grid gap-4">
          <Field label="Summary">
            <input name="summary" required minLength={10} placeholder="A short description shown on event cards." className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea name="description" required minLength={40} rows={5} placeholder="Full event description for admin review." className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </Card>

      {/* Location */}
      <Card>
        <SectionLabel>Location</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue name">
            <input name="venueName" required minLength={2} placeholder="Төв Цэнгэлдэх Хүрээлэн" className={inputCls} />
          </Field>
          <Field label="City">
            <input name="venueCity" required minLength={2} placeholder="Ulaanbaatar" className={inputCls} />
          </Field>
          <Field label="Country">
            <input name="venueCountry" placeholder="Mongolia" defaultValue="Mongolia" className={inputCls} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Map location">
            <LocationPicker
              lat={venueLat}
              lon={venueLon}
              onChange={(lat, lon) => { setVenueLat(lat); setVenueLon(lon); }}
            />
          </Field>
        </div>
      </Card>

      {/* Dates */}
      <Card>
        <SectionLabel>Dates &amp; times</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts at">
            <input name="startsAt" type="datetime-local" required className={inputCls} />
          </Field>
          <Field label="Ends at">
            <input name="endsAt" type="datetime-local" required className={inputCls} />
          </Field>
          <Field label="Sale starts">
            <input name="saleStartsAt" type="datetime-local" required className={inputCls} />
          </Field>
          <Field label="Sale ends">
            <input name="saleEndsAt" type="datetime-local" required className={inputCls} />
          </Field>
        </div>
      </Card>

      {/* Ticket Types */}
      <Card>
        <SectionLabel>Ticket types</SectionLabel>
        <div className="grid gap-3">
          {tickets.map((ticket, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Field label="Ticket name">
                  <input
                    value={ticket.name}
                    onChange={(e) => updateTicket(i, "name", e.target.value)}
                    required
                    placeholder="General Admission"
                    className={inputCls}
                  />
                </Field>
                <Field label="Үнэ (₮)">
                  <input
                    value={ticket.price}
                    onChange={(e) => updateTicket(i, "price", e.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="50000"
                    className={inputCls}
                  />
                </Field>
                {!ticket.hasSeatMap && (
                  <Field label="Тоо хэмжээ">
                    <input
                      value={ticket.quantityTotal}
                      onChange={(e) => updateTicket(i, "quantityTotal", e.target.value)}
                      type="number"
                      min="1"
                      required={!ticket.hasSeatMap}
                      placeholder="100"
                      className={inputCls}
                    />
                  </Field>
                )}
                {tickets.length > 1 && (
                  <div className="flex items-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => removeTicket(i)}
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/30 transition hover:bg-red-500/20 hover:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Суудлын зураглал тохиргоо */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateTicket(i, "hasSeatMap", String(!ticket.hasSeatMap))}
                  className={`flex h-5 w-9 shrink-0 items-center rounded-full transition ${ticket.hasSeatMap ? "bg-[#ff7224]" : "bg-white/[0.1]"}`}
                >
                  <span className={`ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${ticket.hasSeatMap ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
                  Суудлын зураглалтай
                </span>
              </div>

              {ticket.hasSeatMap && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Эгнээ (жш: A,B,C,D,E)">
                    <input
                      value={ticket.seatRows}
                      onChange={(e) => updateTicket(i, "seatRows", e.target.value)}
                      placeholder="A,B,C,D,E"
                      required={ticket.hasSeatMap}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Суудал / эгнээ">
                    <input
                      value={ticket.seatsPerRow}
                      onChange={(e) => updateTicket(i, "seatsPerRow", e.target.value)}
                      type="number"
                      min="1"
                      max="50"
                      placeholder="10"
                      required={ticket.hasSeatMap}
                      className={inputCls}
                    />
                  </Field>
                  {ticket.seatRows && ticket.seatsPerRow && (
                    <p className="text-[0.65rem] text-white/30 sm:col-span-2">
                      Нийт:{" "}
                      <span className="font-semibold text-[#ff7224]">
                        {ticket.seatRows.split(",").filter((r) => r.trim()).length * (Number(ticket.seatsPerRow) || 0)}
                      </span>{" "}
                      суудал үүснэ
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTicket}
            className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-white/40 transition hover:border-white/20 hover:text-white/60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add ticket type
          </button>
        </div>
      </Card>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="hero-primary-btn px-8 py-3 disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send to admin review"}
        </button>
        {message && (
          <p className={`text-sm ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
