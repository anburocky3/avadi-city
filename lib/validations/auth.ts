import * as zod from "zod";

// STEP 1: Request a reset code for a registered email
export const forgotPasswordEmailSchema = zod.object({
  email: zod.email({ message: "Enter a valid email address" }),
});

// STEP 2: Verify the 4-digit OTP sent to that email
export const forgotPasswordOtpSchema = zod.object({
  email: zod.email({ message: "Enter a valid email address" }),
  otp: zod
    .string()
    .length(4, { message: "Please enter the complete 4-digit code" }),
});

// STEP 3: Set a new password using the short-lived reset token
export const resetPasswordSchema = zod.object({
  resetToken: zod.string().min(1, { message: "Missing or invalid reset session" }),
  password: zod
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});
