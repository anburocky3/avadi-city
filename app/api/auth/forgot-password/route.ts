import { NextResponse } from "next/server";
import { forgotPasswordEmailSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = forgotPasswordEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const email = validation.data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true },
    });

    // Always respond the same way whether or not the account exists,
    // so the endpoint can't be used to enumerate registered emails.
    const genericResponse = {
      success: true,
      message:
        "If an account exists for that email, a verification code has been sent.",
    };

    if (!user) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Same dev/prod OTP convention used by /api/auth/send-otp
    const isDevMode =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEV_OTP === "true";

    const otp = isDevMode
      ? "1234"
      : Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { email } }),
      prisma.verificationToken.create({
        data: { email, otp, expiresAt },
      }),
    ]);

    // TODO: wire up a real transactional email provider here.
    // No mailer is configured in this project yet, so we log it the
    // same way /api/auth/send-otp does for local/demo use.
    console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);

    return NextResponse.json(
      { ...genericResponse, demoOtp: isDevMode ? otp : undefined },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    if (error.message?.includes("pool timeout") || error.code === "P2024") {
      return NextResponse.json(
        {
          error: "Database connection timed out. Please try again in a moment.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error while requesting password reset." },
      { status: 500 },
    );
  }
}
