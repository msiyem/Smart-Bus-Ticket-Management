
import React from "react";

import { getAvailableSeats } from "@/action/booking.action";

import { useBookingStore } from "../store/booking.store";

import {
  generateSeatRows,
} from "@/lib/seat-utils";

import { useSeatSelection } from "@/hooks/use-seat-selection";

export const MAX_SEATS_PER_BOOKING = 4;

export function useSeatManager() {
  const {
    activeSchedule,
    setActiveSchedule,
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
        activeSchedule?.capacity ?? 0,
        availableSeats,
      ),
    [activeSchedule, availableSeats],
  );

  const loadAvailableSeatsForSchedule =
    React.useCallback(
      async (schedule: any) => {
        setLoading((prev) => ({
          ...prev,
          seats: true,
        }));

        clearSelectedSeats();

        setActiveSchedule(schedule);

        setSeatSheetOpen(true);

        try {
          const response =
            await getAvailableSeats(schedule.id);

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
        setActiveSchedule,
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
    loadAvailableSeatsForSchedule,
  };
}
