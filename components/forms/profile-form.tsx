"use client";

import { useState, useTransition } from "react";

type Profile = {
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: Date;
};

type Props = {
  profile: Profile;
};

export function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [values, setValues] = useState({
    fullName: profile.fullName,
    phone: profile.phone ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setFeedback({
            message: data.error ?? "Failed to save changes.",
            type: "error",
          });
        } else {
          setFeedback({ message: "Profile updated.", type: "success" });
        }
      } catch {
        setFeedback({ message: "Network error. Please try again.", type: "error" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="fullName"
            className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30"
          >
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={values.fullName}
            onChange={handleChange}
            className="mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30"
          >
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            placeholder="Optional"
            className="mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
          />
        </div>
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
        className="rounded-xl bg-[#ff7224] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff8442] disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
