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

export async function GET() {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      return NextResponse.json({ success: true, recentShopIds: [] });
    }

    const recents = await prisma.foodRecentlyViewed.findMany({
      where: { userId: session.userId },
      orderBy: { viewedAt: "desc" },
      take: 10,
      select: { shopId: true },
    });

    return NextResponse.json({
      success: true,
      recentShopIds: recents.map((r) => r.shopId),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to load recently viewed shops." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      // For anonymous users, recently viewed is tracked in localStorage without error
      return NextResponse.json({ success: true, anonymous: true });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.shopId) {
      return NextResponse.json(
        { success: false, message: "Shop ID is required." },
        { status: 400 }
      );
    }

    const stringShopId = String(body.shopId).trim();

    // Upsert recent view timestamp
    await prisma.foodRecentlyViewed.upsert({
      where: {
        shopId_userId: {
          shopId: stringShopId,
          userId: session.userId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        shopId: stringShopId,
        userId: session.userId,
        viewedAt: new Date(),
      },
    });

    // Prune entries exceeding 10
    const userRecents = await prisma.foodRecentlyViewed.findMany({
      where: { userId: session.userId },
      orderBy: { viewedAt: "desc" },
      skip: 10,
      select: { id: true },
    });

    if (userRecents.length > 0) {
      await prisma.foodRecentlyViewed.deleteMany({
        where: {
          id: { in: userRecents.map((r) => r.id) },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to record recently viewed." },
      { status: 500 }
    );
  }
}
