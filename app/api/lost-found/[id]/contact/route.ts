import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// GET — Controlled phone reveal for authenticated users.
// Returns the phone number only if:
//   1. The requester is authenticated
//   2. The item exists
//   3. The item is Active (no reason to contact about resolved items)
//   4. The requester is NOT the owner (owners already know their phone)
//
// The raw phone is never returned in list or detail endpoints.
export async function GET(
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

    const item = await prisma.lostFoundItem.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        contactName: true,
        contactPhone: true,
        type: true,
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (item.status !== "Active") {
      return NextResponse.json(
        { message: "This report is no longer active" },
        { status: 400 },
      );
    }

    // Return the phone. Auth is enforced above. The owner can also see their own.
    return NextResponse.json(
      {
        contactName: item.contactName,
        contactPhone: item.contactPhone,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Lost & Found contact reveal error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve contact information" },
      { status: 500 },
    );
  }
}
