import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { BUCKET_NAME, PUBLIC_R2_DOMAIN, r2Client } from "@/lib/r2";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// GET /api/feeds
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const category = searchParams.get("category");

    // 🟢 1. Get current logged-in user ID
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let currentUserId: string | null = null;

    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        currentUserId = payload.userId;
      }
    }

    const feeds = await prisma.feed.findMany({
      where: {
        ...(ward && ward !== "all" ? { ward: String(ward) } : {}),
        ...(category ? { category: { equals: category } } : {}),
      },
      include: {
        author: {
          select: {
            name: true,
            avatar: true,
            wardNumber: true,
            streetName: true,
            isVerified: true,
          },
        },
        comments: {
          include: {
            user: {
              select: { name: true, avatar: true },
            },
          },
          orderBy: { timestamp: "asc" },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
      orderBy: { timestamp: "desc" },
    });

    // Format response so frontend receives expected property names
    const formattedFeeds = feeds.map((feed) => ({
      ...feed,
      authorName: feed.author?.name || "Avadi Resident",
      authorAvatar: feed.author?.avatar || "/default-avatar.png",
      authorWard: feed.author?.wardNumber,
      authorStreet: feed.author?.streetName,
      isAuthorVerified: feed.author?.isVerified || false,
      likes: feed.likesCount,
      // If feed.likes returned an array with at least 1 item, YOU liked this post!
      likedByMe: Array.isArray(feed.likes) && feed.likes.length > 0,
      comments: feed.comments.map((c: any) => ({
        ...c,
        author: c.user?.name || c.author || "Resident",
        authorAvatar: c.user?.avatar || c.authorAvatar || "/default-avatar.png",
      })),
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
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();

    const { text, category, ward, isEmergency, imageUrl: base64Image } = body;

    if (!text && !base64Image) {
      return NextResponse.json(
        { message: "Feed must contain either text or an image." },
        { status: 400 },
      );
    }

    let r2ImageUrl: string | null = null;

    // Convert compressed Base64 Data URL from client into a Buffer and upload to R2
    if (base64Image && base64Image.startsWith("data:image/")) {
      const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const fileKey = `feeds/ward-${ward}/${payload.userId}-${Date.now()}.webp`;

        await r2Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: buffer,
            ContentType: contentType,
          }),
        );

        r2ImageUrl = `${PUBLIC_R2_DOMAIN}/${fileKey}`;
      }
    }

    const newFeed = await prisma.feed.create({
      data: {
        text: text?.trim() || "",
        category: category || "General",
        ward: ward?.toString() || "all",
        isEmergency: Boolean(isEmergency),
        imageUrl: r2ImageUrl,
        authorId: payload.userId,
      },
    });

    return NextResponse.json(newFeed, { status: 201 });
  } catch (error: any) {
    console.error("Create Feed Error:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to publish feed." },
      { status: 500 },
    );
  }
}
