import { z } from "zod";

export const createPaymentSchema = z.object({
  booking_id: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v > 0, {
      message: "booking_id must be a positive integer",
    }),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, {
      message: "amount must be a positive number",
    }),
  payment_method: z
    .string()
    .trim()
    .min(2, "payment_method is required")
    .max(50, "payment_method must not exceed 50 characters"),
  transaction_id: z
    .string()
    .trim()
    .min(3, "transaction_id is required")
    .max(100, "transaction_id must not exceed 100 characters"),
});