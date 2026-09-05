import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { resetToken, password } = validation.data;

    const payload = await verifyResetToken(resetToken);
    if (!payload) {
      return NextResponse.json(
        {
          error:
            "This reset session has expired or is invalid. Please start over.",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: payload.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Internal server error while resetting password." },
      { status: 500 },
    );
  }
}
