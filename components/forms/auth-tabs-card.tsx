"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "login" | "signup";

export function AuthTabsCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [signupPending, setSignupPending] = useState(false);

  async function handleLoginSubmit(formData: FormData) {
    setLoginPending(true);
    setLoginError(null);

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
      setLoginError(payload.error ?? "Unable to sign in.");
      setLoginPending(false);
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

  async function handleSignupSubmit(formData: FormData) {
    setSignupPending(true);
    setSignupError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: "USER"
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setSignupError(payload.error ?? "Unable to create account.");
      setSignupPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="login-card">
      <div className="login-card__header">
        <p className="login-card__brand">TIXORA</p>
        <div className="login-card__tabs" role="tablist" aria-label="Authentication tabs">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`login-card__tab ${activeTab === "login" ? "login-card__tab--active" : ""}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`login-card__tab ${activeTab === "signup" ? "login-card__tab--active" : ""}`}
          >
            Create Account
          </button>
        </div>
      </div>

      {activeTab === "login" ? (
        <form action={handleLoginSubmit} className="login-card__form">
          <p className="login-card__intro">
            Attending an event? Sign in to your personal account here.
          </p>
          <label className="login-card__field">
            <span>Email Address</span>
            <div className="login-card__input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="login-card__input-icon">
                <path
                  d="M4 6.75h16a1.25 1.25 0 0 1 1.25 1.25v8A1.25 1.25 0 0 1 20 17.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m4 8 8 5 8-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              <input name="email" type="email" placeholder="name@domain.com" required />
            </div>
          </label>

          <label className="login-card__field">
            <span className="login-card__field-row">
              <span>Password</span>
              <button type="button" className="login-card__help-link">
                Forgot Password?
              </button>
            </span>
            <div className="login-card__input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="login-card__input-icon">
                <path
                  d="M8.5 10V7.75a3.5 3.5 0 1 1 7 0V10"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                <rect
                  x="5.75"
                  y="10"
                  width="12.5"
                  height="9.25"
                  rx="1.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <input name="password" type="password" placeholder=".........." required />
            </div>
          </label>

          {loginError ? <p className="login-card__error">{loginError}</p> : null}

          <button type="submit" disabled={loginPending} className="login-card__submit">
            {loginPending ? "SIGNING IN..." : "SIGN IN"}
          </button>

          <div className="login-card__divider">OR CONTINUE WITH</div>

          <div className="login-card__socials">
            <button type="button" className="login-card__social">
              <span className="login-card__social-badge">G</span>
              Google
            </button>
            <button type="button" className="login-card__social">
              <span className="login-card__social-badge">f</span>
              Facebook
            </button>
          </div>

          <p className="login-card__footer-copy">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => setActiveTab("signup")} className="login-card__inline-link">
              Register Now
            </button>
          </p>

          <p className="login-card__footer-copy">
            Want to host an event?{" "}
            <Link href="/organizer/signup" className="login-card__inline-link">
              Organizer signup
            </Link>
          </p>
        </form>
      ) : (
        <form action={handleSignupSubmit} className="login-card__form">
          <p className="login-card__intro">
            Attending an event? Create your personal account here.
          </p>
          <label className="login-card__field">
            <span>Full Name</span>
            <div className="login-card__input-shell">
              <input name="fullName" type="text" placeholder="Your full name" required />
            </div>
          </label>

          <label className="login-card__field">
            <span>Email Address</span>
            <div className="login-card__input-shell">
              <input name="email" type="email" placeholder="name@domain.com" required />
            </div>
          </label>

          <label className="login-card__field">
            <span>Password</span>
            <div className="login-card__input-shell">
              <input name="password" type="password" placeholder="Create password" required />
            </div>
          </label>

          {signupError ? <p className="login-card__error">{signupError}</p> : null}

          <button type="submit" disabled={signupPending} className="login-card__submit">
            {signupPending ? "CREATING..." : "CREATE ACCOUNT"}
          </button>

          <p className="login-card__footer-copy">
            Want to host an event?{" "}
            <Link href="/organizer/signup" className="login-card__inline-link">
              Organizer signup
            </Link>
          </p>
        </form>
      )}

      <div className="login-card__legal">
        <button type="button">Privacy Policy</button>
        <button type="button">Terms of Service</button>
        <button type="button">Support</button>
      </div>
    </div>
  );
}
