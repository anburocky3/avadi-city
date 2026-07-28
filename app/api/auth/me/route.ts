import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = await verifyAuthToken(token);
    if (!session || !session.userId) {
      cookieStore.delete("avadi_session"); // 👈 Clean up invalid tokens
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
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

    if (!user) {
      cookieStore.delete("avadi_session");
      return NextResponse.json(
        { message: "User no longer exists", user: null },
        { status: 401 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.delete("avadi_session");

    return NextResponse.json(
      { user: null, message: "Database error" },
      { status: 401 },
    );
  }
}
