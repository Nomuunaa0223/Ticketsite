"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "login" | "signup" | "organizer";

export function AuthTabsCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [organizerError, setOrganizerError] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotDone, setForgotDone] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [signupPending, setSignupPending] = useState(false);
  const [organizerPending, setOrganizerPending] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);

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

    const payload = (await response.json()) as { error?: string; role?: string };

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

    if (payload.role === "ADMIN") {
      window.location.assign("/dashboard/admin");
    } else if (payload.role === "ORGANIZER") {
      window.location.assign("/organizer/dashboard");
    } else {
      window.location.assign("/events");
    }
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

  async function handleForgotSubmit(formData: FormData) {
    setForgotPending(true);
    setForgotError(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    });

    const payload = (await res.json()) as { error?: string };
    setForgotPending(false);

    if (!res.ok) {
      setForgotError(payload.error ?? "Алдаа гарлаа.");
      return;
    }

    setForgotDone(true);
  }

  async function handleOrganizerSubmit(formData: FormData) {
    setOrganizerPending(true);
    setOrganizerError(null);

    const response = await fetch("/api/auth/organizer-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        registrationCode: formData.get("registrationCode"),
        oneTimePassword: formData.get("oneTimePassword"),
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setOrganizerError(payload.error ?? "Нэвтрэх үед алдаа гарлаа.");
      setOrganizerPending(false);
      return;
    }

    window.location.assign("/dashboard/organizer");
  }

  return (
    <div className="login-card">
      <div className="login-card__header">
        <a href="/" className="login-card__brand mb-5 block">TIXORA</a>
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

      {activeTab === "organizer" ? (
        <form action={handleOrganizerSubmit} className="login-card__form">
          <label className="login-card__field">
            <span>Имэйл хаяг</span>
            <div className="login-card__input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="login-card__input-icon">
                <path d="M4 6.75h16a1.25 1.25 0 0 1 1.25 1.25v8A1.25 1.25 0 0 1 20 17.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="m4 8 8 5 8-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
              <input name="email" type="email" placeholder="company@email.com" required />
            </div>
          </label>

          <label className="login-card__field">
            <span>Байгуулаллын бүртгэлийн код</span>
            <div className="login-card__input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="login-card__input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
              </svg>
              <input name="registrationCode" type="text" inputMode="numeric" maxLength={6} placeholder="6 оронтой код" required />
            </div>
          </label>

          <label className="login-card__field">
            <span>Нэг удаагийн нууц үг</span>
            <div className="login-card__input-shell">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="login-card__input-icon">
                <path d="M8.5 10V7.75a3.5 3.5 0 1 1 7 0V10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                <rect x="5.75" y="10" width="12.5" height="9.25" rx="1.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input name="oneTimePassword" type="password" placeholder="6 оронтой нууц үг" required />
            </div>
          </label>

          {organizerError ? <p className="login-card__error">{organizerError}</p> : null}

          <button type="submit" disabled={organizerPending} className="login-card__submit">
            {organizerPending ? "НЭВТЭРЧ БАЙНА..." : "НЭВТРЭХ"}
          </button>

          <p className="login-card__footer-copy">
            Company ?{" "}
            <a href="/apply" className="login-card__inline-link">Хүсэлт илгээх</a>
          </p>
        </form>
      ) : activeTab === "login" ? (
        showForgot ? (
          <form action={handleForgotSubmit} className="login-card__form">
            {forgotDone ? (
              <>
                <p className="text-sm text-emerald-400">
                  Хэрэв имэйл бүртгэлтэй бол нууц үг шинэчлэх холбоос илгээгдлээ.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotDone(false); }}
                  className="login-card__submit mt-4"
                >
                  БУЦАХ
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-white/50">
                  Бүртгэлтэй имэйл хаягаа оруулна уу. Нууц үг шинэчлэх холбоос илгээнэ.
                </p>
                <label className="login-card__field">
                  <span>Имэйл хаяг</span>
                  <div className="login-card__input-shell">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="login-card__input-icon">
                      <path d="M4 6.75h16a1.25 1.25 0 0 1 1.25 1.25v8A1.25 1.25 0 0 1 20 17.25H4A1.25 1.25 0 0 1 2.75 16V8A1.25 1.25 0 0 1 4 6.75Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m4 8 8 5 8-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                    <input name="email" type="email" placeholder="name@domain.com" required />
                  </div>
                </label>
                {forgotError ? <p className="login-card__error">{forgotError}</p> : null}
                <button type="submit" disabled={forgotPending} className="login-card__submit">
                  {forgotPending ? "ИЛГЭЭЖ БАЙНА..." : "ХОЛБООС ИЛГЭЭХ"}
                </button>
                <p className="login-card__footer-copy">
                  <button type="button" onClick={() => setShowForgot(false)} className="login-card__inline-link">
                    ← Буцах
                  </button>
                </p>
              </>
            )}
          </form>
        ) : (
        <form action={handleLoginSubmit} className="login-card__form">
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
              <button type="button" onClick={() => setShowForgot(true)} className="login-card__help-link">
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
            Company?{" "}
            <button type="button" onClick={() => setActiveTab("organizer")} className="login-card__inline-link">
              Company sign in
            </button>
          </p>
        </form>
        )
      ) : (
        <form action={handleSignupSubmit} className="login-card__form">
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
              <input name="password" type="password" placeholder="At least 10 characters" required minLength={10} />
            </div>
          </label>

          {signupError ? <p className="login-card__error">{signupError}</p> : null}

          <button type="submit" disabled={signupPending} className="login-card__submit">
            {signupPending ? "CREATING..." : "CREATE ACCOUNT"}
          </button>

        </form>
      )}
    </div>
  );
}
