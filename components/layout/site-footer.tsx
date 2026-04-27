"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";

const footerCategories = [
  { label: "Sports", slug: "sports" },
  { label: "Music", slug: "music" },
  { label: "Theater & Arts", slug: "theater-arts" },
  { label: "Comedy", slug: "comedy" },
  { label: "Festival", slug: "festival" },
  { label: "Conference", slug: "conference" }
] as const;

const footerCompany = [
  { label: "Browse Events", href: "/events" },
  { label: "For Organizers", href: "/dashboard/organizer" },
  { label: "Contact Sales", href: "/contact" }
] as const;

const trustItems = [
  { label: "QR Verified Tickets", icon: "qr" },
  { label: "Secure Resale", icon: "shield" },
  { label: "Fast Checkout", icon: "checkout" },
  { label: "Real-time Updates", icon: "updates" }
] as const;

const ctaTitle =
  "Дараагийн мартагдашгүй event-ээ Tixora-с эхлүүл.";
const ctaDescription =
  "Шилдэг арга хэмжээ, баталгаатай тасалбар, хурдан захиалга — бүгд нэг дор.";
const newsletterTitle = "Event update авах";
const newsletterPlaceholder =
  "Имэйлээ оруулна уу";
const newsletterNote = "No spam. Зөвхөн event update.";

export function SiteFooter() {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50, active: false });

  return (
    <footer
      className="footer-hero"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setGlowPosition({ x, y, active: true });
      }}
      onMouseLeave={() => {
        setGlowPosition((current) => ({ ...current, active: false }));
      }}
      style={
        {
          "--footer-glow-x": `${glowPosition.x}%`,
          "--footer-glow-y": `${glowPosition.y}%`,
          "--footer-glow-opacity": glowPosition.active ? 1 : 0
        } as CSSProperties
      }
    >
      <div className="footer-hero__inner">
        <div className="footer-hero__stage-lights" aria-hidden="true" />

        <section className="footer-cta" aria-labelledby="footer-cta-title">
          <div className="footer-cta__particles" aria-hidden="true" />

          <div className="footer-cta__copy">
            <p className="footer-cta__eyebrow">Your next night starts here</p>
            <h2 id="footer-cta-title" className="footer-cta__title">
              {ctaTitle}
            </h2>
            <p className="footer-cta__description">{ctaDescription}</p>
            <div className="footer-cta__btns">
              <Link href="/login" className="footer-cta__button footer-cta__button--primary">
                Join Now
              </Link>
              <Link href="/events" className="footer-cta__button footer-cta__button--secondary">
                Explore Events
              </Link>
            </div>
          </div>

          <div className="footer-cta__subscribe">
            <p className="footer-hero__column-title">Newsletter</p>
            <p className="footer-newsletter__title">{newsletterTitle}</p>
            <form
              className="footer-newsletter__form"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <input type="email" placeholder={newsletterPlaceholder} aria-label="Email address" />
              <button type="submit" aria-label="Subscribe to event updates">
                {renderFooterIcon("send")}
              </button>
            </form>
            <p className="footer-newsletter__note">{newsletterNote}</p>
          </div>
        </section>

        <div className="footer-hero__backdrop" aria-hidden="true">
          <span className="footer-hero__brand-base">TIXORA</span>
          <span className="footer-hero__brand-glow">TIXORA</span>
        </div>

        <div className="footer-hero__content">
          <div className="footer-hero__copy">
            <p className="footer-hero__eyebrow">TIXORA</p>
            <p className="footer-hero__headline">
              Premium event ticketing for verified access, trusted resale, and smoother nights out.
            </p>
            <div className="footer-trust-inline">
              {trustItems.map((item) => (
                <div key={item.label} className="footer-trust-inline__item">
                  <span className="footer-trust-inline__icon">{renderFooterIcon(item.icon)}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <nav className="footer-hero__nav" aria-label="Footer categories">
            <p className="footer-hero__column-title">Events</p>
            {footerCategories.map((category) => (
              <Link
                key={category.slug}
                href={{ pathname: "/events", query: { category: category.slug } }}
                className="footer-hero__nav-link"
              >
                {category.label}
              </Link>
            ))}
          </nav>

          <nav className="footer-hero__actions" aria-label="Footer company links">
            <p className="footer-hero__column-title">Company</p>
            {footerCompany.map((item) => (
              <Link key={item.href} href={item.href} className="footer-hero__nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-hero__meta">
          <p>© 2026 Tixora. All rights reserved.</p>
          <p>Fair ticketing for events, venues, and verified resale.</p>
        </div>
      </div>
    </footer>
  );
}

function renderFooterIcon(kind: (typeof trustItems)[number]["icon"] | "send") {
  if (kind === "qr") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h5v5H4z" />
        <path d="M15 4h5v5h-5z" />
        <path d="M4 15h5v5H4z" />
        <path d="M15 15h2" />
        <path d="M19 15h1" />
        <path d="M17 17h3" />
        <path d="M15 19h2" />
      </svg>
    );
  }

  if (kind === "shield") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 5 6v6c0 5 3.4 7.9 7 9 3.6-1.1 7-4 7-9V6l-7-3Z" />
        <path d="m9.5 12 1.8 1.8 3.7-3.8" />
      </svg>
    );
  }

  if (kind === "checkout") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16v10H4z" />
        <path d="M4 10h16" />
        <path d="m8 15 2 2 5-5" />
      </svg>
    );
  }

  if (kind === "updates") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path d="M9 17a3 3 0 0 0 6 0" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
