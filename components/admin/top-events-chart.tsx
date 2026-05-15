"use client";

import { useState, useEffect } from "react";

export type TopEventBar = { title: string; count: number };

const BAR_H = 28;
const GAP = 10;
const LABEL_W = 220;
const COUNT_W = 48;
const CHART_W = 820 - LABEL_W - COUNT_W - 16;

export function TopEventsChart({ events }: { events: TopEventBar[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const id = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(id);
  }, [events]);

  if (!events.length) return null;

  const maxCount = Math.max(...events.map((e) => e.count), 1);
  const svgH = events.length * (BAR_H + GAP) - GAP + 4;

  return (
    <div className="mt-4 rounded-[1rem] bg-[#121a30] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_16px_32px_rgba(0,0,0,0.18)]">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-[-0.04em] text-white sm:text-2xl">Борлуулалт ихтэй арга хэмжээ</h2>
        <p className="mt-0.5 text-sm text-white/40">Сүүлийн 7 хоногт захиалга хамгийн их ирсэн</p>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 820 ${svgH}`} className="w-full min-w-[480px]" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="tec-bar" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff8b46" />
              <stop offset="100%" stopColor="#e85c00" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {events.map((ev, i) => {
            const y = i * (BAR_H + GAP);
            const pct = ev.count / maxCount;
            const barW = animated ? Math.max(pct * CHART_W, 4) : 0;
            const rank = i + 1;

            return (
              <g key={i}>
                {/* Rank badge */}
                <text
                  x={0}
                  y={y + BAR_H / 2 + 4}
                  fontSize="10"
                  fontWeight="700"
                  fill={rank === 1 ? "#ff8b46" : "rgba(255,255,255,0.25)"}
                >
                  {rank}
                </text>

                {/* Event name */}
                <text
                  x={20}
                  y={y + BAR_H / 2 + 4}
                  fontSize="11"
                  fontWeight={rank === 1 ? "700" : "500"}
                  fill={rank === 1 ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.62)"}
                >
                  {ev.title.length > 28 ? ev.title.slice(0, 27) + "…" : ev.title}
                </text>

                {/* Track */}
                <rect
                  x={LABEL_W}
                  y={y + 6}
                  width={CHART_W}
                  height={BAR_H - 12}
                  rx="4"
                  fill="rgba(255,255,255,0.04)"
                />

                {/* Bar */}
                <rect
                  x={LABEL_W}
                  y={y + 6}
                  width={barW}
                  height={BAR_H - 12}
                  rx="4"
                  fill="url(#tec-bar)"
                  style={{
                    transition: `width 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s`,
                  }}
                />

                {/* Count */}
                <text
                  x={LABEL_W + CHART_W + 10}
                  y={y + BAR_H / 2 + 4}
                  fontSize="11"
                  fontWeight="700"
                  fill="#ff8b46"
                >
                  {ev.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
