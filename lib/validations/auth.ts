import * as zod from "zod";

// STEP 1: Email validation
export const forgotPasswordEmailSchema = zod.object({
  email: zod.email({ message: "Enter a valid email address" }),
});

// STEP 2: Create new password validation (prior to OTP)
export const forgotPasswordCreateSchema = zod.object({
  email: zod.email({ message: "Enter a valid email address" }),
  password: zod
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

// STEP 3: Verify the 4-digit OTP sent to that email
export const forgotPasswordOtpSchema = zod.object({
  email: zod.email({ message: "Enter a valid email address" }),
  otp: zod
    .string()
    .length(4, { message: "Please enter the complete 4-digit code" }),
  resetToken: zod.string().min(1, { message: "Missing reset token" }),
});

// Backward compatibility schema
export const resetPasswordSchema = zod.object({
  resetToken: zod.string().min(1, { message: "Missing or invalid reset session" }),
  password: zod
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});
