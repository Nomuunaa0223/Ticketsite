import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";

export default function OrganizerSignupPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Organizer signup</p>
          <h1 className="font-serif text-5xl text-accent">Launch and manage events with Tixora</h1>
          <p className="text-lg leading-8 text-black/65">
            Create an organizer account to publish events, manage ticketing, and move through
            review with a dedicated organizer profile.
          </p>
          <p className="text-sm leading-7 text-black/55">
            Attending an event?{" "}
            <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
              Create your personal account here
            </Link>
            .
          </p>
        </div>
        <RegisterForm initialRole="ORGANIZER" lockRole />
      </div>
    </section>
  );
}
