import React from "react";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/formatters";
import type { BookingSummary as BookingSummaryType } from "@/types/booking";

type BookingSummaryProps = {
  bookingSummary: BookingSummaryType;
  onDismiss: () => void;
};

export function BookingSummary({
  bookingSummary,
  onDismiss,
}: BookingSummaryProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 print:border-slate-300 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 print:border-slate-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400 print:text-slate-600">
            Booking confirmed
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 print:text-slate-700">
            Booking reference #{bookingSummary.bookingId}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900 print:bg-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Route
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                {bookingSummary.schedule.source_city} to{" "}
                {bookingSummary.schedule.destination_city}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900 print:bg-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Bus
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                {bookingSummary.schedule.operator_name ||
                  bookingSummary.schedule.bus_type}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900 print:bg-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Departure
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                {formatTime(bookingSummary.schedule.departure_time)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900 print:bg-slate-100">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Arrival
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                {formatTime(bookingSummary.schedule.arrival_time)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 print:border-slate-300 print:bg-slate-50">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 print:text-slate-600">
              Seats
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bookingSummary.seats.map((seat) => (
                <span
                  key={seat}
                  className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200 print:border print:border-slate-300 print:bg-white print:text-slate-900"
                >
                  {seat}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 print:border-slate-300 print:bg-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 print:text-slate-600">
              Fare summary
            </p>
            <h4 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100 print:text-slate-900">
              Payment details
            </h4>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900 print:bg-slate-100">
              <span className="text-slate-600 dark:text-slate-400">Seats</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                {bookingSummary.seats.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900 print:bg-slate-100">
              <span className="text-slate-600 dark:text-slate-400">
                Fare per seat
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100 print:text-slate-900">
                ৳{bookingSummary.schedule.fare}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-base dark:bg-slate-900 print:bg-slate-100">
              <span className="font-medium text-slate-700 dark:text-slate-300 print:text-slate-700">
                Total paid
              </span>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 print:text-slate-900">
                ৳{bookingSummary.totalAmount}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Button
              className="rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              onClick={() => window.print()}
            >
              Print ticket
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
