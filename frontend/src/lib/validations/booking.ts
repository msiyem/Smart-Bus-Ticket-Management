import { z } from "zod";

export const createBookingSchema = z.object({
  tripId: z.coerce
    .number({ message: "tripId is required" })
    .int()
    .positive("tripId must be a positive integer"),
  seatNumbers: z
    .array(z.string().trim().min(1))
    .min(1, "At least one seat must be selected")
    .max(50, "Cannot book more than 50 seats at once"),
  totalAmount: z.coerce
    .number()
    .nonnegative("totalAmount must be non-negative")
    .optional(),
});

export type CreateBookingData = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  bookingId: z.coerce
    .number({ message: "bookingId is required" })
    .int()
    .positive("bookingId must be a positive integer"),
});

export type CancelBookingData = z.infer<typeof cancelBookingSchema>;