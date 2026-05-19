"use client";

import { useState, useEffect, type ReactNode } from "react";

type PaymentMethod = "QPay" | "SocialPay" | "Alipay" | "LendMN";

const METHODS: { id: PaymentMethod; label: string; color: string; icon: ReactNode }[] = [
  {
    id: "QPay",
    label: "QPay",
    color: "#005BAC",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
        <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
        <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
        <path d="M14 14h2v2h-2zM17 14h3M14 17h3M17 17h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "SocialPay",
    label: "SocialPay",
    color: "#E60026",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 14.5h4M16 14.5h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "Alipay",
    label: "Alipay",
    color: "#1677FF",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 16l1.5-4L12 8l1.5 4L15 16M9.8 13.5h4.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "LendMN",
    label: "LendMN",
    color: "#00B050",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v12M9.5 9.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1 1.8-2.5 2.2c2 .5 2.5 1.3 2.5 2.3s-.9 2-2.5 2-2.5-.9-2.5-2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const FP = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

function FakeQRCode({ seed }: { seed: string }) {
  const N = 21;
  const C = 7;

  let sh = 5381;
  for (let i = 0; i < seed.length; i++) {
    sh = ((sh << 5) + sh + seed.charCodeAt(i)) | 0;
  }
  sh = sh >>> 0;

  const dark: Array<[number, number]> = [];

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let d = false;

      if (r <= 6 && c <= 6) {
        d = (FP[r]?.[c] ?? 0) === 1;
      } else if (r <= 6 && c >= 14) {
        d = (FP[r]?.[c - 14] ?? 0) === 1;
      } else if (r >= 14 && c <= 6) {
        d = (FP[r - 14]?.[c] ?? 0) === 1;
      } else if (r === 6 || c === 6) {
        d = (r + c) % 2 === 0;
      } else {
        const v = (sh ^ ((r * 0x9e3779b9 + c * 0x6c62272e) >>> 0)) >>> 0;
        d = v % 100 < 45;
      }

      if (d) dark.push([r, c]);
    }
  }

  return (
    <svg
      width={N * C}
      height={N * C}
      viewBox={`0 0 ${N * C} ${N * C}`}
      style={{ display: "block" }}
    >
      <rect width={N * C} height={N * C} fill="white" />
      {dark.map(([r, c], i) => (
        <rect key={i} x={c * C} y={r * C} width={C} height={C} fill="#111" />
      ))}
    </svg>
  );
}

type Props = {
  totalPrice: string;
  totalQty: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
};

export function PaymentModal({ totalPrice, totalQty, onClose, onConfirm, onSuccess }: Props) {
  const [step, setStep] = useState<"select" | "qr" | "verifying" | "success" | "error">("select");
  const [method, setMethod] = useState<(typeof METHODS)[number] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSelect = (m: (typeof METHODS)[number]) => {
    setMethod(m);
    setStep("qr");
  };

  const handleCheck = async () => {
    setStep("verifying");
    try {
      await onConfirm();
      setStep("success");
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Алдаа гарлаа. Дахин оролдоно уу.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#0d1017] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            {step === "qr" && (
              <button
                onClick={() => setStep("select")}
                className="rounded-full p-1.5 text-white/40 hover:text-white hover:bg-white/[0.08] transition"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <h2 className="text-sm font-bold text-white">
              {step === "select" && "Төлбөрийн хэрэгсэл сонгох"}
              {step === "qr" && `${method?.label} — QR код`}
              {step === "verifying" && "Шалгаж байна..."}
              {step === "success" && "Амжилттай!"}
              {step === "error" && "Алдаа гарлаа"}
            </h2>
          </div>
          {step !== "verifying" && step !== "success" && (
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-white/40 hover:text-white hover:bg-white/[0.08] transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 pb-6">
          {/* Method selection */}
          {step === "select" && (
            <div className="flex flex-col gap-4">
              {/* Total amount */}
              <div className="rounded-xl bg-white/[0.05] px-4 py-3 text-center">
                <p className="text-[0.65rem] text-white/40 uppercase tracking-widest">Нийт төлөх дүн</p>
                <p className="mt-1 text-2xl font-bold text-white">{totalPrice}</p>
                <p className="mt-0.5 text-xs text-white/35">{totalQty} тасалбар</p>
              </div>
              <p className="text-xs text-white/40 text-center">Төлбөрийн хэрэгслээ сонгоно уу</p>
              <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-5 text-white transition hover:opacity-90 active:scale-[0.97]"
                  style={{ backgroundColor: m.color }}
                >
                  {m.icon}
                  <span className="text-sm font-bold">{m.label}</span>
                </button>
              ))}
              </div>
            </div>
          )}

          {/* QR code */}
          {step === "qr" && method && (
            <div className="flex flex-col items-center gap-3">
              <div
                className="rounded-full px-4 py-1.5 text-xs font-bold text-white"
                style={{ backgroundColor: method.color }}
              >
                {method.label}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalPrice}</p>
                <p className="mt-0.5 text-xs text-white/40">{totalQty} тасалбар</p>
              </div>
              <div className="rounded-xl bg-white p-2 shadow-lg">
                <FakeQRCode seed={`${method.id}-${totalPrice}`} />
              </div>
              <p className="text-xs text-white/35 text-center">
                {method.label} апп-аараа QR кодыг уншуулна уу
              </p>
              <button
                onClick={handleCheck}
                className="w-full rounded-full bg-[#ff7224] py-3.5 text-sm font-bold text-white transition hover:bg-[#e5641a] active:scale-[0.98]"
              >
                Төлбөр шалгах
              </button>
            </div>
          )}

          {/* Verifying */}
          {step === "verifying" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <svg
                className="h-10 w-10 animate-spin text-[#ff7224]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm text-white/60">Төлбөр шалгаж байна...</p>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-white">Төлбөр амжилттай төлөгдлөө!</p>
                <p className="mt-1 text-xs text-white/40">Тасалбар таны профайл дээр байна</p>
              </div>
              <p className="text-[0.65rem] text-white/25">Профайл руу шилжүүлж байна...</p>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Алдаа гарлаа</p>
                <p className="mt-1 text-xs text-white/40">{errorMsg}</p>
              </div>
              <button
                onClick={() => setStep("qr")}
                className="rounded-full border border-white/[0.15] px-5 py-2.5 text-xs font-semibold text-white/70 transition hover:text-white hover:bg-white/[0.06]"
              >
                Дахин оролдох
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
