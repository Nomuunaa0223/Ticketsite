"use client";

import Link from "next/link";
import { gsap } from "gsap";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";

const MOBILE_BREAKPOINT = 768;

type CategoryIconKind =
  | "sports"
  | "music"
  | "theatre"
  | "comedy"
  | "festival"
  | "conference";

type CategoryMagicBentoItem = {
  label: string;
  slug: string;
  icon: CategoryIconKind;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CategoryMagicBento({
  items,
  glowColor = "255, 138, 44"
}: {
  items: readonly CategoryMagicBentoItem[];
  glowColor?: string;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!gridRef.current || !spotlightRef.current || isMobile) return;

    const grid = gridRef.current;
    const spotlight = spotlightRef.current;

    const updateSpotlight = (event: MouseEvent) => {
      const gridRect = grid.getBoundingClientRect();
      const inside =
        event.clientX >= gridRect.left &&
        event.clientX <= gridRect.right &&
        event.clientY >= gridRect.top &&
        event.clientY <= gridRect.bottom;

      if (!inside) {
        gsap.to(spotlight, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.out"
        });

        cardRefs.current.forEach((card) => {
          if (!card) return;
          card.style.setProperty("--mb-glow-intensity", "0");
        });

        return;
      }

      const relativeX = event.clientX - gridRect.left;
      const relativeY = event.clientY - gridRect.top;

      gsap.to(spotlight, {
        x: relativeX,
        y: relativeY,
        opacity: 1,
        duration: 0.22,
        ease: "power2.out"
      });

      cardRefs.current.forEach((card) => {
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
        const intensity = clamp(1 - distance / 260, 0, 1);
        const cardX = ((event.clientX - rect.left) / rect.width) * 100;
        const cardY = ((event.clientY - rect.top) / rect.height) * 100;

        card.style.setProperty("--mb-glow-x", `${cardX}%`);
        card.style.setProperty("--mb-glow-y", `${cardY}%`);
        card.style.setProperty("--mb-glow-intensity", intensity.toFixed(3));
      });
    };

    const handleLeave = () => {
      gsap.to(spotlight, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      });

      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.style.setProperty("--mb-glow-intensity", "0");
      });
    };

    document.addEventListener("mousemove", updateSpotlight);
    grid.addEventListener("mouseleave", handleLeave);

    return () => {
      document.removeEventListener("mousemove", updateSpotlight);
      grid.removeEventListener("mouseleave", handleLeave);
    };
  }, [isMobile]);

  const handleCardMove = (event: ReactMouseEvent<HTMLAnchorElement>, index: number) => {
    if (isMobile) return;

    const card = cardRefs.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const moveX = (x - centerX) * 0.04;
    const moveY = (y - centerY) * 0.04;

    card.style.setProperty("--mb-glow-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--mb-glow-y", `${(y / rect.height) * 100}%`);

    gsap.to(card, {
      x: moveX,
      y: moveY,
      duration: 0.28,
      ease: "power2.out"
    });
  };

  const handleCardLeave = (index: number) => {
    const card = cardRefs.current[index];
    if (!card) return;

    gsap.to(card, {
      x: 0,
      y: 0,
      duration: 0.35,
      ease: "power2.out"
    });
  };

  const handleCardClick = (event: ReactMouseEvent<HTMLAnchorElement>, index: number) => {
    if (isMobile) return;

    const card = cardRefs.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.2;
    const ripple = document.createElement("div");

    ripple.className = "magic-bento-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    ripple.style.background = `radial-gradient(circle, rgba(${glowColor}, 0.38) 0%, rgba(255, 204, 102, 0.18) 35%, transparent 72%)`;

    card.appendChild(ripple);

    gsap.fromTo(
      ripple,
      {
        scale: 0,
        opacity: 1
      },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => ripple.remove()
      }
    );
  };

  return (
    <div
      ref={gridRef}
      className="magic-bento-grid"
      style={{ "--mb-glow-color": glowColor } as CSSProperties}
    >
      <div ref={spotlightRef} className="magic-bento-spotlight" />

      {items.map((item, index) => (
        <Link
          key={item.slug}
          href={`/events#${item.slug}`}
          ref={(node) => {
            cardRefs.current[index] = node;
          }}
          className="magic-bento-card"
          onMouseMove={(event) => handleCardMove(event, index)}
          onMouseLeave={() => handleCardLeave(index)}
          onClick={(event) => handleCardClick(event, index)}
        >
          <div className="magic-bento-card__header">
            <div className="magic-bento-card__icon">{renderCategoryIcon(item.icon)}</div>
          </div>

          <div className="magic-bento-card__content">
            <h3 className="magic-bento-card__title">{item.label}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

function renderCategoryIcon(kind: CategoryIconKind) {
  if (kind === "sports") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="7" />
        <path d="m9 9 2 1 2-1 2 2-.5 2.5L12 15l-2.5-1.5L9 11Z" />
      </svg>
    );
  }

  if (kind === "music") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 4v10.5a2.5 2.5 0 1 1-2-2.45V6l8-2v8.5a2.5 2.5 0 1 1-2-2.45V4Z" />
      </svg>
    );
  }

  if (kind === "theatre") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2v9c0 3-2 5-4 5-1.6 0-2.4-1-3-2-1 1-1.8 2-3 2s-2-1-3-2c-.6 1-1.4 2-3 2-2 0-4-2-4-5Z" />
        <path d="M9 11c.5.7 1.3 1 2 1s1.5-.3 2-1" />
        <path d="M8.5 9h.01" />
        <path d="M15.5 9h.01" />
      </svg>
    );
  }

  if (kind === "comedy") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 7h5v5H5z" />
        <path d="M14 7h5v5h-5z" />
        <path d="M7 16c1.2 1.3 2.8 2 5 2s3.8-.7 5-2" />
      </svg>
    );
  }

  if (kind === "festival") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10h18" />
        <path d="M5 10V7l7-3 7 3v3" />
        <path d="M6 10v8" />
        <path d="M10 10v8" />
        <path d="M14 10v8" />
        <path d="M18 10v8" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 16v-1a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1" />
      <path d="M8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M13 16v-1a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1" />
      <path d="M16.5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}
