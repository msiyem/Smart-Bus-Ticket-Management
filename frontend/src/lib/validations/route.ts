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
    distance_km: z.coerce
      .number({ message: "distance is required" })
      .positive("distance must be positive")
      .max(10000, "distance must be 10000 km or less"),
    estimated_duration: z.coerce
      .number({ message: "duration is required" })
      .int("duration must be an integer (minutes)")
      .positive("duration must be positive")
      .max(1440, "duration must be 1440 minutes or less"),
  })
  .refine(
    (data) =>
      data.source_city.toLowerCase() !== data.destination_city.toLowerCase(),
    {
      message: "Source and destination cities must differ",
      path: ["destination_city"],
    },
  );

export type CreateRouteData = z.infer<typeof createRouteSchema>;