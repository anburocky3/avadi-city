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

async function isUserAdmin(
  session: { userId?: string; email?: string } | null,
): Promise<boolean> {
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
  if (email === "admin@avadi.city" || email?.endsWith("@avadi.city")) {
    return true;
  }

  try {
    const adminRows: any = await prisma.$queryRawUnsafe(
      `SELECT id FROM admins WHERE LOWER(email) = LOWER(?) OR id = ? LIMIT 1`,
      email || "",
      session.userId || "",
    );
    if (Array.isArray(adminRows) && adminRows.length > 0) {
      return true;
    }
  } catch {
    // Admins table query error
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");

    if (!placeId) {
      return NextResponse.json(
        { success: false, message: "placeId is required." },
        { status: 400 },
      );
    }

    const session = await getAuthenticatedUser();
    const currentUserId = session?.userId || null;

    const [reviews, stats] = await Promise.all([
      prisma.placeReview.findMany({
        where: { placeId: String(placeId) },
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
      prisma.placeReview.aggregate({
        where: { placeId: String(placeId) },
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
      placeId: r.placeId,
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
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedUser();
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Please sign in to submit a review." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid review data." },
        { status: 400 },
      );
    }

    const { placeId, rating, reviewText } = body;

    if (
      !placeId ||
      (typeof placeId !== "string" && typeof placeId !== "number")
    ) {
      return NextResponse.json(
        { success: false, message: "Place ID is required." },
        { status: 400 },
      );
    }

    const stringPlaceId = String(placeId).trim();
    const numRating = parseInt(String(rating), 10);

    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5 stars." },
        { status: 400 },
      );
    }

    const cleanReviewText =
      typeof reviewText === "string" ? reviewText.trim() : null;

    if (cleanReviewText && cleanReviewText.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Review text must not exceed 2000 characters.",
        },
        { status: 400 },
      );
    }

    // Check if user already submitted a review for this place (ONE REVIEW PER USER PER PLACE)
    const existingReview = await prisma.placeReview.findUnique({
      where: {
        placeId_userId: {
          placeId: stringPlaceId,
          userId: session.userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already reviewed this place.",
        },
        { status: 400 },
      );
    }

    // Save review
    const review = await prisma.placeReview.create({
      data: {
        placeId: stringPlaceId,
        userId: session.userId,
        rating: numRating,
        reviewText: cleanReviewText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Recompute stats
    const stats = await prisma.placeReview.aggregate({
      where: { placeId: stringPlaceId },
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
      message: "Your review has been submitted successfully.",
      data: {
        review: {
          id: review.id,
          placeId: review.placeId,
          userId: review.userId,
          userName: review.user?.name || "Avadi Resident",
          userAvatar: review.user?.avatar || null,
          rating: review.rating,
          reviewText: review.reviewText,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          isOwn: true,
        },
        stats: {
          averageRating,
          reviewCount,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your review. Please try again.",
      },
      { status: 500 },
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
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid request payload." },
        { status: 400 },
      );
    }

    const { reviewId, rating, reviewText } = body;
    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: "reviewId is required." },
        { status: 400 },
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

    const updated = await prisma.placeReview.update({
      where: { id: String(reviewId) },
      data: updateData,
    });

    const stats = await prisma.placeReview.aggregate({
      where: { placeId: updated.placeId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      message: "Review updated successfully by administrator.",
      data: {
        review: updated,
        stats: {
          averageRating:
            stats._count.id > 0 && stats._avg.rating
              ? Number(stats._avg.rating.toFixed(1))
              : null,
          reviewCount: stats._count.id || 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to update review." },
      { status: 500 },
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
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: "reviewId is required." },
        { status: 400 },
      );
    }

    const targetReview = await prisma.placeReview.findUnique({
      where: { id: reviewId },
    });

    if (!targetReview) {
      return NextResponse.json(
        { success: false, message: "Review not found." },
        { status: 404 },
      );
    }

    await prisma.placeReview.delete({
      where: { id: reviewId },
    });

    const stats = await prisma.placeReview.aggregate({
      where: { placeId: targetReview.placeId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      message: "Review removed successfully by administrator.",
      data: {
        stats: {
          averageRating:
            stats._count.id > 0 && stats._avg.rating
              ? Number(stats._avg.rating.toFixed(1))
              : null,
          reviewCount: stats._count.id || 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to delete review." },
      { status: 500 },
    );
  }
}
