"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to sign in.");
      setPending(false);
      return;
    }

    const nextPath = searchParams.get("next");

    if (nextPath && nextPath.startsWith("/")) {
      window.location.assign(nextPath);
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
      <Input name="email" label="Email" type="email" placeholder="you@company.com" required />
      <Input
        name="password"
        label="Password"
        type="password"
        placeholder="Minimum 8 characters"
        required
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
