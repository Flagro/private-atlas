import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters"),
  name: z.string().max(100).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
