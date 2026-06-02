import React from "react";

import { createBooking, getAvailableSeats } from "@/action/booking.action";

import { useBookingStore } from "../store/booking.store";

type UseBookingActionParams = {
  onRequireAuth: () => void;
  ensureAuthenticated: () => Promise<boolean>;
  selectedSeats: string[];
  clearSelectedSeats: () => void;
};

export function useBookingAction(params: UseBookingActionParams) {
  const {
    activeSchedule,
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

    if (!activeSchedule || params.selectedSeats.length === 0) {
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
      const totalAmount = activeSchedule.fare * params.selectedSeats.length;

      const response = await createBooking({
        scheduleId: activeSchedule.id,
        seatNumbers: params.selectedSeats,
        totalAmount,
      });

      if (response?.success) {
        setBookingSummary({
          bookingId: Number(response.bookingId) || 0,
          schedule: activeSchedule,
          seats: params.selectedSeats,
          totalAmount,
        });

        params.clearSelectedSeats();

        const refreshedSeats = await getAvailableSeats(activeSchedule.id);

        if (refreshedSeats?.success && Array.isArray(refreshedSeats.data)) {
          setAvailableSeats(refreshedSeats.data);
        }

        setBookingToast({
          visible: true,
          id: Number(response.bookingId) || null,
        });

        setStatus({
          type: "success",
          message: "Booking confirmed.",
        });
      } else {
        const message = response?.message ?? "Booking failed.";

        setStatus({
          type: "error",
          message,
        });

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
    activeSchedule,
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
