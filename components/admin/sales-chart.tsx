"use client";

import { useState, useEffect } from "react";

export type BarPoint = { label: string; value: number };
export type WeekComparison = { labels: string[]; current: number[]; previous: number[] };

type Props = { monthlyBars: BarPoint[]; weekComparison: WeekComparison };
type Tip = { x: number; y: number; label: string; value: number; sub?: string } | null;

const CHART_H = 108;
const BOTTOM = 122;
const LABEL_Y = 138;

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}М₮`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}К₮`;
  return `${v}₮`;
}

function fmtShort(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}М`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}К`;
  return v > 0 ? String(v) : "";
}

export function SalesChart({ monthlyBars, weekComparison }: Props) {
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [animated, setAnimated] = useState(false);
  const [tip, setTip] = useState<Tip>(null);

  useEffect(() => {
    setAnimated(false);
    setTip(null);
    const id = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(id);
  }, [view]);

  const tipX = tip ? Math.max(44, Math.min(tip.x, 776)) : 0;

  return (
    <div className="mt-6 rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.04em] text-white sm:text-2xl">Борлуулалт</h2>
          <p className="mt-0.5 text-sm text-white/40">
            {view === "monthly" ? "Сүүлийн 30 хоног" : "Энэ 7 хоног vs өмнөх 7 хоног"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {view === "weekly" && (
            <div className="hidden items-center gap-3 text-[0.68rem] font-semibold text-white/45 sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#ff7224]" />
                Энэ долоо хоног
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-white/25" />
                Өмнөх долоо хоног
              </span>
            </div>
          )}
          <div className="flex overflow-hidden rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setView("monthly")}
              className={`px-4 py-2 text-xs font-bold transition-colors ${view === "monthly" ? "bg-[#ff7224] text-white" : "text-white/40 hover:text-white"}`}
            >
              Сарын
            </button>
            <button
              type="button"
              onClick={() => setView("weekly")}
              className={`px-4 py-2 text-xs font-bold transition-colors ${view === "weekly" ? "bg-[#ff7224] text-white" : "text-white/40 hover:text-white"}`}
            >
              7 хоног
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox="0 0 820 152"
          className="w-full min-w-[420px]"
          style={{ overflow: "visible" }}
          onMouseLeave={() => setTip(null)}
        >
          <defs>
            <linearGradient id="sc-curr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff8b46" />
              <stop offset="100%" stopColor="#e85c00" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="sc-prev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.67, 1].map((t) => (
            <line
              key={t}
              x1="0" y1={BOTTOM - t * CHART_H}
              x2="820" y2={BOTTOM - t * CHART_H}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}

          {view === "monthly" ? (
            <MonthlyBars bars={monthlyBars} animated={animated} onTip={setTip} />
          ) : (
            <WeeklyBars comparison={weekComparison} animated={animated} onTip={setTip} />
          )}

          {/* Baseline */}
          <line x1="0" y1={BOTTOM} x2="820" y2={BOTTOM} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

          {/* Tooltip */}
          {tip && (() => {
            const ry = Math.max(4, tip.y - 42);
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect x={tipX - 44} y={ry} width={88} height={36} rx="6" fill="#1c2840" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x={tipX} y={ry + 13} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.45)">
                  {tip.label}{tip.sub ? ` · ${tip.sub}` : ""}
                </text>
                <text x={tipX} y={ry + 27} textAnchor="middle" fontSize="11" fontWeight="700" fill="#ff8b46">
                  {fmt(tip.value)}
                </text>
                {ry + 36 < tip.y && (
                  <line x1={tipX} y1={ry + 37} x2={tipX} y2={tip.y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2,2" />
                )}
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

function MonthlyBars({ bars, animated, onTip }: { bars: BarPoint[]; animated: boolean; onTip: (t: Tip) => void }) {
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const slotW = 820 / bars.length;
  const barW = Math.max(6, slotW - 5);

  return (
    <>
      {bars.map((bar, i) => {
        const h = (bar.value / maxVal) * CHART_H;
        const hasVal = bar.value > 0;
        const drawH = hasVal ? Math.max(h, 2) : 1;
        const x = i * slotW + (slotW - barW) / 2;
        const barY = BOTTOM - (animated ? drawH : 0);
        const showLabel = i % 5 === 0 || i === bars.length - 1;

        return (
          <g key={i} style={{ cursor: hasVal ? "pointer" : "default" }}>
            <rect
              x={x}
              y={animated ? BOTTOM - drawH : BOTTOM}
              width={barW}
              height={animated ? drawH : 0}
              rx="2"
              fill={hasVal ? "url(#sc-curr)" : "rgba(255,255,255,0.06)"}
              style={{
                transition: `y 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.012}s, height 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.012}s`,
              }}
              onMouseEnter={() => hasVal && onTip({ x: x + barW / 2, y: BOTTOM - drawH - 2, label: bar.label, value: bar.value })}
            />
            {hasVal && animated && h > 14 && (
              <text
                x={x + barW / 2}
                y={BOTTOM - drawH - 4}
                textAnchor="middle"
                fontSize="7"
                fill="rgba(255,255,255,0.45)"
                style={{ transition: `opacity 0.3s ${i * 0.012 + 0.4}s`, opacity: animated ? 1 : 0 }}
              >
                {fmtShort(bar.value)}
              </text>
            )}
            {showLabel && (
              <text x={x + barW / 2} y={LABEL_Y} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.28)">
                {bar.label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

function WeeklyBars({ comparison, animated, onTip }: { comparison: WeekComparison; animated: boolean; onTip: (t: Tip) => void }) {
  const { labels, current, previous } = comparison;
  const maxVal = Math.max(...current, ...previous, 1);
  const slotW = 820 / labels.length;
  const barW = Math.min(38, (slotW - 16) / 2);
  const gap = 7;

  return (
    <>
      {labels.map((label, i) => {
        const gc = i * slotW + slotW / 2;
        const gw = barW * 2 + gap;
        const xPrev = gc - gw / 2;
        const xCurr = xPrev + barW + gap;

        const hCurr = (current[i] / maxVal) * CHART_H;
        const hPrev = (previous[i] / maxVal) * CHART_H;
        const drawCurr = current[i] > 0 ? Math.max(hCurr, 2) : 1;
        const drawPrev = previous[i] > 0 ? Math.max(hPrev, 2) : 1;

        return (
          <g key={i}>
            {/* Previous bar */}
            <rect
              x={xPrev}
              y={animated ? BOTTOM - drawPrev : BOTTOM}
              width={barW}
              height={animated ? drawPrev : 0}
              rx="2"
              fill={previous[i] > 0 ? "url(#sc-prev)" : "rgba(255,255,255,0.07)"}
              style={{
                transition: `y 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s, height 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s`,
                cursor: previous[i] > 0 ? "pointer" : "default",
              }}
              onMouseEnter={() => previous[i] > 0 && onTip({ x: xPrev + barW / 2, y: BOTTOM - drawPrev - 2, label, value: previous[i], sub: "Өмнөх" })}
            />
            {/* Current bar */}
            <rect
              x={xCurr}
              y={animated ? BOTTOM - drawCurr : BOTTOM}
              width={barW}
              height={animated ? drawCurr : 0}
              rx="2"
              fill={current[i] > 0 ? "url(#sc-curr)" : "rgba(255,255,255,0.07)"}
              style={{
                transition: `y 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.06 + 0.04}s, height 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.06 + 0.04}s`,
                cursor: current[i] > 0 ? "pointer" : "default",
              }}
              onMouseEnter={() => current[i] > 0 && onTip({ x: xCurr + barW / 2, y: BOTTOM - drawCurr - 2, label, value: current[i], sub: "Энэ долоо хоног" })}
            />
            <text x={gc} y={LABEL_Y} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.38)">
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
}
