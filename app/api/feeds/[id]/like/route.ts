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

    const existingFeed = await prisma.feed.findUnique({
      where: { id: feedId },
    });

    if (!existingFeed) {
      return NextResponse.json({ message: "Feed not found." }, { status: 404 });
    }

    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }
    const userId = payload.userId;

    // 2. Check if the feed post exists
    const feed = await prisma.feed.findUnique({ where: { id: feedId } });
    if (!feed)
      return NextResponse.json({ message: "Feed not found" }, { status: 404 });

    // 3. Check existing like (for toggling)
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        feedId_userId: {
          // Using the @@unique constraint
          feedId: feedId,
          userId: userId,
        },
      },
    });

    let likedByMe: boolean;
    let finalLikesCount: number;

    // 🟢 4. DATABASE TRANSACTION (Handles junction table AND counter)
    if (existingLike) {
      // User is Unliking
      await prisma.$transaction([
        // Delete junction record
        prisma.feedLike.delete({
          where: { id: existingLike.id },
        }),
        // Decrement denormalized counter on Feed
        prisma.feed.update({
          where: { id: feedId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      likedByMe = false;
    } else {
      // User is Liking
      await prisma.$transaction([
        // Create junction record
        prisma.feedLike.create({
          data: { feedId, userId },
        }),
        // Increment denormalized counter on Feed
        prisma.feed.update({
          where: { id: feedId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      likedByMe = true;
    }

    // 5. Fetch updated count for fresh data
    const updatedFeed = await prisma.feed.findUnique({
      where: { id: feedId },
      select: { likesCount: true },
    });
    finalLikesCount = updatedFeed?.likesCount || 0;

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
