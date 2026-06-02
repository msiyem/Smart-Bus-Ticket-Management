"use client";

import React from "react";

import {
  ArrowLeftRight,
  ArrowRight,
  Dot,
  LoaderCircle,
  MapPin,
  Send,
  TriangleAlert,
} from "lucide-react";

import { useForm, Controller, useWatch } from "react-hook-form";

import { BANGLADESH_CITIES } from "@/constants/cities";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { SearchState, StatusState } from "@/types/booking";

import { CityCombobox } from "../buy-ticket/route-suggestions";
import { DatePicker } from "../shared/date-picker";

type SearchFormProps = {
  search: SearchState;
  onSearchChange: React.Dispatch<React.SetStateAction<SearchState>>;
  onSwapCities: () => void;
  onSubmitSearch: () => Promise<void>;
  loadingSearch: boolean;
  status: StatusState;
  compact?: boolean;
};

export function SearchForm({
  search,
  onSearchChange,
  onSwapCities,
  onSubmitSearch,
  loadingSearch,
  status,
  compact = false,
}: SearchFormProps) {
  const { control, handleSubmit } = useForm<SearchState>({
    defaultValues: search,
    values: search,
  });

  const source = useWatch({ control, name: "source" });
  const destination = useWatch({ control, name: "destination" });

  const fromCities = BANGLADESH_CITIES.filter((city) => city !== destination);

  const toCities = BANGLADESH_CITIES.filter((city) => city !== source);
  const travelDate = useWatch({ control, name: "date" });
  const isFormIncomplete = !source || !destination || !travelDate;
  const submitHandler = async () => {
    await onSubmitSearch();
  };

  return (
    <Card
      className={cn(
        "overflow-visible border-emerald-200/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-3xl dark:border-slate-800/80 dark:bg-emerald-900/80 lg:shadow-[0_32px_128px_rgba(15,23,42,0.1)]",
        compact &&
          "border-white/70 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
      )}
    >
      <CardContent
        className={cn(
          "space-y-5 p-6 sm:p-8",
          compact && "space-y-4 p-4 sm:p-5",
        )}
      >
        <form
          className={cn("space-y-5", compact && "space-y-4")}
          onSubmit={handleSubmit(submitHandler)}
        >
          <div
            className={cn(
              "grid gap-4 lg:items-end",
              compact ? "lg:grid-cols-[1.9fr_1fr]" : "lg:grid-cols-[2fr_1fr]",
            )}
          >
            {/* FROM + TO */}
            <div
              className={cn(
                "grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-[1fr_auto_1fr]",
                compact && "gap-3",
              )}
            >
              {/* FROM */}
              <div className="space-y-2">
                <label
                  className={cn(
                    "text-sm font-medium text-slate-700 dark:text-slate-200",
                    compact && "text-xs",
                  )}
                >
                  <Dot className="inline-block h-5 w-5 text-emerald-600" />
                  From
                </label>

                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <CityCombobox
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);

                        onSearchChange((current) => ({
                          ...current,
                          source: value,
                        }));
                      }}
                      cities={fromCities}
                      placeholder="From"
                      recentStorageKey="recent_from_cities"
                      excludeCity={destination}
                      icon={<Send className="h-4 w-4 text-emerald-600" />}
                    />
                  )}
                />
              </div>

              {/* SWAP */}
              <div className="flex items-end justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSwapCities}
                  className={cn(
                    "h-12 w-12 rounded-full border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
                    compact && "h-10 w-10",
                  )}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              {/* TO */}
              <div className="space-y-2">
                <label
                  className={cn(
                    "text-sm font-medium text-slate-700 dark:text-slate-200",
                    compact && "text-xs",
                  )}
                >
                  <Dot className="inline-block h-5 w-5 text-emerald-600" />
                  To
                </label>

                <Controller
                  control={control}
                  name="destination"
                  render={({ field }) => (
                    <CityCombobox
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);

                        onSearchChange((current) => ({
                          ...current,
                          destination: value,
                        }));
                      }}
                      cities={toCities}
                      placeholder="To"
                      recentStorageKey="recent_to_cities"
                      excludeCity={source}
                      icon={<MapPin className="h-4 w-4 text-emerald-600" />}
                    />
                  )}
                />
              </div>
            </div>

            {/* DATE + BUTTON */}
            <div
              className={cn(
                "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_auto] items-end",
                compact && "gap-3",
              )}
            >
              {/* DATE */}
              <div className="space-y-2">
                <label
                  className={cn(
                    "text-sm font-medium text-slate-700 dark:text-slate-200",
                    compact && "text-xs",
                  )}
                >
                  <Dot className="inline-block h-5 w-5 text-emerald-600" />
                  Travel date
                </label>

                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      minDate={new Date()}
                      onChange={(date) => {
                        field.onChange(date);

                        onSearchChange((current) => ({
                          ...current,
                          date,
                        }));
                      }}
                      placeholder="Pick travel date"
                    />
                  )}
                />
              </div>

              {/* BUTTON */}
              <Button
                type="submit"
                disabled={loadingSearch || isFormIncomplete}
                className={cn(
                  "h-12 rounded-2xl px-6 bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50",
                  compact && "h-11",
                )}
              >
                {loadingSearch ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <>
                    Search
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {status ? (
          <div
            className={`flex items-center gap-2
              rounded-2xl border px-4 py-3 text-sm
              ${
                status.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 dark:bg-emerald-800 text-indigo-400 dark:text-indigo-200"
              }
            `}
          >
            <TriangleAlert />
            {status.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
