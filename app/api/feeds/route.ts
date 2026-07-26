import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/feeds
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const category = searchParams.get("category");

    const feeds = await prisma.feed.findMany({
      where: {
        ...(ward && ward !== "all" ? { ward: String(ward) } : {}),
        ...(category ? { category: { equals: category } } : {}),
      },
      include: {
        comments: {
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Format response so frontend receives expected property names
    const formattedFeeds = feeds.map((feed) => ({
      ...feed,
      likes: feed.likesCount,
      likedByMe: false, // Updated dynamically if user auth session is attached
    }));

    return NextResponse.json(formattedFeeds, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/feeds error:", error?.message || error);
    return NextResponse.json(
      { message: "Failed to fetch feeds from database." },
      { status: 500 },
    );
  }
}

// POST /api/feeds
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.text || !body.text.trim()) {
      return NextResponse.json(
        { message: "Feed content is required." },
        { status: 400 },
      );
    }

    const newFeed = await prisma.feed.create({
      data: {
        authorName: body.authorName || "Avadi Resident",
        authorAvatar:
          body.authorAvatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
        ward: body.ward ? String(body.ward) : "14",
        text: body.text.trim(),
        imageUrl: body.imageUrl || null,
        isEmergency: Boolean(body.isEmergency),
        category: body.category || "Chit-chat",
      },
      include: {
        comments: true,
      },
    });

    return NextResponse.json(
      { ...newFeed, likes: newFeed.likesCount, likedByMe: false },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/feeds Database Error:", error?.message || error);
    return NextResponse.json(
      { message: "Failed to insert feed into database." },
      { status: 500 },
    );
  }
}
