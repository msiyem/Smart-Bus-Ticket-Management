"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createBooking,
  createBookingFormAction,
  getAvailableSeats,
} from "@/action/booking.action";
import {
  createBookingSchema,
  CreateBookingData,
} from "@/lib/validations/booking";

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

  /**
   * `react-hook-form` is used for the booking step. The form is not rendered
   * (the seat sheet drives seat selection imperatively), so we use it in
   * `mode: "onSubmit"` and call `handleSubmit` programmatically from
   * `handleBook`. Validation runs through the same Zod schema the backend
   * uses, guaranteeing client/server parity.
   */
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<CreateBookingData>({
    resolver: zodResolver(createBookingSchema) as never,
    mode: "onSubmit",
    defaultValues: {
      tripId: 0,
      seatNumbers: [],
    },
  });

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

    /**
     * Wrap `handleSubmit` so we can call it imperatively without a `<form>`.
     * If validation fails, surface the first field error via the global
     * status message (the visible fields in the seat sheet mirror the
     * underlying data, so per-field toasts would be noisy).
     */
    const submit = handleSubmit(
      async () => {
        const totalAmount =
          activeTrip.fare * params.selectedSeats.length;

        const formData = new FormData();
        formData.append("tripId", String(activeTrip.trip_id));
        for (const seat of params.selectedSeats) {
          formData.append("seatNumbers", seat);
        }
        formData.append("totalAmount", String(totalAmount));

        const result = await createBookingFormAction(undefined, formData);

        if (result.success) {
          const booking = result.data as { bookingId?: number };
          const bookingId = Number(booking?.bookingId) || 0;

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

          // Map server-side field errors back to the form so react-hook-form
          // keeps a single source of truth.
          const fieldErrors = result.fieldErrors;
          if (fieldErrors) {
            for (const [key, value] of Object.entries(fieldErrors)) {
              if (key === "tripId" || key === "seatNumbers") {
                setError(key as keyof CreateBookingData, {
                  type: "server",
                  message: value,
                });
              }
            }
          }

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
      },
      (errors) => {
        const firstError =
          errors.seatNumbers?.message ||
          errors.tripId?.message ||
          errors.totalAmount?.message ||
          "Please review the booking details.";

        setStatus({
          type: "error",
          message: firstError,
        });
      },
    );

    try {
      await submit();
    } finally {
      setLoading((prev) => ({
        ...prev,
        booking: isSubmitting ? prev.booking : false,
      }));
    }
  }, [
    activeTrip,
    handleSubmit,
    setError,
    setAvailableSeats,
    setBookingSummary,
    setBookingToast,
    setLoading,
    setStatus,
    isSubmitting,
    params,
  ]);

  return {
    handleBook,
  };
}

// Re-export so existing imports of `createBooking` keep working.
export { createBooking };
