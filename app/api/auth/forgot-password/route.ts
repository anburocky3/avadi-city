import { NextResponse } from "next/server";
import {
  forgotPasswordEmailSchema,
  forgotPasswordCreateSchema,
} from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signResetToken, verifyResetToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // CASE 1: Resend OTP during verification step
    if (body.resend) {
      const emailValidation = forgotPasswordEmailSchema.safeParse(body);
      if (!emailValidation.success) {
        return NextResponse.json(
          { error: "Invalid email", details: emailValidation.error.flatten() },
          { status: 400 },
        );
      }

      const email = emailValidation.data.email.trim().toLowerCase();
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

      console.log(`[DEV ONLY] Resent Password reset OTP for ${email}: ${otp}`);

      return NextResponse.json(
        {
          success: true,
          message: "Verification code resent.",
          demoOtp: isDevMode ? otp : undefined,
        },
        { status: 200 },
      );
    }

    // CASE 2: STEP 2 - User submits New Password (before OTP verification)
    if (body.password) {
      const validation = forgotPasswordCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error.flatten() },
          { status: 400 },
        );
      }

      const email = validation.data.email.trim().toLowerCase();
      const { password } = validation.data;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, password: true },
      });

      // SECTION 2 STEP 3: Detect Previous Password Reuse
      if (user && user.password) {
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
          return NextResponse.json(
            {
              error: "SAME_PASSWORD_REUSE",
              message:
                "😂 Your old password wants a comeback! Give your account something new.",
              code: "SAME_PASSWORD_REUSE",
            },
            { status: 400 },
          );
        }
      }

      // Hash the pending new password (never stored permanently until OTP verification)
      const pendingPasswordHash = await bcrypt.hash(password, 10);

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

      console.log(`[DEV ONLY] Password reset OTP for ${email}: ${otp}`);

      // Encode email & pendingPasswordHash in a cryptographically signed reset token
      const resetToken = await signResetToken(email, pendingPasswordHash);

      return NextResponse.json(
        {
          success: true,
          message: "Verification code sent.",
          resetToken,
          demoOtp: isDevMode ? otp : undefined,
        },
        { status: 200 },
      );
    }

    // CASE 3: STEP 1 - Validate Email format & initiate reset flow
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

    return NextResponse.json(
      {
        success: true,
        email,
        message: "Email verified. Proceed to set your new password.",
      },
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
      { error: "Internal server error while processing request." },
      { status: 500 },
    );
  }
}
