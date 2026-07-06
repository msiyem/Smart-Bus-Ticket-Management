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
  capacity: z.coerce
    .number({ message: "capacity is required" })
    .int("capacity must be an integer")
    .positive("capacity must be positive")
    .max(100, "capacity must be 100 or less"),
  operator_name: z
    .string()
    .trim()
    .min(2, "Operator name is required")
    .max(100, "Operator name must not exceed 100 characters"),
});

export type CreateBusData = z.infer<typeof createBusSchema>;