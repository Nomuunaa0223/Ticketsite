import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { AuthTabsCard } from "@/components/forms/auth-tabs-card";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const nextPath = params?.next;

  if (user) {
    if (isSafeInternalPath(nextPath)) {
      redirect(nextPath as Route);
    }

    if (user.role === "ADMIN") {
      redirect("/dashboard/admin");
    }

    if (user.role === "ORGANIZER") {
      redirect("/organizer/dashboard");
    }

    redirect("/events");
  }

  return (
    <section className="login-page">
      <div className="login-page__lights" aria-hidden="true">
        <span className="login-page__light login-page__light--left" />
        <span className="login-page__light login-page__light--right" />
      </div>
      <div className="login-page__stage" aria-hidden="true" />
      <div className="login-page__shell">
        <Suspense
          fallback={<div className="mx-auto w-full max-w-md text-center text-white">Loading...</div>}
        >
          <AuthTabsCard />
        </Suspense>
      </div>
    </section>
  );
}

function isSafeInternalPath(path: string | undefined): path is `/${string}` {
  return Boolean(path?.startsWith("/") && !path.startsWith("//"));
}
