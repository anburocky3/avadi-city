import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const isDevMode =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEV_OTP === "true";

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    } catch (dbErr) {
      console.warn("DB offline during login:", dbErr);
    }

    if (user && user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 },
        );
      }
    } else if (isDevMode) {
      // In dev mode with DB offline, create a dev session
      user = {
        id: "dev-user-" + Date.now(),
        email: email.trim().toLowerCase(),
        name: email.split("@")[0] || "Avadi Resident",
        wardNumber: 14,
        streetName: "Main Road",
      };
    } else {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      wardNumber: user.wardNumber,
    });

    const cookieStore = await cookies();
    cookieStore.set("avadi_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
