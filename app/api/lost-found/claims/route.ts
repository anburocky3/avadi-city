import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// GET — List claims for the authenticated user
// ?role=owner  → incoming claims where I am the item owner (my items)
// ?role=requester → outgoing claims I sent
// Optional: ?itemId=xxx to filter by item, ?status=PENDING|ACCEPTED|REJECTED
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await verifyAuthToken(token);
    if (!session?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "owner"; // "owner" | "requester"
    const itemId = searchParams.get("itemId");
    const statusFilter = searchParams.get("status"); // PENDING | ACCEPTED | REJECTED

    const where: any =
      role === "requester"
        ? { requesterId: session.userId }
        : { ownerId: session.userId };

    if (itemId) where.lostFoundItemId = itemId;
    if (statusFilter) where.status = statusFilter;

    const claims = await prisma.lostFoundClaim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        lostFoundItemId: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: { id: true, name: true },
        },
        owner: {
          select: { id: true, name: true },
        },
        item: {
          select: {
            id: true,
            itemId: true,
            title: true,
            type: true,
            category: true,
            imageUrl: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(claims, { status: 200 });
  } catch (error) {
    console.error("Claims GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch claims" },
      { status: 500 },
    );
  }
}

// POST — Send a new claim request
// Body JSON: { lostFoundItemId: string, message: string }
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await verifyAuthToken(token);
    if (!session?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { lostFoundItemId, message } = body;

    if (!lostFoundItemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        {
          message:
            "A description is required (minimum 10 characters) so the owner can verify your claim.",
        },
        { status: 400 },
      );
    }

    // Find the item
    const item = await prisma.lostFoundItem.findUnique({
      where: { id: lostFoundItemId },
      select: { id: true, userId: true, status: true, title: true, type: true },
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

    // Requester cannot be the item owner
    if (item.userId === session.userId) {
      return NextResponse.json(
        { message: "You cannot send a claim request on your own report" },
        { status: 400 },
      );
    }

    // Upsert — if already sent a claim, update the message and reset to PENDING
    const claim = await prisma.lostFoundClaim.upsert({
      where: {
        lostFoundItemId_requesterId: {
          lostFoundItemId: item.id,
          requesterId: session.userId,
        },
      },
      update: {
        message: message.trim(),
        status: "PENDING",
        updatedAt: new Date(),
      },
      create: {
        lostFoundItemId: item.id,
        requesterId: session.userId,
        ownerId: item.userId,
        message: message.trim(),
        status: "PENDING",
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "Claim request sent successfully", claim },
      { status: 201 },
    );
  } catch (error) {
    console.error("Claims POST error:", error);
    return NextResponse.json(
      { message: "Failed to send claim request" },
      { status: 500 },
    );
  }
}
