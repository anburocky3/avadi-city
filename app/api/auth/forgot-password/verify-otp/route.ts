import { NextResponse } from "next/server";
import { forgotPasswordOtpSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth";

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
    const { otp } = validation.data;

    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { email_otp: { email, otp } },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 },
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // OTP is single-use — consume it now that it's verified
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    // Issue a short-lived token authorizing the password change for this email
    const resetToken = await signResetToken(email);

    return NextResponse.json(
      { success: true, message: "Code verified.", resetToken },
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
