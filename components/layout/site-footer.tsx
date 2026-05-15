"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { PartnershipForm } from "@/components/home/partnership-form";
import { useLang } from "@/components/layout/lang-context";

const categorySlugKeys = [
  { key: "catSports" as const, slug: "sports" },
  { key: "catMusic" as const, slug: "music" },
  { key: "catTheater" as const, slug: "theater-arts" },
  { key: "catComedy" as const, slug: "comedy" },
  { key: "catFestival" as const, slug: "festival" },
  { key: "catConference" as const, slug: "conference" },
];

const companyLinks = [
  { key: "footerBrowse" as const, href: "/events" },
  { key: "footerOrganizers" as const, href: "/apply" },
  { key: "footerContact" as const, href: "/partner" },
];

const trustIcons = ["qr", "shield", "checkout", "updates"] as const;
const trustKeys = ["footerTrustQr", "footerTrustShield", "footerTrustCheckout", "footerTrustUpdates"] as const;

export function SiteFooter({ isLoggedIn }: { isLoggedIn?: boolean } = {}) {
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50, active: false });
  const { t } = useLang();

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
          "--footer-glow-opacity": glowPosition.active ? 1 : 0,
        } as CSSProperties
      }
    >
      <div className="footer-hero__inner">
        <div className="footer-hero__stage-lights" aria-hidden="true" />

        {!isLoggedIn && (
          <section className="footer-cta" aria-labelledby="footer-cta-title">
            <div className="footer-cta__particles" aria-hidden="true" />

            <div className="footer-cta__copy">
              <h2 id="footer-cta-title" className="footer-cta__title">
                {t("footerCta")}
              </h2>
              <p className="footer-cta__description">{t("footerCtaDesc")}</p>
              <div className="footer-cta__btns">
                <Link href="/login" className="footer-cta__button footer-cta__button--primary">
                  {t("footerJoinNow")}
                </Link>
                <Link href="/events" className="footer-cta__button footer-cta__button--secondary">
                  {t("footerExplore")}
                </Link>
              </div>
            </div>

            <div id="partner" className="footer-cta__subscribe">
              <p className="footer-newsletter__title font-goldman">{t("footerPartnershipTitle")}</p>
              <div className="mt-4">
                <PartnershipForm />
              </div>
            </div>
          </section>
        )}

        <div className="footer-hero__backdrop" aria-hidden="true">
          <span className="footer-hero__brand-base">TIXORA</span>
          <span className="footer-hero__brand-glow">TIXORA</span>
        </div>

        <div className="footer-hero__content">
          <div className="footer-hero__copy">
            <p className="footer-hero__eyebrow">TIXORA</p>
            <p className="footer-hero__headline">{t("footerHeadline")}</p>
            <div className="footer-trust-inline">
              {trustIcons.map((icon, i) => (
                <div key={icon} className="footer-trust-inline__item">
                  <span className="footer-trust-inline__icon">{renderFooterIcon(icon)}</span>
                  <span>{t(trustKeys[i])}</span>
                </div>
              ))}
            </div>
          </div>

          <nav className="footer-hero__nav" aria-label="Footer categories">
            <p className="footer-hero__column-title">{t("footerEvents")}</p>
            {categorySlugKeys.map(({ key, slug }) => (
              <Link
                key={slug}
                href={{ pathname: "/events", query: { category: slug } }}
                className="footer-hero__nav-link"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          <nav className="footer-hero__actions" aria-label="Footer company links">
            <p className="footer-hero__column-title">{t("footerCompany")}</p>
            {companyLinks.map(({ key, href }) => (
              <Link key={href} href={href} className="footer-hero__nav-link">
                {t(key)}
              </Link>
            ))}
          </nav>

          <div className="footer-hero__contact">
            <p className="footer-hero__column-title">Холбоо барих</p>
            <span className="footer-hero__nav-link">Email: tixora@gmail.com</span>
            <span className="footer-hero__nav-link">Phone: 99119911</span>
            <span className="footer-hero__nav-link">Address: Улаанбаатар, Монгол</span>
          </div>
        </div>

        <div className="footer-hero__meta">
          <p>{t("footerRights")}</p>
          <p>{t("footerTagline")}</p>
        </div>
      </div>
    </footer>
  );
}

function renderFooterIcon(kind: (typeof trustIcons)[number]) {
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
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
  );
}
