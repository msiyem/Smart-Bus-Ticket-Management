import { z } from "zod";

const positiveInt = (msg) =>
  z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, { message: msg });

const optionalPositiveInt = (msg) =>
  z
    .union([z.string(), z.number(), z.null()])
    .transform((v) => (v === null || v === "" ? undefined : Number(v)))
    .refine(
      (v) => v === undefined || (Number.isInteger(v) && v > 0),
      { message: msg },
    )
    .nullish();

const optionalNonNegativeNumber = (msg) =>
  z
    .union([z.string(), z.number(), z.null()])
    .transform((v) => (v === null || v === "" ? undefined : Number(v)))
    .refine(
      (v) => v === undefined || (Number.isFinite(v) && v >= 0),
      { message: msg },
    )
    .nullish();

const optionalIsoDate = (msg) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (v === null || v === "" ? undefined : v))
    .refine(
      (v) =>
        v === undefined ||
        /^\d{4}-\d{2}-\d{2}$/.test(v),
      { message: msg },
    )
    .nullish();

const optionalIsoDateTime = (msg) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (v === null || v === "" ? undefined : v))
    .refine(
      (v) =>
        v === undefined || !Number.isNaN(Date.parse(v)),
      { message: msg },
    )
    .nullish();

const optionalRepeatDays = (msg) =>
  z
    .union([z.string(), z.number(), z.null()])
    .transform((v) => {
      if (v === null || v === "") return undefined;
      const n = Number(v);
      return Number.isInteger(n) ? n : v;
    })
    .refine(
      (v) => v === undefined || (Number.isInteger(v) && v >= 1 && v <= 127),
      { message: msg },
    )
    .nullish();

const optionalStatus = (msg) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (v === null || v === "" ? undefined : v))
    .refine(
      (v) =>
        v === undefined ||
        ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(v),
      { message: msg },
    )
    .nullish();

export const createScheduleSchema = z
  .object({
    route_id: positiveInt("route_id must be a positive integer"),
    bus_id: positiveInt("bus_id must be a positive integer"),
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
    fare: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .refine((v) => Number.isFinite(v) && v >= 0, {
        message: "fare must be a non-negative number",
      }),
    repeat_days: optionalRepeatDays(
      "repeat_days must be an integer between 0 and 127 (bitmask of weekdays)",
    ),
  })
  .refine(
    (data) => Date.parse(data.arrival_time) > Date.parse(data.departure_time),
    {
      message: "arrival_time must be after departure_time",
      path: ["arrival_time"],
    },
  );

export const updateScheduleSchema = z
  .object({
    route_id: optionalPositiveInt("route_id must be a positive integer"),
    bus_id: optionalPositiveInt("bus_id must be a positive integer"),
    departure_time: optionalIsoDateTime(
      "departure_time must be a valid datetime",
    ),
    arrival_time: optionalIsoDateTime(
      "arrival_time must be a valid datetime",
    ),
    fare: optionalNonNegativeNumber("fare must be a non-negative number"),
    status: optionalStatus(
      "status must be one of SCHEDULED, COMPLETED, CANCELLED",
    ),
    repeat_days: optionalRepeatDays(
      "repeat_days must be an integer between 0 and 127 (bitmask of weekdays)",
    ),
  })
  .refine(
    (data) =>
      data.departure_time === undefined ||
      data.arrival_time === undefined ||
      Date.parse(data.arrival_time) > Date.parse(data.departure_time),
    {
      message: "arrival_time must be after departure_time",
      path: ["arrival_time"],
    },
  );

export const searchSchedulesSchema = z.object({
  source: z.string().trim().min(1, "source is required"),
  destination: z.string().trim().min(1, "destination is required"),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
});
