import { z } from "zod";

export const createBusSchema = z.object({
  bus_number: z
    .string()
    .trim()
    .min(2, "Bus number is required")
    .max(50, "Bus number must not exceed 50 characters"),
  bus_type: z
    .string()
    .trim()
    .min(2, "Bus type is required")
    .max(50, "Bus type must not exceed 50 characters"),
  capacity: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0 && v <= 100, {
      message: "capacity must be an integer between 1 and 100",
    }),
  operator_name: z
    .string()
    .trim()
    .min(2, "Operator name is required")
    .max(100, "Operator name must not exceed 100 characters"),
});