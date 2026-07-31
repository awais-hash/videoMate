import * as z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");


const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .trim()
    .toLowerCase(),

  email: z.email("Please enter a valid email address").trim().toLowerCase(),

  fullName: z.string().min(3, "Full name must be at least 3 characters long").max(50).trim(),

  password: passwordSchema,
});

const loginSchema = z
  .object({
    email: z.email().trim().toLowerCase().optional(),
    username: z.string().trim().toLowerCase().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username is required",
    path: ["email"],
  });

const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: passwordSchema,
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from the old password",
    path: ["newPassword"],
  });

export const updateUserDetailsSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long").max(50).trim().optional(),
  email: z.email().trim().toLowerCase().optional(),
});

const channelProfileParamsSchema = z.object({
  username: z.string().min(1, "Username is required").trim().toLowerCase(),
});

export{
    registerSchema,
    loginSchema,
    updatePasswordSchema,
    updateUserDetailsSchema,
    channelProfileParamsSchema
}