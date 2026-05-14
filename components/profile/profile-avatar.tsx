"use client";

import { useState, useRef } from "react";

type Props = {
  avatarUrl: string | null;
  initials: string;
};

export function ProfileAvatar({ avatarUrl, initials }: Props) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setPreview(avatarUrl);
      } else if (data.avatarUrl) {
        setPreview(data.avatarUrl);
      }
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(avatarUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-44 w-44 overflow-hidden rounded-2xl border-2 border-white/10 transition hover:border-[#ff7224]/50"
        aria-label="Change profile picture"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#ff7224]/20 text-2xl font-bold text-[#ff7224]">
            {initials}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <svg
              className="h-6 w-6 animate-spin text-white"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[0.6rem] font-semibold text-white">Change photo</span>
            </>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="max-w-[8rem] text-center text-[0.65rem] text-red-400">{error}</p>
      )}
    </div>
  );
}
