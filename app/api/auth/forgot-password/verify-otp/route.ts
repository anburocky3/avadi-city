import { NextResponse } from "next/server";
import { forgotPasswordOtpSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = forgotPasswordOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const email = validation.data.email.trim().toLowerCase();
    const { otp, resetToken } = validation.data;

    // Verify session resetToken
    const payload = await verifyResetToken(resetToken);
    if (!payload || payload.email !== email) {
      return NextResponse.json(
        {
          error: "INVALID_SESSION",
          message: "This reset session has expired or is invalid. Please start over.",
          code: "INVALID_SESSION",
        },
        { status: 401 },
      );
    }

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { email_otp: { email, otp } },
    });

    // SECTION 3.B: Incorrect OTP
    if (!tokenRecord) {
      return NextResponse.json(
        {
          error: "INCORRECT_OTP",
          message: "🚫 That OTP missed the target! Check the code and try again.",
          code: "INCORRECT_OTP",
        },
        { status: 400 },
      );
    }

    // SECTION 3.C: Expired OTP
    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        {
          error: "EXPIRED_OTP",
          message: "⏰ This OTP has expired. Request a fresh one and try again.",
          code: "EXPIRED_OTP",
        },
        { status: 400 },
      );
    }

    // Consume single-use OTP
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    // SECTION 2 STEP 4: Only update user password AFTER successful OTP verification
    if (payload.pendingPasswordHash) {
      await prisma.user.update({
        where: { email },
        data: { password: payload.pendingPasswordHash },
      });
    }

    // SECTION 2 STEP 5: Success Response
    return NextResponse.json(
      {
        success: true,
        message:
          "Password changed successfully! 🎉 Your account has a fresh new password.",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Verify Reset OTP Error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 },
    );
  }
}
