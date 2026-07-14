import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must not exceed 128 characters");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .max(255, "Email must not exceed 255 characters");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .optional(),
  email: emailSchema,
  password: passwordSchema,
  address: z
    .string()
    .trim()
    .min(2, "Address is too short")
    .max(255, "Address must not exceed 255 characters")
    .optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const createUserAdminSchema = registerSchema
  .extend({
    role: z.enum(["user", "admin", "operator"], {
      errorMap: () => ({ message: "role must be user, admin, or operator" }),
    }),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    // Address is required when admin creates an account on a user's behalf.
    address: z
      .string()
      .trim()
      .min(2, "Address is too short")
      .max(255, "Address must not exceed 255 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });