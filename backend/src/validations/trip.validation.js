import { z } from "zod";

const TRIP_STATUS = ["SCHEDULED", "CANCELLED", "COMPLETED"];

export const listTripsQuerySchema = z.object({
  schedule_id: z
    .string()
    .regex(/^\d+$/, "schedule_id must be a positive integer")
    .transform((v) => Number(v))
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
    .optional(),
  status: z.enum(TRIP_STATUS).optional(),
});

export const updateTripSchema = z
  .object({
    fare: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .refine((v) => Number.isFinite(v) && v >= 0, {
        message: "fare must be a non-negative number",
      })
      .optional(),
    status: z.enum(TRIP_STATUS).optional(),
    actual_departure_time: z
      .string()
      .datetime({ message: "actual_departure_time must be ISO-8601" })
      .nullable()
      .optional(),
    actual_arrival_time: z
      .string()
      .datetime({ message: "actual_arrival_time must be ISO-8601" })
      .nullable()
      .optional(),
    cancelled_reason: z.string().trim().max(255).nullable().optional(),
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

export const cancelTripSchema = z.object({
  cancelled_reason: z.string().trim().max(255).optional().nullable(),
});
