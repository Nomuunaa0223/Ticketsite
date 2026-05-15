"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const rampTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigating = useRef(false);

  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return;
      if (a.target === "_blank") return;

      navigating.current = true;
      setWidth(0);
      setVisible(true);
      if (rampTimer.current) clearTimeout(rampTimer.current);
      rampTimer.current = setTimeout(() => setWidth(72), 60);
    }

    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, []);

  useEffect(() => {
    if (!navigating.current) return;
    navigating.current = false;
    if (rampTimer.current) clearTimeout(rampTimer.current);
    setWidth(100);
    doneTimer.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 380);
    return () => { if (doneTimer.current) clearTimeout(doneTimer.current); };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[2px]"
      style={{
        width: `${width}%`,
        background: "linear-gradient(90deg, #ff7224, #ff9c52)",
        boxShadow: "0 0 10px rgba(255,114,36,0.7)",
        transition: width === 100
          ? "width 0.18s ease"
          : width === 0
          ? "none"
          : "width 1s cubic-bezier(0.1,0.5,0.3,1)",
      }}
    />
  );
}
