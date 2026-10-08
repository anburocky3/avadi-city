import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PUBLIC_R2_DOMAIN, r2Client, BUCKET_NAME } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const feed = await prisma.feed.findUnique({ where: { id: id } });
    if (!feed)
      return NextResponse.json({ message: "Feed not found" }, { status: 404 });
    if (feed.authorId !== payload.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { text, category, ward, isEmergency } = body;

    // STRICT BUSINESS RULE: Notice `imageUrl` is intentionally excluded from update data!
    const updatedFeed = await prisma.feed.update({
      where: { id: id },
      data: {
        text: text !== undefined ? text.trim() : feed.text,
        category: category !== undefined ? category : feed.category,
        ward: ward !== undefined ? ward.toString() : feed.ward,
        isEmergency:
          isEmergency !== undefined ? Boolean(isEmergency) : feed.isEmergency,
      },
    });

    return NextResponse.json(updatedFeed, { status: 200 });
  } catch (error: any) {
    console.error("Update Feed Error:", error);
    return NextResponse.json(
      { message: "Failed to update feed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAuthToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const feed = await prisma.feed.findUnique({ where: { id: id } });
    if (!feed)
      return NextResponse.json({ message: "Feed not found" }, { status: 404 });
    if (feed.authorId !== payload.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 1. Delete image from Cloudflare R2 bucket if it exists
    if (feed.imageUrl && feed.imageUrl.startsWith(PUBLIC_R2_DOMAIN)) {
      try {
        const r2Key = feed.imageUrl.replace(`${PUBLIC_R2_DOMAIN}/`, "");
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
          }),
        );
      } catch (r2Error) {
        console.error("Failed to delete R2 feed image:", r2Error);
      }
    }

    // 2. Delete database record
    await prisma.feed.delete({ where: { id: id } });

    return NextResponse.json(
      { success: true, message: "Feed deleted" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Delete Feed Error:", error);
    return NextResponse.json(
      { message: "Failed to delete feed" },
      { status: 500 },
    );
  }
}
