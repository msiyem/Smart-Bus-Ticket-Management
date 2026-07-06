import { z } from "zod";

export const createPaymentSchema = z.object({
  booking_id: z.coerce
    .number({ message: "booking_id is required" })
    .int()
    .positive("booking_id must be a positive integer"),
  amount: z.coerce
    .number({ message: "amount is required" })
    .positive("amount must be positive"),
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

export type CreatePaymentData = z.infer<typeof createPaymentSchema>;