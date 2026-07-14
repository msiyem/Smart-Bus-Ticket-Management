"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  ChevronDown,
  Minus,
  Search,
  SlidersHorizontal,
  TrainFront,
  MapPin,
  BusFront,
  Bus,
  MapPinned,
} from "lucide-react";

import { getUser } from "@/lib/auth/getUser";
import { BookingSummary } from "@/components/buy-ticket/booking-summary";
import { BookingToast } from "@/components/buy-ticket/booking-toast";
import { SeatSheet } from "@/components/buy-ticket/seat-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useBooking } from "@/hooks/use-booking";
import type { TripSearchResult, SearchState } from "@/types/booking";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { MiniSearchForm } from "./mini-search-form";
import { format } from "date-fns";

type BusTicketSearchPageProps = {
  isAuthenticated: boolean;
  initialSearch: SearchState;
};

type DepartureWindow = "all" | "morning" | "afternoon" | "evening" | "night";

function getBusClass(schedule: TripSearchResult) {
  const value =
    `${schedule.bus_type} ${schedule.operator_name || ""}`.toLowerCase();

  return value.includes("ac") ? "AC" : "Non AC";
}

function getDepartureWindow(value: string): Exclude<DepartureWindow, "all"> {
  const date = new Date(value);
  const hour = date.getHours();

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getDurationLabel(departure: string, arrival: string) {
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "--";
  }

  const diff = Math.max(end - start, 0);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.round((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function BusResultCard({
  schedule,
  isActive,
  availableSeatsCount,
  loadingSeats,
  onSelect,
  searchDate,
}: {
  schedule: TripSearchResult;
  isActive: boolean;
  availableSeatsCount: number | null;
  loadingSeats: boolean;
  onSelect: (schedule: TripSearchResult) => void;
  searchDate: string;
}) {
  const busClass = getBusClass(schedule);
  const duration = getDurationLabel(
    schedule.departure_time,
    schedule.arrival_time,
  );

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950",
        isActive && "border-emerald-500 ring-1 ring-emerald-500/20",
      )}
    >
      <CardContent className=" lg:px-6">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <BusFront className="h-6 w-6 p-1 text-emerald-500 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600 rounded-2xl" />
                  <h3 className="truncate text-lg font-bold  text-slate-900 dark:text-slate-100">
                    {schedule.operator_name || schedule.bus_type}
                  </h3>

                  <span
                    className="
                  rounded-full
                  bg-emerald-50
                  px-2 py-0.5
                  text-[10px]
                  font-semibold
                  uppercase
                  text-emerald-700
                  dark:bg-emerald-500/10
                  dark:text-emerald-300
                "
                  >
                    {busClass}
                  </span>
                </div>

              </div>
            </div>

            <div
              className="
              mt-2
              lg:mr-6
              grid
              grid-cols-[1fr_auto_1fr]
              items-center
              gap-3
            "
            >
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {formatTime(schedule.departure_time)}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {format(new Date(schedule.departure_time), "EEE,dd MMM")}
                </p>

                <p className="flex items-center gap-0.5 mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3 w-3 text-emerald-600 inline-block" />
                  {schedule.source_city}
                </p>
              </div>

              <div className="flex min-w-[150px] flex-col items-center">
                <span className="text-[11px] font-medium text-slate-500">
                  {duration}
                </span>

                <div className="mt-1 flex w-full items-center gap-1">
                  <div
                    className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-emerald-200
                  bg-emerald-50
                  text-emerald-600
                  dark:border-emerald-500/20
                  dark:bg-emerald-500/10
                "
                  >
                    <Bus className="h-3.5 w-3.5" />
                  </div>
                  <div className="h-[2px] flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-[2px] flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-[2px] flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />

                  <div className="h-[2px] flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="h-[2px] flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div
                    className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-emerald-200
                  bg-emerald-50
                  text-emerald-600
                  dark:border-emerald-500/20
                  dark:bg-emerald-500/10
                "
                  >
                    <MapPinned className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {formatTime(schedule.arrival_time)}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {format(new Date(schedule.arrival_time), "EEE,dd MMM")}
                </p>

                <p className="flex items-center justify-end gap-0.5 mt-1  text-xs font-bold text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3 w-3 text-emerald-600 inline-block" />
                  {schedule.destination_city}
                </p>
              </div>
            </div>
          </div>

          <div
            className="
          flex
          flex-row
          items-center
          justify-between
          gap-4
          border-t
          pt-4
          lg:min-w-40
          lg:flex-col
          lg:items-end
          lg:border-l
          lg:border-t-0
          lg:pl-5
          lg:pt-0
          dark:border-slate-800
        "
          >
            <div className=" text-right">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                <span className="text-sm">৳</span>
                {schedule.fare}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <Button
                onClick={() => onSelect(schedule)}
                disabled={loadingSeats && isActive}
                className="
            h-8
            rounded-xl
            bg-emerald-600
            px-4
            text-xs
            font-semibold
            text-white
            shadow-sm
            hover:bg-emerald-700
          "
              >
                {loadingSeats && isActive ? "Loading..." : "View Seats"}
              </Button>
              <p className="mt-1 text-xs text-slate-500">
                {isActive
                  ? `${availableSeatsCount} Seats Available`
                  : typeof schedule.available_seats === "number"
                    ? `${schedule.available_seats} Seats Available`
                    : `${schedule.capacity} Seats`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type FilterPanelProps = {
  busTypeOptions: string[];
  selectedBusTypes: string[];
  operatorQuery: string;
  operatorOptions: string[];
  departureWindow: DepartureWindow;
  departureAvailability: Record<Exclude<DepartureWindow, "all">, boolean>;
  sortOrder: "none" | "asc" | "desc";
  onToggleBusType: (type: string) => void;
  onOperatorQueryChange: (value: string) => void;
  onDepartureWindowChange: (value: Exclude<DepartureWindow, "all">) => void;
  onSortOrderChange: (value: "none" | "asc" | "desc") => void;
  onResetFilters: () => void;
  compact?: boolean;
};

function FilterPanel({
  busTypeOptions,
  selectedBusTypes,
  operatorQuery,
  operatorOptions,
  departureWindow,
  departureAvailability,
  sortOrder,
  onToggleBusType,
  onOperatorQueryChange,
  onDepartureWindowChange,
  onSortOrderChange,
  onResetFilters,
  compact = false,
}: FilterPanelProps) {
  const isCompact = compact;
  const [isBusTypeOpen, setIsBusTypeOpen] = React.useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = React.useState(false);
  const [isDepartureOpen, setIsDepartureOpen] = React.useState(false);

  const busTypeAvailability = React.useMemo(
    () => ({
      AC: busTypeOptions.includes("AC"),
      "Non AC": busTypeOptions.includes("Non AC"),
    }),
    [busTypeOptions],
  );

  const filteredOperators = React.useMemo(() => {
    const query = operatorQuery.trim().toLowerCase();

    if (!query) {
      return operatorOptions;
    }

    return operatorOptions.filter((operator) =>
      operator.toLowerCase().includes(query),
    );
  }, [operatorOptions, operatorQuery]);

  const busTypeChoices = ["AC", "Non AC"] as const;
  const timeOptions = [
    { key: "morning", label: "Morning", value: "06-12" },
    { key: "afternoon", label: "Afternoon", value: "12-17" },
    { key: "evening", label: "Evening", value: "17-21" },
    { key: "night", label: "Night", value: "21-06" },
  ] as const;

  return (
    <div className={cn("space-y-5", compact ? "sm:space-y-4" : "lg:space-y-6")}>
      <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
            Filters
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl border-emerald-200 bg-white text-emerald-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-slate-900"
          onClick={onResetFilters}
        >
          Reset
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setIsBusTypeOpen((current) => !current)}
        >
          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Bus Type
          </Label>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-emerald-600 transition-transform dark:text-emerald-400",
              isBusTypeOpen && "rotate-180",
            )}
          />
        </button>

        {isBusTypeOpen ? (
          <div
            className={cn(
              "grid gap-2",
              isCompact ? "grid-cols-1" : "grid-cols-2 md:grid-cols-1",
            )}
          >
            {busTypeChoices.map((type) => {
              const available = busTypeAvailability[type];
              const active = selectedBusTypes.includes(type);

              return (
                <label
                  key={type}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    available
                      ? active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-900"
                      : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    disabled={!available}
                    onChange={() => {
                      if (available) {
                        onToggleBusType(type);
                      }
                    }}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 dark:accent-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <span className="min-w-0 flex-1 truncate">{type}</span>

                  {!available ? (
                    <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Not available
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setIsOperatorOpen((current) => !current)}
        >
          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Operator
          </Label>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-emerald-600 transition-transform dark:text-emerald-400",
              isOperatorOpen && "rotate-180",
            )}
          />
        </button>

        {isOperatorOpen ? (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={operatorQuery}
                onChange={(e) => onOperatorQueryChange(e.target.value)}
                placeholder="Search operator"
                className="h-11 rounded-xl border-emerald-200 bg-white pl-9 shadow-sm placeholder:text-slate-400 focus-visible:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {filteredOperators.length > 0 ? (
                filteredOperators.map((operator) => (
                  <button
                    key={operator}
                    type="button"
                    onClick={() => onOperatorQueryChange(operator)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-emerald-300"
                  >
                    {operator}
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                  No operator found
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setIsDepartureOpen((current) => !current)}
        >
          <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            Departure Time
          </Label>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-emerald-600 transition-transform dark:text-emerald-400",
              isDepartureOpen && "rotate-180",
            )}
          />
        </button>

        {isDepartureOpen ? (
          <div
            className={cn(
              "grid gap-2",
              isCompact
                ? "grid-cols-1"
                : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-1",
            )}
          >
            {timeOptions.map((item) => {
              const available = departureAvailability[item.key];
              const active = departureWindow === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    if (available) {
                      onDepartureWindowChange(item.key);
                    }
                  }}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition",
                    available
                      ? active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-900"
                      : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-start gap-3 text-left">
                      <span className="mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <SlidersHorizontal className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {item.value}
                        </span>
                      </span>
                    </span>

                    <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {available ? "Available" : "No buses"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <Label className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Fare
        </Label>

        <div
          className={cn(
            "grid gap-2",
            isCompact ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          <Button
            variant="outline"
            className={cn(
              "h-11 rounded-xl border-emerald-200 bg-white shadow-sm hover:bg-emerald-50",
              sortOrder === "asc" &&
                "border-emerald-500 bg-emerald-50 text-emerald-800",
            )}
            onClick={() => onSortOrderChange("asc")}
          >
            Low → High
          </Button>

          <Button
            variant="outline"
            className={cn(
              "h-11 rounded-xl border-emerald-200 bg-white shadow-sm hover:bg-emerald-50",
              sortOrder === "desc" &&
                "border-emerald-500 bg-emerald-50 text-emerald-800",
            )}
            onClick={() => onSortOrderChange("desc")}
          >
            High → Low
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BusTicketSearchPage({
  isAuthenticated,
  initialSearch,
}: BusTicketSearchPageProps) {
  const router = useRouter();
  const openLogin = useAuthModalStore((state) => state.openLogin);
  const [authenticated, setAuthenticated] = React.useState(isAuthenticated);
  const [isApplyingFilters, setIsApplyingFilters] = React.useState(false);

  const handleApplyFilters = async () => {
    setIsApplyingFilters(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    setMobileFiltersOpen(false);

    setIsApplyingFilters(false);
  };
  const ensureAuthenticated = React.useCallback(async () => {
    if (authenticated) {
      return true;
    }

    const user = await getUser();

    if (user) {
      setAuthenticated(true);
      return true;
    }

    return false;
  }, [authenticated]);

  const {
    search,
    setSearch,
    swapCities,
    results,
    activeTrip,
    seatSheetOpen,
    setSeatSheetOpen,
    availableSeats,
    selectedSeats,
    seatRows,
    bookingSummary,
    setBookingSummary,
    bookingToast,
    setBookingToast,
    loading,
    handleSearch,
    handleScheduleSelect,
    handleSeatToggle,
    handleBook,
    clearSelectedSeats,
    maxSeatsPerBooking,
  } = useBooking({
    ensureAuthenticated,
    onRequireAuth: openLogin,
    initialSearch,
  });

  const autoSearchRef = React.useRef(false);
  const [selectedBusTypes, setSelectedBusTypes] = React.useState<string[]>([]);
  const [operatorQuery, setOperatorQuery] = React.useState("");
  const [departureWindow, setDepartureWindow] =
    React.useState<DepartureWindow>("all");
  const [sortOrder, setSortOrder] = React.useState<"none" | "asc" | "desc">(
    "none",
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    if (autoSearchRef.current) {
      return;
    }

    if (
      !initialSearch.source ||
      !initialSearch.destination ||
      !initialSearch.date
    ) {
      return;
    }

    autoSearchRef.current = true;
    void handleSearch(initialSearch);
  }, [handleSearch, initialSearch]);

  const filteredResults = React.useMemo(() => {
    let nextResults = [...results];

    if (selectedBusTypes.length > 0) {
      nextResults = nextResults.filter((schedule) =>
        selectedBusTypes.includes(getBusClass(schedule)),
      );
    }

    if (operatorQuery.trim()) {
      const query = operatorQuery.trim().toLowerCase();
      nextResults = nextResults.filter((schedule) => {
        const operator = schedule.operator_name?.toLowerCase() || "";
        const busType = schedule.bus_type.toLowerCase();
        const busNumber = schedule.bus_number.toLowerCase();

        return (
          operator.includes(query) ||
          busType.includes(query) ||
          busNumber.includes(query)
        );
      });
    }

    if (departureWindow !== "all") {
      nextResults = nextResults.filter(
        (schedule) =>
          getDepartureWindow(schedule.departure_time) === departureWindow,
      );
    }

    if (sortOrder === "asc") {
      nextResults.sort((left, right) => left.fare - right.fare);
    }

    if (sortOrder === "desc") {
      nextResults.sort((left, right) => right.fare - left.fare);
    }

    return nextResults;
  }, [departureWindow, operatorQuery, results, selectedBusTypes, sortOrder]);

  const busTypeOptions = React.useMemo(() => {
    const hasAc = results.some((schedule) => getBusClass(schedule) === "AC");
    const hasNonAc = results.some(
      (schedule) => getBusClass(schedule) === "Non AC",
    );

    return [hasAc ? "AC" : null, hasNonAc ? "Non AC" : null].filter(
      Boolean,
    ) as string[];
  }, [results]);

  const operatorOptions = React.useMemo(() => {
    const list = results
      .map((schedule) => schedule.operator_name?.trim())
      .filter((value): value is string => Boolean(value));

    return [...new Set(list)].sort((left, right) => left.localeCompare(right));
  }, [results]);

  const departureAvailability = React.useMemo(() => {
    return {
      morning: results.some(
        (schedule) => getDepartureWindow(schedule.departure_time) === "morning",
      ),
      afternoon: results.some(
        (schedule) =>
          getDepartureWindow(schedule.departure_time) === "afternoon",
      ),
      evening: results.some(
        (schedule) => getDepartureWindow(schedule.departure_time) === "evening",
      ),
      night: results.some(
        (schedule) => getDepartureWindow(schedule.departure_time) === "night",
      ),
    };
  }, [results]);

  const resetFilters = () => {
    setSelectedBusTypes([]);
    setOperatorQuery("");
    setDepartureWindow("all");
    setSortOrder("none");
  };

  const toggleBusType = (type: string) => {
    setSelectedBusTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  const showInitialLoading =
    loading.search && results.length === 0 && !bookingSummary;

  return (
    <main className="relative min-h-[calc(100vh-64px)] overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#f8fcf9_0%,#ffffff_44%,#eef4ef_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#08111f_0%,#0f172a_46%,#111827_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-emerald-300/18 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-slate-200/35 blur-3xl dark:bg-slate-700/12" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl dark:bg-slate-600/10" />
      </div>

      <section className="relative">
        <BookingToast
          visible={bookingToast.visible}
          bookingId={bookingToast.id}
          onViewTicket={() => {
            if (bookingToast.id) {
              router.push(`/booking/${bookingToast.id}`);
            }
          }}
          onClose={() => setBookingToast({ visible: false, id: null })}
        />

        <div className="xl:mx-auto max-w-6xl mx-3 sm:mx-6 md:mx-8 py-5">
          <MiniSearchForm
            search={search}
            onSearchChange={setSearch}
            onSwapCities={swapCities}
            onSubmitSearch={handleSearch}
            loading={loading.search}
          />
        </div>

        {bookingSummary ? (
          <div className="mt-6">
            <BookingSummary
              bookingSummary={bookingSummary}
              onDismiss={() => setBookingSummary(null)}
            />
          </div>
        ) : null}

        <div className="mb-5 bg-emerald-600/90 px-4 py-3 text-white shadow-[0_10px_30px_rgba(22,163,74,0.25)] dark:bg-emerald-800/80 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 font-sans text-xs font-semibold tracking-wide sm:text-sm mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <span className="text-white">Choose a Bus</span>
            <span className="text-emerald-100">›</span>
            <span className="text-emerald-50/90">Select Seats</span>
            <span className="text-emerald-100">›</span>
            <span className="text-emerald-50/90">Review &amp; Confirm</span>
          </div>
        </div>

        <div className="max-w-6xl mt-6 mx-4 sm:mx-6 md:mx-8 xl:mx-auto">
          {showInitialLoading ? (
            <section className="mx-auto max-w-6xl space-y-4 px-0 lg:px-0">
              <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur lg:hidden dark:border-slate-700/50 dark:bg-slate-900/80">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-3.5 w-20 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                </div>
                <Skeleton className="h-9 w-24 rounded-xl bg-emerald-100/80 dark:bg-slate-700/80" />
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-700/50 dark:bg-slate-900/80">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-9 w-28 rounded-xl bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="h-9 w-28 rounded-xl bg-slate-200/80 dark:bg-slate-700/80" />
                  <Skeleton className="ml-auto h-8 w-28 rounded-full bg-emerald-100/80 dark:bg-slate-700/60" />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="hidden lg:block sticky top-24 self-start rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur space-y-5 dark:border-slate-700/50 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-4 dark:border-slate-700/50">
                    <Skeleton className="h-3 w-16 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                    <Skeleton className="h-7 w-14 rounded-xl bg-slate-200/60 dark:bg-slate-700/60" />
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 space-y-3 dark:border-slate-700/40 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                        <Skeleton className="h-4 w-4 rounded bg-slate-200/60 dark:bg-slate-700/60" />
                      </div>
                    </div>
                  ))}
                </aside>

                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 px-5 shadow-sm backdrop-blur dark:border-slate-700/50 dark:bg-slate-900/80"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-2xl bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-5 w-36 rounded-full bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-4 w-10 rounded-full bg-emerald-100/80 dark:bg-slate-700/60" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-3 w-28 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                          <Skeleton className="h-3 w-24 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="space-y-1.5">
                          <Skeleton className="h-7 w-20 rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-3 w-12 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                        </div>
                        <div className="flex min-w-[90px] flex-col items-center gap-1">
                          <Skeleton className="h-3 w-10 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                          <div className="flex w-full items-center gap-1">
                            <Skeleton className="h-0.5 flex-1 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                            <Skeleton className="h-7 w-7 rounded-full bg-emerald-100/80 dark:bg-slate-700/80" />
                            <Skeleton className="h-0.5 flex-1 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Skeleton className="h-7 w-20 rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-3 w-12 rounded-full bg-slate-200/60 dark:bg-slate-700/60" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-4 lg:hidden dark:border-slate-700/40">
                        <Skeleton className="h-7 w-20 rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
                        <div className="flex flex-col items-end gap-1">
                          <Skeleton className="h-9 w-28 rounded-xl bg-emerald-100/80 dark:bg-emerald-800/60" />
                          <Skeleton className="h-3 w-20 rounded-full bg-slate-200/50 dark:bg-slate-700/50" />
                        </div>
                      </div>

                      <div className="hidden lg:flex lg:justify-between lg:items-center lg:border-t lg:border-slate-200/70 lg:mt-4 lg:pt-4 dark:lg:border-slate-700/40">
                        <div />
                        <div className="flex flex-col items-end gap-2">
                          <Skeleton className="h-7 w-20 rounded-lg bg-slate-200/80 dark:bg-slate-700/80" />
                          <Skeleton className="h-9 w-28 rounded-xl bg-emerald-100/80 dark:bg-emerald-800/60" />
                          <Skeleton className="h-3 w-20 rounded-full bg-slate-200/50 dark:bg-slate-700/50" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-emerald-200/70 bg-white/90 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/80">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                    Search filters
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {filteredResults.length} bus(es) found
                  </p>
                </div>

                <Button
                  type="button"
                  className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
                <aside
                  className="
                  hidden lg:block
                  sticky top-24 self-start

                  w-full
                  min-w-0

                  space-y-5
                  rounded-2xl
                  border border-slate-200/70
                  bg-white/90
                  p-4 sm:p-5

                  shadow-sm backdrop-blur
                  dark:border-slate-800 dark:bg-slate-950/80
                "
                >
                  <FilterPanel
                    busTypeOptions={busTypeOptions}
                    selectedBusTypes={selectedBusTypes}
                    operatorQuery={operatorQuery}
                    operatorOptions={operatorOptions}
                    departureWindow={departureWindow}
                    departureAvailability={departureAvailability}
                    sortOrder={sortOrder}
                    onToggleBusType={toggleBusType}
                    onOperatorQueryChange={setOperatorQuery}
                    onDepartureWindowChange={setDepartureWindow}
                    onSortOrderChange={setSortOrder}
                    onResetFilters={resetFilters}
                  />
                </aside>
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200/70 bg-white/90 p-4 py-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex flex-wrap items-center gap-3 ">
                      <Button
                        variant="outline"
                        className="h-8 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setSortOrder("asc")}
                      >
                        LOW TO HIGH
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setSortOrder("desc")}
                      >
                        HIGH TO LOW
                      </Button>
                      <div className="ml-auto rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
                        {filteredResults.length} bus(es) found
                      </div>
                    </div>
                  </div>

                  {filteredResults.length === 0 ? (
                    <Card className="border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-emerald-900/30">
                      <CardContent className="flex items-center gap-3 py-6 text-sm text-slate-600 dark:text-slate-400">
                        <Clock3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        No buses match the selected filters.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredResults.map((schedule) => {
                        const isActive = activeTrip?.trip_id === schedule.trip_id;

                        return (
                          <BusResultCard
                            key={schedule.trip_id}
                            schedule={schedule}
                            isActive={isActive}
                            availableSeatsCount={
                              isActive ? availableSeats.length : null
                            }
                            loadingSeats={loading.seats}
                            onSelect={(selectedSchedule) =>
                              void handleScheduleSelect(selectedSchedule)
                            }
                            searchDate={search.date}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <Sheet
                open={mobileFiltersOpen}
                onOpenChange={setMobileFiltersOpen}
              >
                <SheetContent
                  side="right"
                  showCloseButton={false}
                  className="
                    w-[88%]
                    max-w-sm
                    border-l
                    border-emerald-100
                    bg-white/95
                    p-0
                    backdrop-blur-xl
                    dark:border-slate-800
                    dark:bg-slate-950/95
                    flex
                    flex-col
                  "
                >
                  <div className="flex h-full flex-col">
                    <SheetHeader
                      className="
                        border-b
                        border-emerald-100
                        px-5
                        py-4
                        dark:border-slate-800
                        sticky
                        top-0
                        z-10
                        bg-white/90
                        backdrop-blur-xl
                        dark:bg-slate-950/90
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <SheetTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                            Filter buses
                          </SheetTitle>

                          <SheetDescription className="text-sm text-slate-500 dark:text-slate-400">
                            Customize your bus search experience.
                          </SheetDescription>
                        </div>

                        <SheetClose asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="
                              rounded-full
                              text-slate-500
                              hover:bg-emerald-50
                              hover:text-emerald-600
                              dark:hover:bg-slate-800
                            "
                          >
                            <span className="text-2xl leading-none">×</span>
                          </Button>
                        </SheetClose>
                      </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-5 py-5">
                      <FilterPanel
                        busTypeOptions={busTypeOptions}
                        selectedBusTypes={selectedBusTypes}
                        operatorQuery={operatorQuery}
                        operatorOptions={operatorOptions}
                        departureWindow={departureWindow}
                        departureAvailability={departureAvailability}
                        sortOrder={sortOrder}
                        onToggleBusType={toggleBusType}
                        onOperatorQueryChange={setOperatorQuery}
                        onDepartureWindowChange={setDepartureWindow}
                        onSortOrderChange={setSortOrder}
                        onResetFilters={resetFilters}
                        compact
                      />
                    </div>

                    <div className="border-t mr-3 p-3">
                      <Button
                        disabled={isApplyingFilters}
                        className="
                          w-full
                          rounded-xl
                          bg-emerald-600
                          text-white
                          hover:bg-emerald-700
                          disabled:opacity-90
                        "
                        onClick={handleApplyFilters}
                      >
                        {isApplyingFilters ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="
                                h-4
                                w-4
                                animate-spin
                                rounded-full
                                border-2
                                border-white/30
                                border-t-white
                              "
                            />
                            Applying...
                          </div>
                        ) : (
                          "Apply Filters"
                        )}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>

        <SeatSheet
          open={seatSheetOpen}
          onClose={() => setSeatSheetOpen(false)}
          activeTrip={activeTrip}
          selectedSeats={selectedSeats}
          availableSeatsCount={availableSeats.length}
          seatRows={seatRows}
          bookingSummary={bookingSummary}
          maxSeatsPerBooking={maxSeatsPerBooking}
          loadingSeats={loading.seats}
          loadingBooking={loading.booking}
          onToggleSeat={handleSeatToggle}
          onBook={handleBook}
          onClearSelection={clearSelectedSeats}
        />
      </section>
    </main>
  );
}
