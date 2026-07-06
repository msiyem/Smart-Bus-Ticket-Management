import { z } from "zod";

/**
 * Mirrors backend `createUserAdminSchema`.
 * Used by the admin "Create User" form driven by react-hook-form + zodResolver.
 */
export const createUserAdminSchema = z
  .object({
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
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message:
          "Username can only contain letters, numbers, underscores, and hyphens",
      })
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address")
      .max(255, "Email must not exceed 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password must not exceed 128 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
          "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      }),
    confirmPassword: z.string().min(1, "Please confirm the password"),
    address: z
      .string()
      .trim()
      .min(2, "Address is too short")
      .max(255, "Address must not exceed 255 characters"),
    role: z.enum(["user", "admin", "operator"], {
      message: "role must be user, admin, or operator",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateUserAdminData = z.infer<typeof createUserAdminSchema>;
