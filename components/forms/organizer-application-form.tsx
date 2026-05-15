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

const inputCls =
  "mt-1.5 w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/25 outline-none ring-1 ring-white/[0.07] transition focus:ring-white/20";

export function OrganizerApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
          setFeedback({ message: data.error ?? "Хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.", type: "error" });
        } else {
          setSubmitted(true);
        }
      } catch {
        setFeedback({ message: "Сүлжээний алдаа. Дахин оролдоно уу.", type: "error" });
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-emerald-400/10 p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 mx-auto">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white">Хүсэлт амжилттай илгээгдлээ!</h3>
        <p className="mt-2 text-sm text-white/52">
          Админ таны хүсэлтийг хянасны дараа нэвтрэх мэдээллийг имэйлээр илгээнэ.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Байгууллагын нэр *" name="companyName" value={values.companyName} onChange={handleChange} required placeholder="Байгууллагын нэр" />
        <Field label="Холбоо барих хүний нэр *" name="contactName" value={values.contactName} onChange={handleChange} required placeholder="Овог нэр" />
        <Field label="Имэйл *" name="email" type="email" value={values.email} onChange={handleChange} required placeholder="company@example.com" />
        <Field label="Утасны дугаар *" name="phone" type="tel" value={values.phone} onChange={handleChange} required placeholder="+976 9900 0000" />
        <Field label="Вэбсайт" name="websiteUrl" type="url" value={values.websiteUrl} onChange={handleChange} placeholder="https://yourcompany.com" />
        <Field label="Сошиал хаяг" name="socialUrl" type="url" value={values.socialUrl} onChange={handleChange} placeholder="https://instagram.com/yourpage" />
      </div>

      <div>
        <label htmlFor="description" className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
          Танилцуулга *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          value={values.description}
          onChange={handleChange}
          placeholder="Байгууллагынхаа болон зохион байгуулахаар төлөвлөж буй арга хэмжээнүүдийн тухай товч бичнэ үү..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm ${feedback.type === "error" ? "bg-red-400/10 text-red-300" : "bg-emerald-400/10 text-emerald-300"}`}>
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#ff7224] py-3.5 text-sm font-bold text-white transition hover:bg-[#ff8442] disabled:opacity-50"
      >
        {isPending ? "Илгээж байна..." : "Хүсэлт илгээх"}
      </button>
    </form>
  );
}

function Field({
  label, name, type = "text", value, onChange, required, placeholder,
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
      <label htmlFor={name} className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40">
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
        className="mt-1.5 w-full rounded-xl bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/25 outline-none ring-1 ring-white/[0.07] transition focus:ring-white/20"
      />
    </div>
  );
}
