import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: feedId } = await params;

    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Please log in to like posts." },
        { status: 401 },
      );
    }

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: "Session expired. Please log in again." },
        { status: 401 },
      );
    }
    const userId = payload.userId;

    // 2. Check if the feed post exists in DB
    const existingFeed = await prisma.feed.findUnique({
      where: { id: feedId },
    });

    if (!existingFeed) {
      // Handle fallback/mock posts gracefully
      const isNumericOrMock =
        !isNaN(Number(feedId)) || String(feedId).startsWith("mock-") || String(feedId).startsWith("feed-");
      if (isNumericOrMock) {
        return NextResponse.json(
          { success: true, likedByMe: true, likes: 1 },
          { status: 200 },
        );
      }
      return NextResponse.json({ message: "Feed not found." }, { status: 404 });
    }

    // 3. Ensure user exists in database to prevent foreign key constraint violations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { message: "User account not found. Please log in again." },
        { status: 401 },
      );
    }

    // 4. Check existing like (for toggling)
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        feedId_userId: {
          feedId: feedId,
          userId: userId,
        },
      },
    });

    let likedByMe: boolean;

    // 5. Database transaction (junction table and counter)
    if (existingLike) {
      // User is Unliking
      await prisma.$transaction([
        prisma.feedLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.feed.update({
          where: { id: feedId },
          data: {
            likesCount: {
              decrement: existingFeed.likesCount > 0 ? 1 : 0,
            },
          },
        }),
      ]);
      likedByMe = false;
    } else {
      // User is Liking
      await prisma.$transaction([
        prisma.feedLike.create({
          data: { feedId, userId },
        }),
        prisma.feed.update({
          where: { id: feedId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      likedByMe = true;
    }

    // 6. Fetch updated count for fresh data
    const updatedFeed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { likesCount: true },
    });
    const finalLikesCount =
      updatedFeed?.likesCount ??
      (likedByMe
        ? existingFeed.likesCount + 1
        : Math.max(0, existingFeed.likesCount - 1));

    return NextResponse.json(
      { success: true, likedByMe, likes: finalLikesCount },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Like Action Error:", error);
    return NextResponse.json(
      { message: "Failed to process like action." },
      { status: 500 },
    );
  }
}
