import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email)
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { email: true, name: true },
    });

    return NextResponse.json({ exists: !!user, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
