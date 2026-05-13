import { OrganizerApplicationForm } from "@/components/forms/organizer-application-form";

export default function OrganizerApplyPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 text-white">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff7224]">Organizer application</p>
          <h1 className="font-goldman text-4xl font-bold leading-tight sm:text-5xl">
            Partner with Tixora
          </h1>
          <p className="max-w-xl text-base leading-7 text-white/62">
            Submit your company details for review. Once approved, we will create your organizer account and email you a secure password setup link.
          </p>
          <div className="rounded-2xl bg-white/[0.04] p-4 text-sm leading-6 text-white/58">
            Approval is required before organizer dashboard access. This helps keep events verified and ticket buyers protected.
          </div>
        </div>
        <OrganizerApplicationForm />
      </div>
    </section>
  );
}
