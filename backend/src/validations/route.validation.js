import { z } from "zod";

export const createRouteSchema = z
  .object({
    source_city: z
      .string()
      .trim()
      .min(2, "Source city is required")
      .max(100, "Source city must not exceed 100 characters"),
    destination_city: z
      .string()
      .trim()
      .min(2, "Destination city is required")
      .max(100, "Destination city must not exceed 100 characters"),
    distance_km: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .refine((v) => Number.isFinite(v) && v > 0 && v <= 10000, {
        message: "distance_km must be a positive number up to 10000",
      }),
    estimated_duration: z
      .union([z.string(), z.number()])
      .transform((v) => Number(v))
      .refine((v) => Number.isInteger(v) && v > 0 && v <= 1440, {
        message: "estimated_duration must be an integer between 1 and 1440 minutes",
      }),
  })
  .refine((data) => data.source_city.toLowerCase() !== data.destination_city.toLowerCase(), {
    message: "Source and destination cities must differ",
    path: ["destination_city"],
  });