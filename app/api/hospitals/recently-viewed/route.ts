import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;
  if (!token) return null;
  const session = await verifyAuthToken(token);
  if (!session?.userId) return null;
  return session;
}

/**
 * GET: Retrieve up to 10 most recently viewed facility IDs for the authenticated user
 */
export async function GET() {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      return NextResponse.json({ success: true, recentFacilityIds: [] });
    }

    const recents = await prisma.healthcareRecentlyViewed.findMany({
      where: { userId: session.userId },
      orderBy: { viewedAt: "desc" },
      take: 10,
      select: { facilityId: true },
    });

    return NextResponse.json({
      success: true,
      recentFacilityIds: recents.map((r) => r.facilityId),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to load recently viewed facilities." },
      { status: 500 }
    );
  }
}

/**
 * POST: Record or update viewed timestamp for a healthcare facility (max 10 retained)
 */
export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      // For anonymous users, recently viewed is tracked in client localStorage
      return NextResponse.json({ success: true, anonymous: true });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.facilityId) {
      return NextResponse.json(
        { success: false, message: "Facility ID is required." },
        { status: 400 }
      );
    }

    const stringFacilityId = String(body.facilityId).trim();

    // Upsert recent view timestamp
    await prisma.healthcareRecentlyViewed.upsert({
      where: {
        facilityId_userId: {
          facilityId: stringFacilityId,
          userId: session.userId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        facilityId: stringFacilityId,
        userId: session.userId,
        viewedAt: new Date(),
      },
    });

    // Prune entries exceeding 10
    const userRecents = await prisma.healthcareRecentlyViewed.findMany({
      where: { userId: session.userId },
      orderBy: { viewedAt: "desc" },
      skip: 10,
      select: { id: true },
    });

    if (userRecents.length > 0) {
      await prisma.healthcareRecentlyViewed.deleteMany({
        where: {
          id: { in: userRecents.map((r) => r.id) },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to record recently viewed facility." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a single facility from recently viewed or clear all
 */
export async function DELETE(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    if (facilityId) {
      // Remove specific facility from user's recently viewed
      await prisma.healthcareRecentlyViewed.deleteMany({
        where: {
          facilityId: String(facilityId).trim(),
          userId: session.userId,
        },
      });
    } else {
      // Clear all recently viewed for this user
      await prisma.healthcareRecentlyViewed.deleteMany({
        where: {
          userId: session.userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to delete recently viewed." },
      { status: 500 }
    );
  }
}
