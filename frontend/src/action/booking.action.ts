"use server";
import { serverRequest } from "@/action/server-request.action";
import { parseFormData, formatZodErrors } from "@/action/form-data";
import {
  createBookingSchema,
  cancelBookingSchema,
  CreateBookingData,
  CancelBookingData,
} from "@/lib/validations/booking";
import type { BookingTicketDetails } from "@/lib/types";
import type { MyBookingsResponse } from "@/types/booking";

type ActionFailure = {
  success: false;
  message: string;
};

type FormActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; message: string; fieldErrors?: Record<string, string> };

function toFieldErrors(error: unknown): Record<string, string> | undefined {
  if (error && typeof error === "object" && "issues" in (error as Record<string, unknown>)) {
    const issues = (error as { issues: { path: (string | number)[]; message: string }[] }).issues;
    const out: Record<string, string> = {};
    for (const issue of issues) {
      const key = issue.path.join(".");
      if (key && !out[key]) out[key] = issue.message;
    }
    return out;
  }
  return undefined;
}

type CreateBookingResponse =
  | {
      success: true;
      message?: string;
      bookingId: number;
    }
  | ActionFailure;

type AvailableSeatsResponse =
  | {
      success: true;
      message?: string;
      data: string[];
    }
  | ActionFailure;

type BookingDetailsResponse =
  | {
      success: true;
      message?: string;
      data: BookingTicketDetails;
    }
  | ActionFailure;

export const createBooking = async (payload: {
  tripId: number;
  seatNumbers: string[];
  totalAmount?: number;
}): Promise<CreateBookingResponse> => {
  try {
    return await serverRequest<CreateBookingResponse>("bookings", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error creating booking:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create booking";

    return { success: false, message };
  }
};

export const getMyBookings = async (): Promise<
  | {
      success: true;
      data: MyBookingsResponse;
      message?: string;
    }
  | {
      success: false;
      message?: string;
    }
> => {
  try {
    return await serverRequest<
      | {
          success: true;
          data: MyBookingsResponse;
          message?: string;
        }
      | {
          success: false;
          message?: string;
        }
    >("bookings/me", {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching my bookings:", error);
    return { success: false, message: "Failed to fetch my bookings" };
  }
};

export const cancelBooking = async (
  bookingId: number,
): Promise<{ success: boolean; message?: string }> => {
  try {
    return await serverRequest<{ success: boolean; message?: string }>(
      `bookings/${bookingId}/cancel`,
      {
        method: "POST",
        auth: true,
      },
    );
  } catch (error) {
    console.error("Error canceling booking:", error);
    return { success: false, message: "Failed to cancel booking" };
  }
};

export const getAvailableSeats = async (
  tripId: number,
): Promise<AvailableSeatsResponse> => {
  try {
    return await serverRequest<AvailableSeatsResponse>(
      `bookings/available-seats/${tripId}`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.error("Error fetching available seats:", error);
    return { success: false, message: "Failed to fetch available seats" };
  }
};

export const getBookingById = async (
  bookingId: number,
): Promise<BookingDetailsResponse> => {
  try {
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return {
        success: false,
        message: `Invalid booking id: ${String(bookingId)}`,
      };
    }
    return await serverRequest<BookingDetailsResponse>(
      `bookings/${bookingId}`,
      {
        method: "GET",
        auth: true,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch booking details";

    console.error("Error fetching booking details:", error);
    return { success: false, message };
  }
};

export const getBookingsByDay = async (
  date?: string,
): Promise<
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      message?: string;
    }
> => {
  try {
    const qs = date ? `?date=${encodeURIComponent(date)}` : "";

    return await serverRequest(`bookings/admin/day${qs}`, {
      method: "GET",
      auth: true,
    });
  } catch (error) {
    console.error("Error fetching bookings by day:", error);
    return { success: false, message: "Failed to fetch bookings for the day" };
  }
};

export const createBookingFormAction = async (
  _prev: FormActionResult<CreateBookingResponse> | undefined,
  formData: FormData,
): Promise<FormActionResult<CreateBookingResponse>> => {
  let parsed: CreateBookingData;
  try {
    parsed = (await parseFormData(
      formData,
      createBookingSchema,
    )) as CreateBookingData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await createBooking({
    tripId: parsed.tripId,
    seatNumbers: parsed.seatNumbers,
    totalAmount: parsed.totalAmount,
  });

  if (!result.success) {
    return { success: false, message: result.message || "Booking failed" };
  }
  return { success: true, data: result };
};

export const cancelBookingFormAction = async (
  _prev: FormActionResult | undefined,
  formData: FormData,
): Promise<FormActionResult> => {
  let parsed: CancelBookingData;
  try {
    parsed = (await parseFormData(
      formData,
      cancelBookingSchema,
    )) as CancelBookingData;
  } catch (error) {
    const zodError = error as import("zod").ZodError;
    return {
      success: false,
      message: formatZodErrors(zodError),
      fieldErrors: toFieldErrors(zodError),
    };
  }

  const result = await cancelBooking(parsed.bookingId);
  if (!result.success) {
    return { success: false, message: result.message || "Cancel failed" };
  }
  return { success: true, data: result };
};
