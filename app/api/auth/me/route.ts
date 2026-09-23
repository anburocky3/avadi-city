import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const session = await verifyAuthToken(token);
    if (!session || !session.userId) {
      cookieStore.delete("avadi_session"); // 👈 Clean up invalid tokens
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const isDevMode =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEV_OTP === "true";

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          gender: true,
          avatar: true,
          bloodGroup: true,
          wardNumber: true,
          streetName: true,
          isVerified: true,
        },
      });
    } catch (dbErr) {
      console.warn("DB offline during me check:", dbErr);
    }

    if (!user) {
      if (isDevMode) {
        user = {
          id: session.userId,
          name: session.name || "Avadi Resident",
          email: session.email || "",
          phone: "9876543210",
          gender: "Prefer not to say",
          avatar: "/default-avatar.png",
          bloodGroup: "O_POS",
          wardNumber: session.wardNumber || 14,
          streetName: "Main Road",
          isVerified: true,
        };
      } else {
        cookieStore.delete("avadi_session");
        return NextResponse.json(
          { message: "User no longer exists", user: null },
          { status: 200 },
        );
      }
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { user: null, message: "Database error" },
      { status: 200 },
    );
  }
}
