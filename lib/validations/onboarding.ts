import * as zod from "zod";

export const stepOneSchema = zod.object({
  name: zod
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  gender: zod.enum(["Male", "Female", "Other"], {
    error: () => ({ message: "Please select your gender" }),
  }),
  dob: zod
    .string()
    .min(1, { message: "Date of birth is required" })
    .refine((date) => new Date(date) <= new Date(), {
      message: "Date of birth cannot be in the future",
    }),
  bloodGroup: zod.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    error: () => ({ message: "Please select your blood group" }),
  }),
});

export const stepTwoSchema = zod.object({
  phone: zod.string().regex(/^[6-9]\d{9}$/, {
    message: "Enter a valid 10-digit Indian mobile number",
  }),
  email: zod.string().email({ message: "Enter a valid email address" }),
});

export const stepOtpSchema = zod.object({
  email: zod.string().email(),
  otp: zod
    .string()
    .length(4, { message: "Please enter the complete 4-digit code" }),
});

export const stepWardSchema = zod.object({
  wardNumber: zod.number().min(1, { message: "Please select your Ward" }),
  streetName: zod
    .string()
    .min(3, { message: "Street name must be at least 3 characters" })
    .max(100, { message: "Street name is too long" }),
});

// Master schema combining all screens + notification preference for the final database save
export const completeOnboardingSchema = stepOneSchema
  .merge(stepTwoSchema)
  .merge(stepWardSchema)
  .extend({
    notification_enabled: zod.boolean().default(false),
  });

export type CompleteOnboardingPayload = zod.infer<
  typeof completeOnboardingSchema
>;
