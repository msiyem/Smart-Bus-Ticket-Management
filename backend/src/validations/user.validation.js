import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    username: z.string().min(3).optional(),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    address: z.string().min(5).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });