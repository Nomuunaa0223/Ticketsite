"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function HeroParallaxImage() {
  const frameRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      return;
    }

    const move = () => {
      const frame = frameRef.current;

      if (!frame) return;

      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;

      frame.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      animationRef.current = window.requestAnimationFrame(move);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const offsetX = (event.clientX / window.innerWidth - 0.5) * -14;
      const offsetY = (event.clientY / window.innerHeight - 0.5) * -10;

      targetRef.current = { x: offsetX, y: offsetY };
    };

    const handlePointerLeave = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    animationRef.current = window.requestAnimationFrame(move);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);

      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div ref={frameRef} className="home-enter__image-frame absolute -inset-4">
      <Image
        src="/home-hero-final.png"
        alt="Concert crowd with bright orange stage lights"
        fill
        priority
        quality={100}
        sizes="100vw"
        className="home-enter__image object-cover object-[center_35%] sm:object-center"
        style={{ filter: "brightness(0.62) saturate(0.8)" }}
      />
    </div>
  );
}
