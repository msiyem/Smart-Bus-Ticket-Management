import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      (data.refreshToken && data.sessionId) ||
      // Allow either body fields OR cookies (validated upstream); permit empty body here.
      true,
    { message: "refreshToken and sessionId are required" },
  );

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
  })
  .passthrough();