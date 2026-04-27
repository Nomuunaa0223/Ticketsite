"use client";

import { useEffect } from "react";

type TixoraLoadingScreenProps = {
  className?: string;
};

export function TixoraLoadingScreen({ className = "" }: TixoraLoadingScreenProps) {
  useEffect(() => {
    document.body.classList.add("tixora-route-loading");

    return () => {
      document.body.classList.remove("tixora-route-loading");
    };
  }, []);

  return (
    <div className={`tixora-loading ${className}`} role="status" aria-live="polite" aria-label="Loading">
      <div className="tixora-loading__brand">
        <p>TIXORA</p>
      </div>
    </div>
  );
}
