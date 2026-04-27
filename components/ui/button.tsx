import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: Route;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
};

const variants = {
  primary:
    "border border-[#ff9a6a] bg-[#ff6d1f] text-white shadow-[0_12px_32px_rgba(255,109,31,0.24)] hover:bg-[#ff7c36]",
  secondary:
    "border border-[rgba(255,109,31,0.28)] bg-[rgba(255,109,31,0.08)] text-[#ffd9c6] hover:bg-[rgba(255,109,31,0.14)]",
  ghost:
    "border border-transparent bg-transparent text-white/82 hover:border-[rgba(255,109,31,0.26)] hover:bg-[rgba(255,109,31,0.08)]"
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button"
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 ${variants[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes}>
      {children}
    </button>
  );
}
