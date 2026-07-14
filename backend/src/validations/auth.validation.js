import { z } from "zod";

export const googleLoginSchema = z.object({
  idToken: z
    .string()
    .min(10, "Missing or invalid Google idToken")
    .max(4096, "idToken too long"),
});

export const logoutSchema = z.object({}).passthrough();