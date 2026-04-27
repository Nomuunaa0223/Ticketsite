import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-black/45">404</p>
      <h1 className="mt-4 font-serif text-5xl text-accent">This page stepped off the guest list</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-black/65">
        The resource you are looking for is not here, or you do not have access to it with the
        current account.
      </p>
      <div className="mt-8 flex gap-3">
        <Button href="/">Home</Button>
        <Button href="/events" variant="secondary">
          Browse events
        </Button>
      </div>
    </section>
  );
}
