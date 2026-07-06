import { z } from "zod";

export const createBookingSchema = z.object({
  tripId: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "tripId must be a positive integer",
    }),
  seatNumbers: z
    .array(
      z.union([z.string(), z.number()]).transform((v) => String(v).trim()),
    )
    .min(1, "At least one seat must be selected")
    .max(50, "Cannot book more than 50 seats at once"),
  totalAmount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v >= 0, {
      message: "totalAmount must be a non-negative number",
    })
    .optional(),
});

export const cancelBookingSchema = z.object({
  bookingId: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "bookingId must be a positive integer",
    }),
});