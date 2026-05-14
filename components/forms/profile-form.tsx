"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/layout/lang-context";

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
  const router = useRouter();
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
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
          setFeedback({ message: data.error ?? t("profileSaveError"), type: "error" });
        } else {
          setFeedback({ message: t("profileSaved"), type: "success" });
          setEditing(false);
          router.refresh();
          setTimeout(() => setFeedback(null), 3000);
        }
      } catch {
        setFeedback({ message: t("profileNetworkError"), type: "error" });
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        {feedback?.type === "success" && (
          <p className="text-xs text-emerald-400">{feedback.message}</p>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="self-start rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
        >
          {t("profileEdit")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">
            {t("profileName")}
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
          <label htmlFor="phone" className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/30">
            {t("profilePhone")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            placeholder="+976 xxxxxxxx"
            className="mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
          />
        </div>
      </div>

      {feedback?.type === "error" && (
        <p className="text-xs text-red-400">{feedback.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#ff7224] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e5641a] disabled:opacity-50"
        >
          {isPending ? t("profileSaving") : t("profileSave")}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setFeedback(null); }}
          className="text-sm text-white/40 transition hover:text-white/70"
        >
          {t("profileCancel")}
        </button>
      </div>
    </form>
  );
}
