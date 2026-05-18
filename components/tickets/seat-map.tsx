"use client";

export type SeatData = {
  id: number;
  row: string;
  number: number;
  label: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
};

type Props = {
  seats: SeatData[];
  selected: number[];
  onToggle: (seatId: number) => void;
  maxSelect: number;
};

export function SeatMap({ seats, selected, onToggle, maxSelect }: Props) {
  const rows = [...new Set(seats.map((s) => s.row))].sort();

  return (
    <div className="space-y-4">
      {/* Легенд */}
      <div className="flex flex-wrap gap-4 text-[0.65rem] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-white/[0.08]" /> Сул
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-[#ff7224]" /> Сонгосон
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-white/[0.03]" /> Захиалагдсан
        </span>
      </div>

      {/* Тайз */}
      <div className="flex flex-col items-center gap-1">
        <div className="h-1 w-3/4 rounded-full bg-white/10" />
        <p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-white/20">
          Тайз / Дэлгэц
        </p>
      </div>

      {/* Суудлын сүлжээ */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1.5">
          {rows.map((row) => {
            const rowSeats = seats
              .filter((s) => s.row === row)
              .sort((a, b) => a.number - b.number);

            return (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-5 shrink-0 text-center text-[0.6rem] font-bold text-white/30">
                  {row}
                </span>
                {rowSeats.map((seat) => {
                  const isSelected = selected.includes(seat.id);
                  const isTaken = seat.status !== "AVAILABLE";
                  const limitReached = selected.length >= maxSelect && !isSelected;

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isTaken || limitReached}
                      onClick={() => !isTaken && !limitReached && onToggle(seat.id)}
                      title={isTaken ? `${seat.label} — захиалагдсан` : seat.label}
                      className={[
                        "flex h-7 w-7 items-center justify-center rounded text-[0.6rem] font-bold transition",
                        isTaken
                          ? "cursor-not-allowed bg-white/[0.03] text-white/10"
                          : isSelected
                          ? "bg-[#ff7224] text-white shadow-[0_0_8px_rgba(255,114,36,0.5)]"
                          : limitReached
                          ? "cursor-not-allowed bg-white/[0.05] text-white/20"
                          : "bg-white/[0.08] text-white/50 hover:bg-white/[0.16] hover:text-white",
                      ].join(" ")}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-white/50">
          Сонгосон:{" "}
          <span className="font-semibold text-[#ff7224]">
            {seats
              .filter((s) => selected.includes(s.id))
              .map((s) => s.label)
              .join(", ")}
          </span>
        </p>
      )}
    </div>
  );
}
