"use client";

import { useState, useTransition } from "react";

type FormValues = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  websiteUrl: string;
  socialUrl: string;
  description: string;
};

const INITIAL: FormValues = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  websiteUrl: "",
  socialUrl: "",
  description: "",
};

export function OrganizerApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/organizer-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setFeedback({
            message: data.error ?? "Submission failed. Please try again.",
            type: "error",
          });
        } else {
          setSubmitted(true);
        }
      } catch {
        setFeedback({
          message: "Network error. Please try again.",
          type: "error",
        });
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-emerald-400/10 p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 mx-auto">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-emerald-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Application submitted!</h3>
        <p className="mt-2 text-sm text-white/52">
          We will review your application and send a password setup link to your
          email once approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Company Name *"
          name="companyName"
          value={values.companyName}
          onChange={handleChange}
          required
          placeholder="Your company name"
        />
        <Field
          label="Contact Name *"
          name="contactName"
          value={values.contactName}
          onChange={handleChange}
          required
          placeholder="Your full name"
        />
        <Field
          label="Email *"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          required
          placeholder="company@example.com"
        />
        <Field
          label="Phone *"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          required
          placeholder="+976 9900 0000"
        />
        <Field
          label="Website"
          name="websiteUrl"
          type="url"
          value={values.websiteUrl}
          onChange={handleChange}
          placeholder="https://yourcompany.com"
        />
        <Field
          label="Social URL"
          name="socialUrl"
          type="url"
          value={values.socialUrl}
          onChange={handleChange}
          placeholder="https://instagram.com/yourpage"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40"
        >
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          value={values.description}
          onChange={handleChange}
          placeholder="Tell us about your company, the events you plan to organize, and your goals..."
          className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
        />
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "bg-red-400/10 text-red-300"
              : "bg-emerald-400/10 text-emerald-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#ff7224] py-3.5 text-sm font-bold text-white transition hover:bg-[#ff8442] disabled:opacity-50"
      >
        {isPending ? "Submitting application..." : "Submit Application"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
      />
    </div>
  );
}
