import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existingFeed = await prisma.feed.findUnique({ where: { id } });

    if (!existingFeed) {
      return NextResponse.json({ message: "Feed not found." }, { status: 404 });
    }

    // Toggle like counter
    const newLikesCount = existingFeed.likesCount + 1;

    const updatedFeed = await prisma.feed.update({
      where: { id },
      data: { likesCount: newLikesCount },
    });

    return NextResponse.json({ success: true, likes: updatedFeed.likesCount });
  } catch (error: any) {
    console.error("Like DB error:", error?.message || error);
    return NextResponse.json(
      { message: "Failed to update like count." },
      { status: 500 },
    );
  }
}
