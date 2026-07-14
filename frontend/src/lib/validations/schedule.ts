import { z } from "zod";

const repeatDaysField = z
  .union([
    z.string(),
    z.number(),
    z.undefined(),
    z.null(),
  ])
  .transform((v) => {
    if (v === undefined || v === null || v === "") return 127;
    const n = Number(v);
    return Number.isFinite(n) ? n : 127;
  })
  .refine((v) => Number.isInteger(v) && v >= 0 && v <= 127, {
    message: "repeat_days must be a bitmask 0..127",
  });

export const createScheduleSchema = z
  .object({
    route_id: z.coerce
      .number({ message: "route is required" })
      .int()
      .positive("route is required"),
    bus_id: z.coerce
      .number({ message: "bus is required" })
      .int()
      .positive("bus is required"),
    departure_time: z
      .string()
      .trim()
      .min(1, "departure_time is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "departure_time must be a valid datetime",
      }),
    arrival_time: z
      .string()
      .trim()
      .min(1, "arrival_time is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "arrival_time must be a valid datetime",
      }),
    fare: z.coerce
      .number({ message: "fare is required" })
      .nonnegative("fare must be non-negative"),
    repeat_days: repeatDaysField.optional(),
  })
  .refine(
    (data) => Date.parse(data.arrival_time) > Date.parse(data.departure_time),
    {
      message: "arrival_time must be after departure_time",
      path: ["arrival_time"],
    },
  );

export type CreateScheduleData = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z
  .object({
    route_id: z.coerce.number().int().positive().optional(),
    bus_id: z.coerce.number().int().positive().optional(),
    departure_time: z
      .string()
      .trim()
      .min(1)
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "departure_time must be a valid datetime",
      })
      .optional(),
    arrival_time: z
      .string()
      .trim()
      .min(1)
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "arrival_time must be a valid datetime",
      })
      .optional(),
    fare: z.coerce.number().nonnegative().optional(),
    status: z
      .enum(["SCHEDULED", "COMPLETED", "CANCELLED"])
      .optional(),
    repeat_days: repeatDaysField.optional(),
  })
  .refine(
    (data) => {
      if (
        data.departure_time &&
        data.arrival_time &&
        Date.parse(data.arrival_time) <= Date.parse(data.departure_time)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "arrival_time must be after departure_time",
      path: ["arrival_time"],
    },
  );

export type UpdateScheduleData = z.infer<typeof updateScheduleSchema>;

export const offDaySchema = z.object({
  schedule_id: z.coerce.number().int().positive(),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  mode: z.enum(["off", "on"]).default("off"),
});

export type OffDayData = z.infer<typeof offDaySchema>;

export const searchSchedulesSchema = z.object({
  source: z.string().trim().min(1, "source is required"),
  destination: z.string().trim().min(1, "destination is required"),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
});

export type SearchSchedulesData = z.infer<typeof searchSchedulesSchema>;