"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Холбоос хүчингүй байна.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }
    setPending(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const payload = (await res.json()) as { error?: string };

    if (!res.ok) {
      setError(payload.error ?? "Алдаа гарлаа.");
      setPending(false);
      return;
    }

    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07090f] px-4">
      <div className="w-full max-w-[400px] rounded-2xl bg-[#0e1424] p-8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-[#ff7224]">TIXORA</p>
        <h1 className="mb-6 text-xl font-bold text-white">Нууц үг шинэчлэх</h1>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-400">Нууц үг амжилттай шинэчлэгдлээ.</p>
            <a
              href="/login"
              className="block w-full rounded-xl bg-[#ff7224] py-3 text-center text-sm font-bold text-white transition hover:bg-[#ff8c42]"
            >
              НЭВТРЭХ
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/50">Шинэ нууц үг</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Хамгийн багадаа 8 тэмдэгт"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#ff7224]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/50">Нууц үг давтах</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Дахин оруулна уу"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#ff7224]/50 focus:outline-none"
              />
            </div>

            {error ? (
              <p className="text-xs font-semibold text-red-400">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={pending || !token}
              className="w-full rounded-xl bg-[#ff7224] py-3 text-sm font-bold text-white transition hover:bg-[#ff8c42] disabled:opacity-50"
            >
              {pending ? "ХАДГАЛЖ БАЙНА..." : "ХАДГАЛАХ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
