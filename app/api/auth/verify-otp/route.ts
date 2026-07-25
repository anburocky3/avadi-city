import { NextResponse } from "next/server";
import { stepOtpSchema } from "@/lib/validations/onboarding";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = stepOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { email, otp } = validation.data;

    // Look up token in database
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { email_otp: { email, otp } },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 },
      );
    }

    // Check if expired
    if (new Date() > tokenRecord.expiresAt) {
      await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Clean up token after successful verification
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    return NextResponse.json(
      { success: true, message: "Email verified successfully." },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 },
    );
  }
}
