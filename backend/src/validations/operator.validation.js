import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()\-]{6,20}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

const addressSchema = z
  .string()
  .trim()
  .max(255, "Address must not exceed 255 characters")
  .optional()
  .or(z.literal(""));

export const createOperatorSchema = z.object({
  owner_user_id: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "owner_user_id must be a positive integer",
    }),
  name: z
    .string()
    .trim()
    .min(2, "Name is required")
    .max(150, "Name must not exceed 150 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(150, "Email must not exceed 150 characters"),
  phone: phoneSchema,
  address: addressSchema,
});

export const updateOperatorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(150, "Name must not exceed 150 characters")
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email")
      .max(150, "Email must not exceed 150 characters")
      .optional(),
    phone: phoneSchema,
    address: addressSchema,
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined ||
      data.address !== undefined,
    { message: "At least one field must be provided" },
  );