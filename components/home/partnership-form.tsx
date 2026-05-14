"use client";

import { useState } from "react";
import { useLang } from "@/components/layout/lang-context";

type Status = "idle" | "loading" | "success" | "error";

export function PartnershipForm() {
  const [form, setForm] = useState({ email: "", phone: "", intro: "" });
  const [status, setStatus] = useState<Status>("idle");
  const { t } = useLang();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
          ticketType: "Partnership",
          message: form.intro,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          setStatus("idle");
          setForm({ email: "", phone: "", intro: "" });
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
        <p className="font-goldman text-2xl font-bold text-white">{t("partnerSuccessTitle")}</p>
        <p className="mt-3 text-sm text-white/50">{t("partnerSuccessDesc")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold tracking-wide text-white/50">{t("footerPartnershipEmail")}</label>
          <input
            type="email"
            required
            placeholder={t("footerPartnershipEmail").replace("* ", "")}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-2xl bg-white/[0.06] px-5 py-4 text-sm text-white placeholder-white/25 outline-none ring-1 ring-white/10 transition focus:ring-white/30"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold tracking-wide text-white/50">{t("footerPartnershipPhone")}</label>
          <div className="flex overflow-hidden rounded-2xl ring-1 ring-white/10 transition focus-within:ring-white/30">
            <div className="flex shrink-0 items-center bg-white/[0.08] px-4 text-sm text-white/60">
              <span>+976</span>
            </div>
            <input
              type="tel"
              required
              placeholder="8888 8888"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="flex-1 bg-white/[0.06] px-4 py-4 text-sm text-white placeholder-white/25 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold tracking-wide text-white/50">{t("footerPartnershipIntro")}</label>
        <textarea
          required
          rows={4}
          placeholder={t("footerPartnershipIntroPlaceholder")}
          value={form.intro}
          onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
          className="w-full resize-none rounded-2xl bg-white/[0.06] px-5 py-4 text-sm text-white placeholder-white/25 outline-none ring-1 ring-white/10 transition focus:ring-white/30"
        />
      </div>

      {status === "error" && (
        <p className="text-xs text-red-400">{t("footerPartnershipError")}</p>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-2xl py-3 text-sm font-bold disabled:opacity-60"
          style={{ background: "#ffffff", color: "#000000" }}
        >
          {status === "loading" ? t("footerPartnershipSubmitting") : t("footerPartnershipSubmit")}
        </button>
      </div>
    </form>
  );
}
