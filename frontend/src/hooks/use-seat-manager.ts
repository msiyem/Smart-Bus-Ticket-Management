
import React from "react";

import { getAvailableSeats } from "@/action/booking.action";

import { useBookingStore } from "../store/booking.store";

import {
  generateSeatRows,
} from "@/lib/seat-utils";

import { useSeatSelection } from "@/hooks/use-seat-selection";
import type { TripSearchResult } from "@/types/booking";

export const MAX_SEATS_PER_BOOKING = 4;

export function useSeatManager() {
  const {
    activeTrip,
    setActiveTrip,
    availableSeats,
    setAvailableSeats,
    setLoading,
    setStatus,
    setSeatSheetOpen,
  } = useBookingStore();

  const {
    selectedSeats,
    toggleSeat,
    clearSelectedSeats,
  } = useSeatSelection(
    MAX_SEATS_PER_BOOKING,
  );

  const seatRows = React.useMemo(
    () =>
      generateSeatRows(
        activeTrip?.capacity ?? 0,
        availableSeats,
      ),
    [activeTrip, availableSeats],
  );

  const loadAvailableSeatsForTrip =
    React.useCallback(
      async (trip: TripSearchResult) => {
        setLoading((prev) => ({
          ...prev,
          seats: true,
        }));

        clearSelectedSeats();

        setActiveTrip(trip);

        setSeatSheetOpen(true);

        try {
          const response =
            await getAvailableSeats(trip.trip_id);

          if (
            response?.success &&
            Array.isArray(response.data)
          ) {
            setAvailableSeats(response.data);

            setStatus({
              type: "info",
              message: `${response.data.length} seats available.`,
            });
          } else {
            setAvailableSeats([]);

            setStatus({
              type: "error",
              message:
                response?.message ??
                "Failed to load seats.",
            });
          }
        } finally {
          setLoading((prev) => ({
            ...prev,
            seats: false,
          }));
        }
      },
      [
        clearSelectedSeats,
        setActiveTrip,
        setAvailableSeats,
        setLoading,
        setStatus,
        setSeatSheetOpen,
      ],
    );

  return {
    selectedSeats,
    seatRows,
    toggleSeat,
    clearSelectedSeats,
    loadAvailableSeatsForTrip,
  };
}
