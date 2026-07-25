import { NextResponse } from "next/server";
import { completeOnboardingSchema } from "@/lib/validations/onboarding";
import { prisma } from "@/lib/prisma";

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
      wardNumber,
      streetName,
      notification_enabled,
    } = validation.data;

    // 2. Check if phone or email already belongs to an existing registered citizen
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "A citizen with this email or mobile number is already registered.",
        },
        { status: 409 },
      );
    }

    // 3. Save all screens into PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name,
        gender: gender as any, // Maps directly to Prisma Enum
        dob: new Date(dob),
        bloodGroup: (bloodGroupEnumMap[bloodGroup] || bloodGroup) as any, // Transforms "A-" to "A_NEG"
        phone,
        email,
        wardNumber,
        streetName,
        notificationEnabled: notification_enabled,
        isVerified: true, // Marked true since they passed OTP verification in step 3
      },
    });

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
