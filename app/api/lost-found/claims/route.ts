import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

// GET — List claims for the authenticated user
// ?role=owner  → incoming claims where I am the item owner (my items)
// ?role=requester → outgoing claims I sent
// Optional: ?itemId=xxx to filter by item, ?status=PENDING|ACCEPTED|REJECTED
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await verifyAuthToken(token);
    if (!session?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "owner"; // "owner" | "requester"
    const itemId = searchParams.get("itemId");
    const statusFilter = searchParams.get("status"); // PENDING | ACCEPTED | REJECTED

    const where: any =
      role === "requester"
        ? { requesterId: session.userId }
        : { ownerId: session.userId };

    if (itemId) where.lostFoundItemId = itemId;
    if (statusFilter) where.status = statusFilter;

    const claims = await prisma.lostFoundClaim.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        lostFoundItemId: true,
        message: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: { id: true, name: true },
        },
        owner: {
          select: { id: true, name: true },
        },
        item: {
          select: {
            id: true,
            itemId: true,
            title: true,
            type: true,
            category: true,
            imageUrl: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(claims, { status: 200 });
  } catch (error) {
    console.error("Claims GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch claims" },
      { status: 500 },
    );
  }
}

// POST — Send a new claim request with mandatory proof photo
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await verifyAuthToken(token);
    if (!session?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    let lostFoundItemId = "";
    let message = "";
    let imageFile: File | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      lostFoundItemId = formData.get("lostFoundItemId")?.toString() || "";
      message = formData.get("message")?.toString() || "";
      const rawImage = formData.get("image");
      if (rawImage instanceof File && rawImage.size > 0) {
        imageFile = rawImage;
      }
    } else {
      const body = await request.json();
      lostFoundItemId = body.lostFoundItemId || "";
      message = body.message || "";
    }

    if (!lostFoundItemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        {
          message:
            "A description is required (minimum 10 characters) so the owner can verify your claim.",
        },
        { status: 400 },
      );
    }

    // MANDATORY PROOF PHOTO CHECK
    if (!imageFile) {
      return NextResponse.json(
        {
          message:
            "A clear proof photo is mandatory so the item owner can verify your claim.",
        },
        { status: 400 },
      );
    }

    // Validate image mime type
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "The uploaded proof file must be a valid image." },
        { status: 400 },
      );
    }

    // Upload to Cloudflare R2
    let imageUrl: string | null = null;
    try {
      const inputBuffer = Buffer.from(await imageFile.arrayBuffer());
      const rawExt = imageFile.type.split("/")[1] || "jpg";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      const fileKey = `lost-found-claims/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: inputBuffer,
          ContentType: imageFile.type,
        }),
      );

      imageUrl = `${PUBLIC_R2_DOMAIN}/${fileKey}`;
    } catch (uploadError) {
      console.error("R2 Claim Image Upload Error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload proof image to storage." },
        { status: 500 },
      );
    }

    // Find the item
    const item = await prisma.lostFoundItem.findUnique({
      where: { id: lostFoundItemId },
      select: { id: true, userId: true, status: true, title: true, type: true },
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (item.status !== "Active") {
      return NextResponse.json(
        { message: "This report is no longer active" },
        { status: 400 },
      );
    }

    // Requester cannot be the item owner
    if (item.userId === session.userId) {
      return NextResponse.json(
        { message: "You cannot send a claim request on your own report" },
        { status: 400 },
      );
    }

    // Upsert — if already sent a claim, update the message, imageUrl and reset to PENDING
    const claim = await prisma.lostFoundClaim.upsert({
      where: {
        lostFoundItemId_requesterId: {
          lostFoundItemId: item.id,
          requesterId: session.userId,
        },
      },
      update: {
        message: message.trim(),
        imageUrl,
        status: "PENDING",
        updatedAt: new Date(),
      },
      create: {
        lostFoundItemId: item.id,
        requesterId: session.userId,
        ownerId: item.userId,
        message: message.trim(),
        imageUrl,
        status: "PENDING",
      },
      select: {
        id: true,
        status: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: "Claim request sent successfully", claim },
      { status: 201 },
    );
  } catch (error) {
    console.error("Claims POST error:", error);
    return NextResponse.json(
      { message: "Failed to send claim request" },
      { status: 500 },
    );
  }
}
