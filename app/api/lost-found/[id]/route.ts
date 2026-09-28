import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// GET — Get a single item's public details (no contactPhone)
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
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        // contactPhone excluded — use /contact endpoint with auth
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    // Indicate to client whether this is the viewer's own report
    const isOwner = item.userId === session.userId;

    return NextResponse.json({ ...item, isOwner }, { status: 200 });
  } catch (error) {
    console.error("Lost & Found GET [id] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch item" },
      { status: 500 },
    );
  }
}

// PATCH — Edit own active report
export async function PATCH(
  request: Request,
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

    // Ownership check
    const existing = await prisma.lostFoundItem.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }
    if (existing.userId !== session.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (existing.status === "Resolved") {
      return NextResponse.json(
        { message: "Resolved reports cannot be edited" },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Only allow editing safe fields
    const allowedFields: Record<string, any> = {};
    if (body.title) allowedFields.title = String(body.title).trim();
    if (body.description)
      allowedFields.description = String(body.description).trim();
    if (body.location) allowedFields.location = String(body.location).trim();
    if (body.lostFoundDate)
      allowedFields.lostFoundDate = String(body.lostFoundDate);
    if (body.lostFoundTime)
      allowedFields.lostFoundTime = String(body.lostFoundTime);
    if (body.contactPhone)
      allowedFields.contactPhone = String(body.contactPhone).trim();

    const updated = await prisma.lostFoundItem.update({
      where: { id },
      data: allowedFields,
      select: {
        id: true,
        itemId: true,
        title: true,
        description: true,
        location: true,
        lostFoundDate: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, item: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Lost & Found PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to update item" },
      { status: 500 },
    );
  }
}

// DELETE — Delete own active report (soft: only allowed if Active)
export async function DELETE(
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
    if (existing.userId !== session.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (existing.status === "Resolved") {
      return NextResponse.json(
        { message: "Resolved reports cannot be deleted" },
        { status: 400 },
      );
    }

    await prisma.lostFoundItem.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: "Report deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Lost & Found DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to delete item" },
      { status: 500 },
    );
  }
}
