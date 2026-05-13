"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
};

export function SetupPasswordForm({ token }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (values.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/setup-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: values.password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error ?? "Failed to set password.");
          return;
        }

        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-400/10 p-6 text-center">
        <p className="text-sm font-semibold text-emerald-300">
          Password set successfully! Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40"
        >
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          value={values.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          className="mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/40"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          value={values.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          className="mt-1.5 w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition focus:border-[#ff7224]/50 focus:ring-1 focus:ring-[#ff7224]/30"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#ff7224] py-3 text-sm font-bold text-white transition hover:bg-[#ff8442] disabled:opacity-50"
      >
        {isPending ? "Setting password..." : "Set Password"}
      </button>
    </form>
  );
}
