import React from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { SearchState } from "@/types/booking";

import { Card, CardContent } from "@/components/ui/card";
import { ScheduleCard } from "@/components/buy-ticket/schedule-card";
import type { ScheduleSearchResult } from "@/types/booking";

type ScheduleListProps = {
  results: ScheduleSearchResult[];
  activeScheduleId: number | null;
  availableSeatsCount: number;
  loadingSeats: boolean;
  onSelectSchedule: (schedule: ScheduleSearchResult) => void;
  search?: SearchState;
};

export function ScheduleList({
  results,
  activeScheduleId,
  availableSeatsCount,
  loadingSeats,
  onSelectSchedule,
  search,
}: ScheduleListProps) {
  const buildSearchHref = () => {
    const base = "/bus-tickets/booking/bus/search";

    if (!search) return base;

    const from = encodeURIComponent(search.source || "");
    const to = encodeURIComponent(search.destination || "");
    const doj = encodeURIComponent(search.date || "");
    return `${base}?fromcity=${from}&tocity=${to}&doj=${doj}`;
  };
  return (
    <section className="space-y-5 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">
          Search results
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100 sm:text-3xl">
          <Link
            href={buildSearchHref()}
            className="inline-block hover:underline"
          >
            Buses
          </Link>
        </h2>
      </div>

      {results.length === 0 ? (
        <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-emerald-900/30">
          <CardContent className="flex items-center gap-3 py-6 text-sm text-slate-600 dark:text-slate-400">
            <Clock3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Search a route to see live schedules from the backend.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {results.map((schedule) => {
            const isActive = activeScheduleId === schedule.id;

            return (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                isActive={isActive}
                availableSeatsCount={isActive ? availableSeatsCount : null}
                loadingSeats={loadingSeats}
                onSelect={onSelectSchedule}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
