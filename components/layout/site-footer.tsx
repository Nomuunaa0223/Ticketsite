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
        <div className="footer-hero__backdrop" aria-hidden="true">
          <span className="footer-hero__brand-base">TIXORA</span>
          <span className="footer-hero__brand-glow">TIXORA</span>
        </div>

        <div className="footer-hero__content">
          <div className="footer-hero__copy">
            <p className="footer-hero__eyebrow">TIXORA</p>
          </div>

          <nav className="footer-hero__nav" aria-label="Footer categories">
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

          <div className="footer-hero__actions">
            <Link href="/contact" className="footer-hero__contact-link">
              contact us
            </Link>
          </div>
        </div>

        <div className="footer-hero__meta">
          <p>© 2026 Tixora. All rights reserved.</p>
          <p>Fair ticketing for events, venues, and verified resale.</p>
        </div>
      </div>
    </footer>
  );
}
