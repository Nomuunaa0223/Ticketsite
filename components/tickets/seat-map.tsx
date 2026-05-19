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
  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  function renderSeat(seat: SeatData) {
    const isSelected = selected.includes(seat.id);
    const isTaken = seat.status !== "AVAILABLE" && !isSelected;
    const limitReached = selected.length >= maxSelect && !isSelected;

    return (
      <button
        key={seat.id}
        type="button"
        disabled={isTaken || limitReached}
        onClick={() => {
          if (!isTaken && !limitReached) onToggle(seat.id);
        }}
        title={isTaken ? `${seat.label} — захиалагдсан` : seat.label}
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.55rem] font-bold transition-all duration-150",
          isTaken
            ? "cursor-not-allowed bg-white/[0.05] text-white/[0.15]"
            : isSelected
            ? "scale-110 bg-[#ff7224] text-white shadow-[0_0_10px_rgba(255,114,36,0.45)]"
            : limitReached
            ? "cursor-not-allowed bg-white/[0.07] text-white/20"
            : "bg-white/[0.13] text-white/50 hover:bg-white/[0.24] hover:text-white",
        ].join(" ")}
      >
        {seat.number}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Тайз */}
      <div className="w-3/5 rounded-xl bg-white/[0.07] py-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.22em] text-white/40">
        Тайз / Дэлгэц
      </div>

      {/* Суудлын сүлжээ */}
      <div className="overflow-x-auto pb-1 w-full">
        <div className="mx-auto inline-flex flex-col gap-1.5">
          {rows.map((row) => {
            const rowSeats = seats
              .filter((s) => s.row === row)
              .sort((a, b) => a.number - b.number);
            const mid = Math.ceil(rowSeats.length / 2);
            const left = rowSeats.slice(0, mid);
            const right = rowSeats.slice(mid);

            return (
              <div key={row} className="flex items-center gap-2">
                {/* Зүүн талын эгнээний дугаар */}
                <span className="w-5 shrink-0 text-right text-[0.6rem] font-bold text-white/25">
                  {row}
                </span>

                {/* Зүүн хэсэг */}
                <div className="flex gap-1">
                  {left.map((seat) => renderSeat(seat))}
                </div>

                {/* Гарц (аisle) */}
                <div className="w-5 shrink-0" />

                {/* Баруун хэсэг */}
                <div className="flex gap-1">
                  {right.map((seat) => renderSeat(seat))}
                </div>

                {/* Баруун талын эгнээний дугаар */}
                <span className="w-5 shrink-0 text-left text-[0.6rem] font-bold text-white/25">
                  {row}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Легенд */}
      <div className="flex flex-wrap justify-center gap-5 text-[0.65rem] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-white/[0.13]" />
          Сул суудал
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-[#ff7224]" />
          Сонгосон
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-white/[0.05]" />
          Захиалагдсан
        </span>
      </div>

      {/* Сонгосон суудлуудын жагсаалт */}
      {selected.length > 0 && (
        <div className="rounded-xl bg-white/[0.04] px-4 py-2.5 text-center text-xs text-white/50">
          Сонгосон:{" "}
          <span className="font-semibold text-[#ff7224]">
            {seats
              .filter((s) => selected.includes(s.id))
              .map((s) => s.label)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
