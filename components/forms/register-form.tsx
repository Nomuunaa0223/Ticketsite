"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RegisterFormProps = {
  initialRole?: "USER" | "ORGANIZER";
  lockRole?: boolean;
};

export function RegisterForm({
  initialRole = "USER",
  lockRole = false
}: RegisterFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<"USER" | "ORGANIZER">(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        role,
        companyName: formData.get("companyName"),
        websiteUrl: formData.get("websiteUrl")
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to create account.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 rounded-[2rem] border border-black/10 bg-white p-6 shadow-panel"
    >
      <Input name="fullName" label="Full name" placeholder="Ariunbold Erdene" required />
      <Input name="email" label="Email" type="email" placeholder="you@company.com" required />
      <Input
        name="password"
        label="Password"
        type="password"
        placeholder="Use at least 10 characters"
        required
      />
      {lockRole ? <input type="hidden" name="role" value={role} /> : null}
      {!lockRole ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-black/80">Account type</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRole("USER")}
              className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                role === "USER" ? "border-ink bg-sand" : "border-black/10 bg-white"
              }`}
            >
              Fan account
            </button>
            <button
              type="button"
              onClick={() => setRole("ORGANIZER")}
              className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                role === "ORGANIZER" ? "border-ink bg-sand" : "border-black/10 bg-white"
              }`}
            >
              Organizer account
            </button>
          </div>
        </div>
      ) : null}
      {role === "ORGANIZER" ? (
        <>
          <Input name="companyName" label="Company name" placeholder="Atlas Events" required />
          <Input
            name="websiteUrl"
            label="Website"
            type="url"
            placeholder="https://example.com"
          />
        </>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full">
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
