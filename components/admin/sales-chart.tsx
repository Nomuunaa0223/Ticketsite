"use client";

import { useState } from "react";

type TrendPoint = {
  label: string;
  value: number;
  x: number;
  y: number;
};

type Props = {
  dailyPoints: TrendPoint[];
  monthlyPoints: TrendPoint[];
};

function buildLinePath(points: TrendPoint[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

function buildAreaPath(points: TrendPoint[]): string {
  if (!points.length) return "";
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${buildLinePath(points)} L ${last.x} 220 L ${first.x} 220 Z`;
}

export function SalesChart({ dailyPoints, monthlyPoints }: Props) {
  const [view, setView] = useState<"daily" | "monthly">("daily");

  const points = view === "daily" ? dailyPoints : monthlyPoints;
  const maxVal = Math.max(...points.map((p) => p.value), 1);

  const formatVal = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
  };

  return (
    <div className="mt-6 rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.04em] text-white">
            Revenue
          </h2>
          <p className="mt-1 text-sm text-white/42">
            {view === "daily" ? "Last 9 days" : "Last 12 months"}
          </p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setView("daily")}
            className={`px-4 py-2 text-xs font-bold transition-colors ${
              view === "daily"
                ? "bg-[#ff7224] text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setView("monthly")}
            className={`px-4 py-2 text-xs font-bold transition-colors ${
              view === "monthly"
                ? "bg-[#ff7224] text-white"
                : "text-white/40 hover:text-white"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox="0 0 820 240"
          className="w-full min-w-[500px]"
          preserveAspectRatio="none"
          aria-label="Revenue chart"
        >
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7224" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff7224" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 50, 100, 150, 200].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="820"
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {points.length > 1 && (
            <>
              <path
                d={buildAreaPath(points)}
                fill="url(#area-grad)"
              />
              <path
                d={buildLinePath(points)}
                fill="none"
                stroke="#ff7224"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Data points */}
          {points.map((p) => (
            <g key={`${p.label}-${p.x}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#ff7224" />
              <text
                x={p.x}
                y={230}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.3)"
              >
                {p.label}
              </text>
              {p.value > 0 && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.6)"
                >
                  {formatVal(p.value)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
