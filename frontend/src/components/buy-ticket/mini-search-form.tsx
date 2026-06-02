"use client";

import React from "react";

import {
  ArrowLeftRight,
  ArrowRight,
  Cross,
  Edit,
  LoaderCircle,
  MapPin,
  Send,
  X,
} from "lucide-react";

import { Controller, useForm, useWatch } from "react-hook-form";

import { BANGLADESH_CITIES } from "@/constants/cities";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import type { SearchState } from "@/types/booking";

import { CityCombobox } from "../buy-ticket/route-suggestions";
import { DatePicker } from "../shared/date-picker";
import { format } from "date-fns";

type MiniSearchFormProps = {
  search: SearchState;
  onSearchChange: React.Dispatch<React.SetStateAction<SearchState>>;
  onSwapCities: () => void;
  onSubmitSearch: () => Promise<void>;
  loading?: boolean;
  className?: string;
};

export function MiniSearchForm({
  search,
  onSearchChange,
  onSwapCities,
  onSubmitSearch,
  loading,
  className,
}: MiniSearchFormProps) {
  const { control, handleSubmit } = useForm<SearchState>({
    defaultValues: search,
    values: search,
  });

  const source = useWatch({ control, name: "source" });

  const destination = useWatch({
    control,
    name: "destination",
  });

  const travelDate = useWatch({
    control,
    name: "date",
  });

  const fromCities = BANGLADESH_CITIES.filter((city) => city !== destination);

  const toCities = BANGLADESH_CITIES.filter((city) => city !== source);

  const isDisabled = !source || !destination || !travelDate;
  const [showMobileForm, setShowMobileForm] = React.useState(false);
  const submitHandler = async () => {
    await onSubmitSearch();
  };

  return (
    <div className={cn("", className)}>
      {/* MOBILE SUMMARY BAR */}
      <div className="md:hidden">
        {!showMobileForm ? (
          <div
            className="
            flex items-center justify-between
            text-sm font-medium
            text-slate-800 dark:text-slate-100
          "
          >
            {/* LEFT */}
            <div className="min-w-0">
              <div
                className="
                truncate text-base font-semibold
                text-slate-800 dark:text-slate-100
              "
              >
                {source || "From"} → {destination || "To"}
              </div>

              <div
                className="
                mt-0.5 text-xs text-slate-500
                dark:text-slate-400
              "
              >
                {travelDate
                  ? format(new Date(travelDate), "EEE, dd MMM")
                  : "Select date"}
              </div>
            </div>

            {/* RIGHT */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowMobileForm(true)}
              className="
              shrink-0 text-emerald-600
              hover:bg-emerald-50
              dark:hover:bg-emerald-900/30
            "
            >
              Modify Search
              <Edit className="ml-1 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* CLOSE BUTTON */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowMobileForm(false)}
                className="text-sm text-slate-500"
              >
                
                <X className="ml-1 h-5 w-5" />
              </Button>
            </div>

            
            <form onSubmit={handleSubmit(submitHandler)} className="space-y-3">
              {/* FROM */}
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
                    recentStorageKey="mini_from_cities"
                    excludeCity={destination}
                    icon={<Send className="h-4 w-4 text-emerald-600" />}
                  />
                )}
              />

              {/* SWAP */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSwapCities}
                  className="
                  h-11 w-11 rounded-2xl
                  border-emerald-200
                  bg-white
                  text-emerald-700
                  hover:bg-emerald-50
                "
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              {/* TO */}
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
                    recentStorageKey="mini_to_cities"
                    excludeCity={source}
                    icon={<MapPin className="h-4 w-4 text-emerald-600" />}
                  />
                )}
              />

              {/* DATE */}
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
                    placeholder="Travel date"
                  />
                )}
              />

              {/* BUTTON */}
              <Button
                type="submit"
                disabled={loading || isDisabled}
                className="
                h-12 w-full rounded-2xl
                bg-emerald-600 text-white
                hover:bg-emerald-700
              "
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Search
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* DESKTOP FORM */}
      <form
        onSubmit={handleSubmit(submitHandler)}
        className="
        hidden gap-3
        md:grid
        md:grid-cols-[1fr_auto_1fr_auto_auto]
      "
      >
        {/* FROM */}
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
              recentStorageKey="mini_from_cities"
              excludeCity={destination}
              icon={<Send className="h-4 w-4 text-emerald-600" />}
            />
          )}
        />

        {/* SWAP */}
        <div className="flex items-center justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onSwapCities}
            className="
            h-11 w-11 rounded-2xl
            border-emerald-200
            bg-white
            text-emerald-700
            hover:bg-emerald-50
          "
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        {/* TO */}
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
              recentStorageKey="mini_to_cities"
              excludeCity={source}
              icon={<MapPin className="h-4 w-4 text-emerald-600" />}
            />
          )}
        />

        {/* DATE */}
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
              placeholder="Travel date"
            />
          )}
        />

        {/* BUTTON */}
        <Button
          type="submit"
          disabled={loading || isDisabled}
          className="
          h-12 rounded-2xl
          bg-emerald-600 px-6
          text-white hover:bg-emerald-700
        "
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Search
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
