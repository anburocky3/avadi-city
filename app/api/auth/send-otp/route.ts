import { NextResponse } from "next/server";
import { stepContactSchema } from "@/lib/validations/onboarding";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Validate payload against shared schema
    const validation = stepContactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { email, phone } = validation.data;

    // 2. CHECK FOR DUPLICATES: Block if email OR mobile already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email/mobile is already exist in our system" },
        { status: 409 }, // 409 Conflict
      );
    }

    // 3. Set default demo OTP "1234" in development, otherwise random 4 digits
    const isDevMode =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEV_OTP === "true";

    const otp = isDevMode
      ? "1234"
      : Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Save/Update OTP using an atomic transaction
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { email } }),
      prisma.verificationToken.create({
        data: { email, otp, expiresAt },
      }),
    ]);

    console.log(`[DEV ONLY] OTP for ${email} (${phone}): ${otp}`);

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent successfully.",
        // Send the demo code back to the frontend in development mode
        demoOtp: isDevMode ? otp : undefined,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    if (error.message?.includes("pool timeout") || error.code === "P2024") {
      return NextResponse.json(
        {
          error: "Database connection timed out. Please try again in a moment.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error while sending OTP." },
      { status: 500 },
    );
  }
}
