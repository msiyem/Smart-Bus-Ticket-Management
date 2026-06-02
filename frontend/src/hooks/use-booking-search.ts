import React from "react";

import { searchSchedules } from "@/action/schedule.action";
import type { SearchState } from "@/types/booking";

import { useBookingStore } from "@/store/booking.store";

export function useBookingSearch() {
  const search = useBookingStore((state) => state.search);
  const setSearch = useBookingStore((state) => state.setSearch);
  const setResults = useBookingStore((state) => state.setResults);
  const setLoading = useBookingStore((state) => state.setLoading);
  const setStatus = useBookingStore((state) => state.setStatus);
  const resetBookingState = useBookingStore((state) => state.resetBookingState);

  const handleSearch = React.useCallback(
    async (searchOverride?: Partial<SearchState>) => {
      const source = searchOverride?.source ?? search.source;
      const destination = searchOverride?.destination ?? search.destination;
      const date = searchOverride?.date ?? search.date;

      if (!source || !destination || !date) {
        setStatus({
          type: "info",
          message: "Enter source, destination and date.",
        });

        return;
      }

      if (searchOverride) {
        setSearch((prev) => ({
          ...prev,
          source,
          destination,
          date,
        }));
      }

      resetBookingState();

      setLoading((prev) => ({
        ...prev,
        search: true,
      }));

      try {
        const response = await searchSchedules({
          source,
          destination,
          date,
        });

        if (response?.success && Array.isArray(response.data)) {
          setResults(response.data);

          if (response.data.length === 0) {
            setStatus({
              type: "info",
              message: "No buses found.",
            });
          }
        } else {
          setResults([]);

          setStatus({
            type: "error",
            message: response?.message ?? "Failed to search schedules.",
          });
        }
      } catch {
        setStatus({
          type: "error",
          message: "Something went wrong.",
        });
      } finally {
        setLoading((prev) => ({
          ...prev,
          search: false,
        }));
      }
    },
    [search, setLoading, setResults, setSearch, setStatus, resetBookingState],
  );

  const swapCities = React.useCallback(() => {
    setSearch((current) => ({
      ...current,
      source: current.destination,
      destination: current.source,
    }));
  }, [setSearch]);

  return {
    handleSearch,
    swapCities,
  };
}
