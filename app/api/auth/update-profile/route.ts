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

    // 1. Destructure all possible profile fields, including ward number & address
    const {
      name,
      dob,
      bloodGroup,
      gender,
      phone,
      email,
      wardNumber,
      streetName,
    } = body;

    // 2. Safely update user in Prisma (only updates fields that are provided)
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name !== undefined ? name?.trim() : undefined,
        dob: dob ? new Date(dob) : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        gender: gender !== undefined ? gender : undefined,
        phone: phone !== undefined ? phone?.trim() : undefined,
        // Safe optional chaining prevents crashes when email is undefined:
        email: email !== undefined ? email?.trim()?.toLowerCase() : undefined,
        // Store ward number and address fields:
        wardNumber: wardNumber !== undefined ? Number(wardNumber) : undefined,
        streetName: streetName !== undefined ? streetName?.trim() : undefined,
      },
    });

    // 3. Generate fresh auth token with updated name/email/ward
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
