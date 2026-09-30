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
      return NextResponse.json({ success: true, favoritedShopIds: [] });
    }

    const favorites = await prisma.foodFavorite.findMany({
      where: { userId: session.userId },
      select: { shopId: true },
    });

    const favoritedShopIds = favorites.map((f) => f.shopId);

    return NextResponse.json({
      success: true,
      favoritedShopIds,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to load favorites." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to save your favorite food spots." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.shopId) {
      return NextResponse.json(
        { success: false, message: "Shop ID is required." },
        { status: 400 }
      );
    }

    const stringShopId = String(body.shopId).trim();

    // Check if already favorited
    const existing = await prisma.foodFavorite.findUnique({
      where: {
        shopId_userId: {
          shopId: stringShopId,
          userId: session.userId,
        },
      },
    });

    if (existing) {
      await prisma.foodFavorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        success: true,
        favorited: false,
        message: "Removed from favorites.",
      });
    } else {
      await prisma.foodFavorite.create({
        data: {
          shopId: stringShopId,
          userId: session.userId,
        },
      });
      return NextResponse.json({
        success: true,
        favorited: true,
        message: "Saved to your favorites.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to save this shop. Please try again." },
      { status: 500 }
    );
  }
}
