import React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatTime } from "@/lib/formatters";
import { groupBookedSeatsByRow } from "@/lib/seat-utils";
import type {
  BookingSummary,
  ScheduleSearchResult,
  SeatRow,
} from "@/types/booking";
import { SeatMap } from "@/components/buy-ticket/seat-map";

type SeatSheetProps = {
  open: boolean;
  onClose: () => void;
  activeSchedule: ScheduleSearchResult | null;
  selectedSeats: string[];
  availableSeatsCount: number;
  seatRows: SeatRow[];
  bookingSummary: BookingSummary | null;
  maxSeatsPerBooking: number;
  loadingSeats: boolean;
  loadingBooking: boolean;
  onToggleSeat: (seatNumber: string) => void;
  onBook: () => Promise<void>;
  onClearSelection: () => void;
};

export function SeatSheet({
  open,
  onClose,
  activeSchedule,
  selectedSeats,
  availableSeatsCount,
  seatRows,
  bookingSummary,
  maxSeatsPerBooking,
  loadingSeats,
  loadingBooking,
  onToggleSeat,
  onBook,
  onClearSelection,
}: SeatSheetProps) {
  const isMobile = useIsMobile();

  const bookedSeatsByRow = React.useMemo(
    () => groupBookedSeatsByRow(bookingSummary?.seats ?? []),
    [bookingSummary?.seats],
  );

  return (
    <Sheet
      open={open && Boolean(activeSchedule)}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="w-full p-0 data-[side=bottom]:h-[78vh] data-[side=bottom]:rounded-t-2xl data-[side=right]:sm:max-w-2xl"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
            <SheetTitle className="text-xl font-semibold text-slate-950 dark:text-slate-100">
              {activeSchedule
                ? `Choose seats for ${activeSchedule.source_city} to ${activeSchedule.destination_city}`
                : "Choose seats"}
            </SheetTitle>
            <SheetDescription className="text-slate-600 dark:text-slate-400">
              Select up to {maxSeatsPerBooking} seats and confirm the booking
              from here.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {activeSchedule ? (
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Route
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activeSchedule.source_city} to{" "}
                        {activeSchedule.destination_city}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Bus
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {activeSchedule.operator_name ||
                          activeSchedule.bus_type}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Departure
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatTime(activeSchedule.departure_time)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Arrival
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formatTime(activeSchedule.arrival_time)}
                      </p>
                    </div>
                  </div>

                  <SeatMap
                    seatRows={seatRows}
                    selectedSeats={selectedSeats}
                    bookedSeatsByRow={bookedSeatsByRow}
                    loadingSeats={loadingSeats}
                    onToggleSeat={onToggleSeat}
                  />
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
                      Selection summary
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
                      Review before booking
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Selected seats
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedSeats.length > 0
                          ? selectedSeats.join(", ")
                          : "No seats selected"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Seat limit
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedSeats.length} of {maxSeatsPerBooking}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Available seats
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {availableSeatsCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Total fare
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        ৳{activeSchedule.fare * selectedSeats.length}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Fare per seat
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ৳{activeSchedule.fare}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Travel time
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatTime(activeSchedule.departure_time)} -{" "}
                        {formatTime(activeSchedule.arrival_time)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                      onClick={() => void onBook()}
                      disabled={loadingBooking || selectedSeats.length === 0}
                    >
                      {loadingBooking
                        ? "Booking seats..."
                        : "Book selected seats"}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                      onClick={onClearSelection}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
