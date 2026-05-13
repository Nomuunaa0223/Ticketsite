"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  applicationId: number;
};

export function OrganizerApplicationActions({ applicationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/organizer-applications/${applicationId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setFeedback({
            message: data.error ?? "Something went wrong.",
            type: "error",
          });
          return;
        }

        if (action === "approve") {
          setFeedback({
            message:
              data.setupLink
                ? `Approved. Setup link: ${data.setupLink}`
                : "Approved successfully.",
            type: "success",
          });
        } else {
          setFeedback({ message: "Application rejected.", type: "success" });
        }

        router.refresh();
      } catch {
        setFeedback({
          message: "Network error. Please try again.",
          type: "error",
        });
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-col gap-3">
      {feedback && (
        <div
          className={`max-w-xs rounded-xl p-3 text-xs leading-5 ${
            feedback.type === "success"
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-red-400/10 text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("approve")}
          className="rounded-xl bg-emerald-500/15 px-5 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
        >
          {isPending ? "Processing..." : "Approve"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("reject")}
          className="rounded-xl bg-red-500/15 px-5 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
        >
          {isPending ? "Processing..." : "Reject"}
        </button>
      </div>
    </div>
  );
}
