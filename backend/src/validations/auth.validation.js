import { z } from "zod";

export const googleLoginSchema = z.object({
  idToken: z
    .string()
    .min(10, "Missing or invalid Google idToken")
    .max(4096, "idToken too long"),
});

export const logoutSchema = z.object({}).passthrough();

export const updateAccountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    currentPassword: z.string().max(128).optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must not exceed 128 characters")
      .optional(),
  })
  .refine(
    ({ currentPassword, newPassword }) =>
      Boolean(currentPassword) === Boolean(newPassword),
    {
      message: "Current password and new password are both required",
      path: ["currentPassword"],
    },
  );
