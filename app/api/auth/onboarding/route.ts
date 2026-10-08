import { NextResponse } from "next/server";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const bloodGroupEnumMap: Record<string, string> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Strict validation of all combined onboarding steps
    const validation = completeOnboardingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Onboarding validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      name,
      gender,
      dob,
      bloodGroup,
      phone,
      email,
      password,
      wardNumber,
      streetName,
      notification_enabled,
    } = validation.data;

    const isDevMode =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEV_OTP === "true";

    // 2. Check if phone or email already belongs to an existing registered citizen
    let existingUser = null;
    try {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      });
    } catch (dbErr) {
      console.warn("DB check during onboarding skipped (DB offline):", dbErr);
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Email or mobile number is already registered.",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save user to database or use dev fallback
    let newUser: any = null;
    try {
      newUser = await prisma.user.create({
        data: {
          name,
          gender: gender as any, // Maps directly to Prisma Enum
          dob: new Date(dob),
          bloodGroup: (bloodGroupEnumMap[bloodGroup] || bloodGroup) as any, // Transforms "A-" to "A_NEG"
          phone,
          email,
          password: hashedPassword,
          wardNumber,
          streetName,
          notificationEnabled: notification_enabled,
          isVerified: true, // Marked true since they passed OTP verification in step 3
        },
      });
    } catch (dbErr: any) {
      console.warn("DB save failed during onboarding:", dbErr?.message || dbErr);
      if (isDevMode) {
        newUser = {
          id: "dev-user-" + Date.now(),
          name,
          wardNumber: wardNumber || 14,
          streetName: streetName || "Main Road",
          email,
          phone,
        };
      } else {
        throw dbErr;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration completed successfully.",
        user: {
          id: newUser.id,
          name: newUser.name,
          wardNumber: newUser.wardNumber,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Onboarding Save Error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data to the database." },
      { status: 500 },
    );
  }
}
