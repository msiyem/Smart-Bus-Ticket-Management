import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()\-]{6,20}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

export const createOperatorSchema = z.object({
  owner_user_id: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "owner_user_id must be a positive integer",
    }),
  company_name: z
    .string()
    .trim()
    .min(2, "Company name is required")
    .max(150, "Company name must not exceed 150 characters"),
  contact_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid contact email")
    .max(255, "Email must not exceed 255 characters"),
  contact_phone: phoneSchema,
  is_active: z
    .union([z.boolean(), z.number()])
    .transform((v) => (v ? 1 : 0))
    .optional(),
});

export const updateOperatorSchema = z
  .object({
    company_name: z
      .string()
      .trim()
      .min(2, "Company name is required")
      .max(150, "Company name must not exceed 150 characters")
      .optional(),
    contact_email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid contact email")
      .max(255, "Email must not exceed 255 characters")
      .optional(),
    contact_phone: phoneSchema,
    is_active: z
      .union([z.boolean(), z.number()])
      .transform((v) => (v ? 1 : 0))
      .optional(),
  })
  .refine(
    (data) =>
      data.company_name !== undefined ||
      data.contact_email !== undefined ||
      data.contact_phone !== undefined ||
      data.is_active !== undefined,
    { message: "At least one field must be provided" },
  );
