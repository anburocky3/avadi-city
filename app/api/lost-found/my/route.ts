import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// GET — Fetch all reports belonging to the authenticated user (My Reports)
// Returns both active and resolved. Includes contactPhone for own reports only.
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // "Active" | "Resolved" | null (all)

    const where: any = { userId: session.userId };
    if (statusFilter === "Active" || statusFilter === "Resolved") {
      where.status = statusFilter;
    }

    const items = await prisma.lostFoundItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        itemId: true,
        type: true,
        title: true,
        description: true,
        category: true,
        ward: true,
        location: true,
        lostFoundDate: true,
        lostFoundTime: true,
        imageUrl: true,
        imageUrls: true,
        status: true,
        contactName: true,
        contactPhone: true, // Included for owner's My Reports view
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Lost & Found My Reports GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch your reports" },
      { status: 500 },
    );
  }
}
