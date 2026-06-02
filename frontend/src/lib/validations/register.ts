import z from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required!")
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must not exceed 255 characters"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long")
    .max(255, "Username must not exceed 255 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
  email: z
  .email("Please inter a valid email")
  .trim()
  .max(255, "Email must not exceed 255 characters")
  .toLowerCase(),

  password:z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),

  confirmPassword:z
  .string(),

  bio: z
  .string()
  .optional(),

  address: z
  .string()
  .min(1, "Address is required")

  
}).refine((data)=>data.password === data.confirmPassword,{
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterSchema = z.infer<typeof registerSchema>