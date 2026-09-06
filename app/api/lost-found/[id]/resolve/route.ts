import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// PATCH — Mark own report as Resolved. Only the owner can do this.
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.lostFoundItem.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Server-side ownership enforcement — no exceptions
    if (existing.userId !== session.userId) {
      return NextResponse.json(
        { message: "Forbidden — only the report owner can resolve it" },
        { status: 403 },
      );
    }

    if (existing.status === "Resolved") {
      return NextResponse.json(
        { message: "Report is already resolved" },
        { status: 400 },
      );
    }

    const updated = await prisma.lostFoundItem.update({
      where: { id },
      data: {
        status: "Resolved",
        resolvedAt: new Date(),
      },
      select: {
        id: true,
        itemId: true,
        status: true,
        resolvedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, item: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Lost & Found resolve error:", error);
    return NextResponse.json(
      { message: "Failed to resolve report" },
      { status: 500 },
    );
  }
}
