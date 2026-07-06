import { z } from "zod";

const phoneRegex = /^\+?[0-9 ()\-]{6,20}$/;

const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || phoneRegex.test(v), {
    message: "Invalid phone number",
  })
  .optional()
  .or(z.literal(""));

/**
 * POST /api/operators body
 */
export const createOperatorSchema = z.object({
  owner_user_id: z.coerce
    .number({ message: "owner_user_id is required" })
    .int()
    .positive("owner_user_id must be a positive integer"),
  company_name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name must not exceed 150 characters"),
  contact_email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid contact email")
    .max(255, "Email must not exceed 255 characters"),
  contact_phone: phoneSchema,
  is_active: z
    .union([z.boolean(), z.coerce.number()])
    .transform((v) => (typeof v === "number" ? v !== 0 : Boolean(v)))
    .optional(),
});

export type CreateOperatorData = z.infer<typeof createOperatorSchema>;

/**
 * PATCH /api/operators/:id body — at least one field is required.
 */
export const updateOperatorSchema = z
  .object({
    company_name: z
      .string()
      .trim()
      .min(2, "Company name must be at least 2 characters")
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
      .union([z.boolean(), z.coerce.number()])
      .transform((v) => (typeof v === "number" ? v !== 0 : Boolean(v)))
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

export type UpdateOperatorData = z.infer<typeof updateOperatorSchema>;
