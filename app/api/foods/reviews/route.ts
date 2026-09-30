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

async function isUserAdmin(session: { userId?: string; email?: string } | null): Promise<boolean> {
  // 1. Check admin cookies if present
  try {
    const cookieStore = await cookies();
    const adminSession =
      cookieStore.get("admin_session")?.value ||
      cookieStore.get("admin_token")?.value;
    if (adminSession) {
      return true;
    }
  } catch {
    // Cookie store read error
  }

  if (!session) return false;

  const email = session.email?.trim().toLowerCase();

  // 2. Direct recognized admin email pattern
  if (email === "admin@avadi.city" || email?.endsWith("@avadi.city")) {
    return true;
  }

  // 3. Check against admins table in database
  try {
    const adminRows: any = await prisma.$queryRawUnsafe(
      `SELECT id FROM admins WHERE LOWER(email) = LOWER(?) OR id = ? LIMIT 1`,
      email || "",
      session.userId || ""
    );
    if (Array.isArray(adminRows) && adminRows.length > 0) {
      return true;
    }
  } catch {
    // If admins table query fails or does not exist
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json(
        { success: false, message: "shopId is required." },
        { status: 400 }
      );
    }

    const session = await getAuthenticatedUser();
    const currentUserId = session?.userId || null;

    const [reviews, stats] = await Promise.all([
      prisma.foodReview.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.foodReview.aggregate({
        where: { shopId },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const reviewCount = stats._count.id || 0;
    const averageRating =
      reviewCount > 0 && stats._avg.rating !== null
        ? Number(stats._avg.rating.toFixed(1))
        : null;

    const userReview = currentUserId
      ? reviews.find((r) => r.userId === currentUserId) || null
      : null;

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      shopId: r.shopId,
      userId: r.userId,
      userName: r.user?.name || "Avadi Resident",
      userAvatar: r.user?.avatar || null,
      rating: r.rating,
      reviewText: r.reviewText,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isOwn: currentUserId === r.userId,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: formattedReviews,
        stats: {
          averageRating,
          reviewCount,
        },
        userReview: userReview
          ? {
              id: userReview.id,
              rating: userReview.rating,
              reviewText: userReview.reviewText,
              createdAt: userReview.createdAt,
              updatedAt: userReview.updatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to load reviews. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to submit a review." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid review data." },
        { status: 400 }
      );
    }

    const { shopId, rating, reviewText } = body;

    if (!shopId || (typeof shopId !== "string" && typeof shopId !== "number")) {
      return NextResponse.json(
        { success: false, message: "Shop ID is required." },
        { status: 400 }
      );
    }

    const stringShopId = String(shopId).trim();
    const numRating = parseInt(String(rating), 10);

    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const cleanReviewText =
      typeof reviewText === "string" ? reviewText.trim() : null;

    if (cleanReviewText && cleanReviewText.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Review text must not exceed 2000 characters." },
        { status: 400 }
      );
    }

    // Check if user already submitted a review for this shop
    const existingReview = await prisma.foodReview.findUnique({
      where: {
        shopId_userId: {
          shopId: stringShopId,
          userId: session.userId,
        },
      },
    });

    if (existingReview) {
      // Normal users cannot modify/edit reviews once submitted
      const isAdmin = await isUserAdmin(session);
      if (!isAdmin) {
        return NextResponse.json(
          {
            success: false,
            message: "You have already submitted a review for this shop. Reviews cannot be edited once submitted.",
          },
          { status: 403 }
        );
      }
    }

    // Upsert review (allows creation, and admin updates)
    const review = await prisma.foodReview.upsert({
      where: {
        shopId_userId: {
          shopId: stringShopId,
          userId: session.userId,
        },
      },
      update: {
        rating: numRating,
        reviewText: cleanReviewText,
      },
      create: {
        shopId: stringShopId,
        userId: session.userId,
        rating: numRating,
        reviewText: cleanReviewText,
      },
    });

    // Recompute stats
    const stats = await prisma.foodReview.aggregate({
      where: { shopId: stringShopId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const reviewCount = stats._count.id || 0;
    const averageRating =
      reviewCount > 0 && stats._avg.rating !== null
        ? Number(stats._avg.rating.toFixed(1))
        : null;

    return NextResponse.json({
      success: true,
      message: "Your review was submitted successfully.",
      data: {
        review: {
          id: review.id,
          shopId: review.shopId,
          rating: review.rating,
          reviewText: review.reviewText,
          updatedAt: review.updatedAt,
        },
        stats: {
          averageRating,
          reviewCount,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to submit your review. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    const isAdmin = await isUserAdmin(session);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Only administrators can edit reviews.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 }
      );
    }

    const { reviewId, shopId, userId, rating, reviewText } = body;

    let targetReview = null;
    if (reviewId) {
      targetReview = await prisma.foodReview.findUnique({
        where: { id: String(reviewId) },
      });
    } else if (shopId && userId) {
      targetReview = await prisma.foodReview.findUnique({
        where: {
          shopId_userId: {
            shopId: String(shopId),
            userId: String(userId),
          },
        },
      });
    }

    if (!targetReview) {
      return NextResponse.json(
        { success: false, message: "Review not found." },
        { status: 404 }
      );
    }

    const updateData: { rating?: number; reviewText?: string | null } = {};
    if (rating !== undefined) {
      const numRating = parseInt(String(rating), 10);
      if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
        updateData.rating = numRating;
      }
    }
    if (reviewText !== undefined) {
      updateData.reviewText =
        typeof reviewText === "string" ? reviewText.trim() : null;
    }

    const updated = await prisma.foodReview.update({
      where: { id: targetReview.id },
      data: updateData,
    });

    const stats = await prisma.foodReview.aggregate({
      where: { shopId: targetReview.shopId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const reviewCount = stats._count.id || 0;
    const averageRating =
      reviewCount > 0 && stats._avg.rating !== null
        ? Number(stats._avg.rating.toFixed(1))
        : null;

    return NextResponse.json({
      success: true,
      message: "Review updated successfully by administrator.",
      data: {
        review: updated,
        stats: {
          averageRating,
          reviewCount,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to update review." },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    const isAdmin = await isUserAdmin(session);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Only administrators can delete reviews.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");
    const shopId = searchParams.get("shopId");
    const targetUserId = searchParams.get("userId");

    let targetShopId = shopId;

    if (reviewId) {
      const rev = await prisma.foodReview.findUnique({
        where: { id: reviewId },
      });
      if (!rev) {
        return NextResponse.json(
          { success: false, message: "Review not found." },
          { status: 404 }
        );
      }
      targetShopId = rev.shopId;
      await prisma.foodReview.delete({
        where: { id: reviewId },
      });
    } else if (shopId && targetUserId) {
      await prisma.foodReview.deleteMany({
        where: {
          shopId: String(shopId),
          userId: String(targetUserId),
        },
      });
    } else if (shopId) {
      await prisma.foodReview.deleteMany({
        where: {
          shopId: String(shopId),
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "reviewId or shopId is required." },
        { status: 400 }
      );
    }

    let averageRating = null;
    let reviewCount = 0;

    if (targetShopId) {
      const stats = await prisma.foodReview.aggregate({
        where: { shopId: String(targetShopId) },
        _avg: { rating: true },
        _count: { id: true },
      });

      reviewCount = stats._count.id || 0;
      averageRating =
        reviewCount > 0 && stats._avg.rating !== null
          ? Number(stats._avg.rating.toFixed(1))
          : null;
    }

    return NextResponse.json({
      success: true,
      message: "Review removed successfully by administrator.",
      data: {
        stats: {
          averageRating,
          reviewCount,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to remove review." },
      { status: 500 }
    );
  }
}
