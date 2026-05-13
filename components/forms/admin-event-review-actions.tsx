"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminEventReviewActionsProps = {
  eventId: string | number;
};

export function AdminEventReviewActions({ eventId }: AdminEventReviewActionsProps) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function review(decision: "approve" | "reject") {
    setIsBusy(true);
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        reviewNotes: decision === "approve" ? "Ready to publish" : "Needs changes"
      })
    });
    setIsBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isBusy}
        onClick={() => review("approve")}
        className="rounded-full bg-[#ff7224] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        Approve
      </button>
      <button
        type="button"
        disabled={isBusy}
        onClick={() => review("reject")}
        className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/78 disabled:opacity-60"
      >
        Reject
      </button>
    </div>
  );
}
