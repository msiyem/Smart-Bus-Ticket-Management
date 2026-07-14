import { z } from "zod";

export const TRIP_STATUSES = [
  "SCHEDULED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type TripStatusValue = (typeof TRIP_STATUSES)[number];

const iso8601 = z
  .string()
  .min(1, "Timestamp is required")
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be a valid ISO-8601 timestamp",
  });

// At least one mutable field is required.
export const updateTripSchema = z
  .object({
    fare: z.coerce
      .number({ message: "fare must be a number" })
      .nonnegative("fare must be non-negative")
      .optional(),
    status: z.enum(TRIP_STATUSES).optional(),
    actual_departure_time: iso8601.nullable().optional(),
    actual_arrival_time: iso8601.nullable().optional(),
    cancelled_reason: z
      .string()
      .trim()
      .max(255, "Reason must not exceed 255 characters")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.fare !== undefined ||
      data.status !== undefined ||
      data.actual_departure_time !== undefined ||
      data.actual_arrival_time !== undefined ||
      data.cancelled_reason !== undefined,
    { message: "At least one field must be provided" },
  );

export type UpdateTripData = z.infer<typeof updateTripSchema>;

export const cancelTripSchema = z.object({
  cancelled_reason: z
    .string()
    .trim()
    .max(255, "Reason must not exceed 255 characters")
    .nullable()
    .optional(),
});

export type CancelTripData = z.infer<typeof cancelTripSchema>;

export const listTripsQuerySchema = z.object({
  schedule_id: z.coerce
    .number()
    .int()
    .positive("schedule_id must be a positive integer")
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .optional(),
  status: z.enum(TRIP_STATUSES).optional(),
});

export type ListTripsQueryData = z.infer<typeof listTripsQuerySchema>;
