"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type TrendingParallaxGalleryItem = {
  title: string;
  subtitle: string;
  href: Route;
  venue: string;
  city: string;
  dateLabel: string;
  dateDay: string;
  dateMonth: string;
  priceLabel: string;
  metaLabel: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition?: string;
};

const xOffsets = [-8, -3, 0, 4, 8] as const;
const maxXOffsets = [20, 18, 25, 20, 16] as const;
const galleryAspectRatio = 1280 / 426;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

function damp(current: number, target: number, smoothing: number, deltaTime: number): number {
  const factor = 1 - Math.exp(-smoothing * deltaTime);
  return lerp(current, target, factor);
}

type MotionValues = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  clip: number;
  imageScale: number;
  imageY: number;
  captionOpacity: number;
  captionY: number;
};

const createInitialMotionValues = (): MotionValues => ({
  x: 0,
  y: 44,
  scale: 0.9,
  opacity: 0.35,
  clip: 0,
  imageScale: 1.02,
  imageY: 0,
  captionOpacity: 0,
  captionY: 18
});

export function TrendingParallaxGallery({
  items
}: {
  items: TrendingParallaxGalleryItem[];
}) {
  const galleryItems = items.slice(0, 5);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);
  const captionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const targetValuesRef = useRef<MotionValues[]>(
    galleryItems.map(() => createInitialMotionValues())
  );
  const currentValuesRef = useRef<MotionValues[]>(
    galleryItems.map(() => createInitialMotionValues())
  );

  useEffect(() => {
    targetValuesRef.current = galleryItems.map(() => createInitialMotionValues());
    currentValuesRef.current = galleryItems.map(() => createInitialMotionValues());
  }, [galleryItems.length]);

  useEffect(() => {
    let frameId = 0;
    let lastFrameTime = 0;
    let running = false;
    let pendingMeasure = true;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measureTargets = () => {
      const viewportHeight = window.innerHeight;
      const trackWidth =
        trackRef.current?.getBoundingClientRect().width ??
        Math.min(window.innerWidth * 0.82, 1000);
      const reducedMotion = reducedMotionQuery.matches;

      itemRefs.current.forEach((itemRef, index) => {
        if (!itemRef) return;

        const rect = itemRef.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const focusProgress = clamp(
          1 - Math.abs(centerY - viewportHeight * 0.54) / (viewportHeight * 0.5),
          0,
          1
        );
        const reveal = reducedMotion ? 1 : easeOutCubic(focusProgress);
        const parallaxProgress = clamp(
          (viewportHeight - rect.top) / (viewportHeight + rect.height),
          0,
          1
        );
        const offsetPercent = xOffsets[index] ?? 0;
        const baseX = (trackWidth * offsetPercent) / 100;

        targetValuesRef.current[index] = {
          x: reducedMotion ? 0 : mix(baseX, 0, reveal),
          y: reducedMotion ? 0 : mix(10, -6, reveal) + mix(-4, 4, parallaxProgress),
          scale: reducedMotion ? 1 : mix(0.94, 1.04, reveal),
          opacity: reducedMotion ? 1 : mix(0.5, 0.96, reveal),
          clip: 0,
          imageScale: reducedMotion ? 1 : mix(1.02, 1, reveal),
          imageY: reducedMotion ? 0 : mix(-4, 4, parallaxProgress),
          captionOpacity: reducedMotion ? 1 : clamp((reveal - 0.45) / 0.55, 0, 1),
          captionY: reducedMotion ? 0 : mix(18, 0, reveal)
        };
      });
    };

    const renderFrame = (timestamp: number) => {
      if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
      }

      const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
      lastFrameTime = timestamp;

      if (pendingMeasure) {
        measureTargets();
        pendingMeasure = false;
      }

      let shouldKeepRunning = false;

      itemRefs.current.forEach((itemRef, index) => {
        const imageRef = imageRefs.current[index];
        const captionRef = captionRefs.current[index];
        const target = targetValuesRef.current[index];
        const current = currentValuesRef.current[index];

        if (!itemRef || !imageRef || !captionRef || !target || !current) return;

        current.x = damp(current.x, target.x, 9, deltaTime);
        current.y = damp(current.y, target.y, 9, deltaTime);
        current.scale = damp(current.scale, target.scale, 10, deltaTime);
        current.opacity = damp(current.opacity, target.opacity, 10, deltaTime);
        current.clip = damp(current.clip, target.clip, 11, deltaTime);
        current.imageScale = damp(current.imageScale, target.imageScale, 8, deltaTime);
        current.imageY = damp(current.imageY, target.imageY, 8, deltaTime);
        current.captionOpacity = damp(current.captionOpacity, target.captionOpacity, 11, deltaTime);
        current.captionY = damp(current.captionY, target.captionY, 11, deltaTime);

        itemRef.style.transform = `translate(${current.x}px, ${current.y}px) scale(${current.scale})`;
        itemRef.style.opacity = `${current.opacity}`;
        itemRef.style.clipPath = "inset(0%)";
        itemRef.style.zIndex = `${Math.round(current.opacity * 100) + index}`;
        imageRef.style.transform = `translate3d(0, ${current.imageY}px, 0) scale(${current.imageScale})`;
        captionRef.style.opacity = `${current.captionOpacity}`;
        captionRef.style.transform = `translate3d(0, ${current.captionY}px, 0)`;

        if (
          Math.abs(current.x - target.x) > 0.1 ||
          Math.abs(current.y - target.y) > 0.1 ||
          Math.abs(current.scale - target.scale) > 0.001 ||
          Math.abs(current.opacity - target.opacity) > 0.001 ||
          Math.abs(current.clip - target.clip) > 0.05 ||
          Math.abs(current.imageScale - target.imageScale) > 0.001 ||
          Math.abs(current.imageY - target.imageY) > 0.1 ||
          Math.abs(current.captionOpacity - target.captionOpacity) > 0.001 ||
          Math.abs(current.captionY - target.captionY) > 0.1
        ) {
          shouldKeepRunning = true;
        }
      });

      if (shouldKeepRunning) {
        frameId = window.requestAnimationFrame(renderFrame);
      } else {
        running = false;
        frameId = 0;
        lastFrameTime = 0;
      }
    };

    const queueUpdate = () => {
      pendingMeasure = true;
      if (!running) {
        running = true;
        lastFrameTime = 0;
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    queueUpdate();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    reducedMotionQuery.addEventListener("change", queueUpdate);

    return () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      reducedMotionQuery.removeEventListener("change", queueUpdate);
    };
  }, [galleryItems.length]);

  return (
    <div
      ref={trackRef}
      className="gallery-track relative mx-auto flex max-w-[1120px] flex-col items-center px-2 pb-12 pt-14 lg:max-w-[1380px] lg:pt-16"
    >
      {galleryItems.map((item, index) => {
        const overlapClassName = index === 0 ? "" : "mt-3 sm:mt-4 lg:mt-5";

        return (
          <Link
            key={`${item.title}-${index}`}
            href={item.href}
            aria-label={item.title}
            data-max-x={maxXOffsets[index] ?? 18}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className={`gallery-item group relative w-[96%] overflow-hidden will-change-[transform,opacity] max-md:!w-full max-md:!max-w-[460px] ${overlapClassName}`}
            style={{
              aspectRatio: `${galleryAspectRatio}`,
              clipPath: "inset(0%)",
              opacity: 0.4
            }}
          >
            <div className="gallery-image-zoom absolute inset-0 overflow-hidden bg-transparent">
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                quality={100}
                sizes="(max-width: 768px) 320px, (max-width: 1280px) 82vw, 968px"
                className="absolute inset-0 h-full w-full object-cover origin-center will-change-transform"
                style={{ objectPosition: item.objectPosition ?? "center" }}
                ref={(node) => {
                  imageRefs.current[index] = node;
                }}
              />
            </div>

            {/* static overlay — always visible */}
            <div className="pointer-events-none absolute inset-0">
              {/* bottom gradient for title readability */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(4,5,10,0.88)_0%,rgba(4,5,10,0.4)_55%,transparent_100%)]" />

              {/* date chip — top right */}
              <div className="absolute right-4 top-4 sm:right-6 sm:top-5">
                <DateChip day={item.dateDay} month={item.dateMonth} />
              </div>

              {/* event title — bottom left */}
              <div className="absolute bottom-0 left-0 right-16 px-5 pb-4 sm:px-7 sm:pb-5">
                <p className="font-goldman truncate text-base font-bold leading-tight text-white drop-shadow sm:text-xl lg:text-2xl">
                  {item.title}
                </p>
              </div>
            </div>

            {/* captionRef — kept for parallax animation system */}
            <div
              ref={(node) => { captionRefs.current[index] = node; }}
              style={{ opacity: 0 }}
            />
          </Link>
        );
      })}
    </div>
  );
}

function DateChip({ day, month }: { day: string; month: string }) {
  if (!day || !month) return null;
  return (
    <div className="flex min-w-[58px] flex-col items-center rounded-2xl px-3.5 py-2.5 text-center shadow-[0_4px_24px_rgba(0,0,0,0.5)]" style={{ background: "#ffffff" }}>
      <span className="font-goldman text-[1.9rem] font-semibold leading-none tracking-tight text-[#0d0f14] sm:text-[2.1rem]">{day}</span>
      <span className=" mt-1 text-[0.82rem] font-semibold uppercase tracking-[0.13em] text-black">{month} сар</span>
    </div>
  );
}
