import React from "react";
import { BusFront, LoaderCircle } from "lucide-react";

import type { SeatRow } from "@/types/booking";

type SeatMapProps = {
  seatRows: SeatRow[];
  selectedSeats: string[];
  bookedSeatsByRow: Map<string, string[]>;
  loadingSeats: boolean;
  onToggleSeat: (seatNumber: string) => void;
};

type SeatButtonProps = {
  seatNumber: string;
  available: boolean;
  selected: boolean;
  onToggleSeat: (seatNumber: string) => void;
};

const SeatButton = React.memo(function SeatButton({
  seatNumber,
  available,
  selected,
  onToggleSeat,
}: SeatButtonProps) {
  return (
    <button
      type="button"
      onClick={() => available && onToggleSeat(seatNumber)}
      disabled={!available}
      className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
        available
          ? selected
            ? "border-slate-950 bg-slate-950 text-white shadow-sm dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
            : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
      }`}
    >
      {seatNumber}
    </button>
  );
});

export function SeatMap({
  seatRows,
  selectedSeats,
  bookedSeatsByRow,
  loadingSeats,
  onToggleSeat,
}: SeatMapProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
            Bus deck
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
            Tap a seat to select it
          </h3>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Driver front
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950">
          Available
        </span>
        <span className="rounded-md border border-slate-950 bg-slate-950 px-2 py-1 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950">
          Selected
        </span>
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          Booked
        </span>
      </div>

      <div className="space-y-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Front
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Driver seat area
            </p>
          </div>
          <BusFront className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </div>

        {loadingSeats ? (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <LoaderCircle className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-400" />
            Loading available seats from the backend...
          </div>
        ) : seatRows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            No seat map data is available for this schedule yet.
          </div>
        ) : (
          <div className="space-y-2">
            {seatRows.map((row) => {
              const bookedInRow = bookedSeatsByRow.get(row.row) || [];

              return (
                <div
                  key={row.row}
                  className={`flex flex-col gap-1 rounded-md bg-white px-2 py-1 dark:bg-slate-950 ${
                    bookedInRow.length ? "ring-1 ring-emerald-300/60" : ""
                  }`}
                >
                  <div className="flex items-center justify-start gap-2">
                    {bookedInRow.length > 0 ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {bookedInRow.join(", ")}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-[1fr_1fr_0.4fr_1fr_1fr] items-center gap-2">
                    {row.cells.map((cell, index) => {
                      const isSelected = selectedSeats.includes(
                        cell.seatNumber,
                      );

                      return (
                        <React.Fragment key={cell.seatNumber}>
                          {index === 2 ? (
                            <div className="flex items-center justify-center">
                              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                            </div>
                          ) : null}

                          <SeatButton
                            seatNumber={cell.seatNumber}
                            available={cell.available}
                            selected={isSelected}
                            onToggleSeat={onToggleSeat}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
