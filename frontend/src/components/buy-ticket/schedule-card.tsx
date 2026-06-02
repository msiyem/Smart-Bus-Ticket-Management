import React from "react";
import { BusFront, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTime } from "@/lib/formatters";
import type { ScheduleSearchResult } from "@/types/booking";

type ScheduleCardProps = {
  schedule: ScheduleSearchResult;
  isActive: boolean;
  availableSeatsCount: number | null;
  loadingSeats: boolean;
  onSelect: (schedule: ScheduleSearchResult) => void;
};

export function ScheduleCard({
  schedule,
  isActive,
  availableSeatsCount,
  loadingSeats,
  onSelect,
}: ScheduleCardProps) {
  return (
    <Card
      className={`border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 transition-transform hover:-translate-y-1 hover:shadow-lg duration-150 ${
        isActive ? "ring-2 ring-slate-400/50 dark:ring-slate-500/40" : ""
      }`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-slate-950 dark:text-slate-100">
              {schedule.source_city} to {schedule.destination_city}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                {schedule.operator_name || schedule.bus_type}
              </span>
              <span className="text-xs">{schedule.bus_number}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              ৳{schedule.fare}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Departure
            </p>
            <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">
              {formatTime(schedule.departure_time)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Arrival
            </p>
            <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">
              {formatTime(schedule.arrival_time)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <BusFront className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {isActive
            ? "Seat selection is open below."
            : "Select seats for this trip."}
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Seats: {isActive ? availableSeatsCount : "--"}
        </div>

        <Button
          variant={isActive ? "default" : "outline"}
          className={`h-10 w-full rounded-xl ${
            isActive
              ? "bg-slate-950 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          }`}
          onClick={() => onSelect(schedule)}
          disabled={loadingSeats && isActive}
        >
          {loadingSeats && isActive ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading seats...
            </span>
          ) : (
            "Select seats"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
