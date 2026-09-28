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

    if (!shopId || typeof shopId !== "string" && typeof shopId !== "number") {
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

    // Upsert to ensure 1 review per user per shop
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
