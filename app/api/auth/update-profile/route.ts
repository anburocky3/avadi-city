// src/app/api/auth/update-profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken, signAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { name, dob, bloodGroup, gender, phone, email } = body;

    // Update user in Prisma
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name?.trim(),
        dob: dob ? new Date(dob) : undefined,
        bloodGroup,
        gender,
        phone: phone?.trim(),
        email: email?.trim().toLowerCase(),
      },
    });

    // Generate fresh auth token with updated name/email/ward
    const newToken = await signAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      wardNumber: updatedUser.wardNumber,
    });

    cookieStore.set("avadi_session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to update profile." },
      { status: 500 },
    );
  }
}
