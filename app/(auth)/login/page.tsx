import { Suspense } from "react";
import { AuthTabsCard } from "@/components/forms/auth-tabs-card";

export default function LoginPage() {
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
