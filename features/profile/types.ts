import type { AuthUser } from "@/features/auth/types";

export type ProfileFormData = Pick<
  AuthUser,
  "name" | "dob" | "bloodGroup" | "gender" | "phone" | "email"
>;
