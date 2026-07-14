"use client";

import React from "react";

import {
  createBooking,
  getAvailableSeats,
} from "@/action/booking.action";

import { useBookingStore } from "../store/booking.store";

type UseBookingActionParams = {
  onRequireAuth: () => void;
  ensureAuthenticated: () => Promise<boolean>;
  selectedSeats: string[];
  clearSelectedSeats: () => void;
};

export function useBookingAction(params: UseBookingActionParams) {
  const {
    activeTrip,
    setAvailableSeats,
    setBookingSummary,
    setBookingToast,
    setLoading,
    setStatus,
  } = useBookingStore();

  const handleBook = React.useCallback(async () => {
    const isAuthenticated = await params.ensureAuthenticated();

    if (!isAuthenticated) {
      params.onRequireAuth();
      setStatus({
        type: "error",
        message: "Please login to complete the booking.",
      });

      return;
    }

    if (!activeTrip || params.selectedSeats.length === 0) {
      setStatus({
        type: "error",
        message: "Select at least one seat.",
      });

      return;
    }

    setLoading((prev) => ({
      ...prev,
      booking: true,
    }));

    try {
      const totalAmount = activeTrip.fare * params.selectedSeats.length;
      const result = await createBooking({
        tripId: activeTrip.trip_id,
        seatNumbers: params.selectedSeats,
        totalAmount,
      });

      if (result.success) {
        const bookingId = Number(result.bookingId) || 0;

        setBookingSummary({
          bookingId,
          trip: activeTrip,
          seats: params.selectedSeats,
          totalAmount,
        });

        params.clearSelectedSeats();

        const refreshedSeats = await getAvailableSeats(activeTrip.trip_id);

        if (refreshedSeats?.success && Array.isArray(refreshedSeats.data)) {
          setAvailableSeats(refreshedSeats.data);
        }

        setBookingToast({
          visible: true,
          id: bookingId || null,
        });

        setStatus({
          type: "success",
          message: "Booking confirmed.",
        });
      } else {
        const message = result.message || "Booking failed.";
        setStatus({ type: "error", message });

        if (
          message.includes("Access denied") ||
          message.includes("Session expired") ||
          message.toLowerCase().includes("unauthorized")
        ) {
          params.onRequireAuth();
        }
      }
    } finally {
      setLoading((prev) => ({
        ...prev,
        booking: false,
      }));
    }
  }, [
    activeTrip,
    setAvailableSeats,
    setBookingSummary,
    setBookingToast,
    setLoading,
    setStatus,
    params,
  ]);

  return {
    handleBook,
  };
}

export { createBooking };
