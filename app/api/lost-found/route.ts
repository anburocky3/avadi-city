import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

// --- SERVER-SIDE VALIDATION SCHEMA ---
const serverCreateSchema = zod.object({
  type: zod.enum(["lost", "found"]),
  category: zod.enum([
    "Wallet",
    "Phone",
    "Keys",
    "Pet",
    "Bag",
    "Documents",
    "Jewellery",
    "Other",
  ]),
  title: zod.string().min(5, "Title must be at least 5 characters"),
  description: zod.string().min(10, "Description must be at least 10 characters"),
  ward: zod.coerce.number().min(1).max(48),
  location: zod.string().min(3, "Location must be at least 3 characters"),
  lostFoundDate: zod
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  lostFoundTime: zod.string().optional(),
  contactPhone: zod
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15),
});

// GET — List active Lost & Found items (no private contact info)
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const type = searchParams.get("type"); // "lost" | "found"
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "Active";
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};

    if (ward && ward !== "all") {
      where.ward = parseInt(ward);
    }
    if (type && (type === "lost" || type === "found")) {
      where.type = type;
    }
    if (category) {
      where.category = category;
    }
    if (status === "Active" || status === "Resolved") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }
    if (dateFrom || dateTo) {
      where.lostFoundDate = {};
      if (dateFrom) where.lostFoundDate.gte = dateFrom;
      if (dateTo) where.lostFoundDate.lte = dateTo;
    }

    const items = await prisma.lostFoundItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        itemId: true,
        type: true,
        title: true,
        description: true,
        category: true,
        ward: true,
        location: true,
        lostFoundDate: true,
        lostFoundTime: true,
        imageUrl: true,
        imageUrls: true,
        status: true,
        contactName: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        // contactPhone is intentionally excluded from listing
      },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Lost & Found GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch Lost & Found items" },
      { status: 500 },
    );
  }
}

// POST — Create a new Lost & Found report
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch user for contact name and phone snapshot
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();

    const rawData = {
      type: formData.get("type")?.toString() || "",
      category: formData.get("category")?.toString() || "",
      title: formData.get("title")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      ward: formData.get("ward"),
      location: formData.get("location")?.toString() || "",
      lostFoundDate: formData.get("lostFoundDate")?.toString() || "",
      lostFoundTime: formData.get("lostFoundTime")?.toString() || undefined,
      contactPhone: formData.get("contactPhone")?.toString() || "",
    };

    const validationResult = serverCreateSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const validData = validationResult.data;

    // Process Image (optional — up to 1 image for Lost & Found)
    const rawFile = formData.get("image") as File | null;
    let imageUrl: string | null = null;
    const imageUrls: string[] = [];

    if (rawFile && rawFile.size > 0 && rawFile.type.startsWith("image/")) {
      const inputBuffer = Buffer.from(await rawFile.arrayBuffer());
      const rawExt = rawFile.type.split("/")[1] || "jpg";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      const fileKey = `lost-found/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: inputBuffer,
          ContentType: rawFile.type,
        }),
      );

      imageUrl = `${PUBLIC_R2_DOMAIN}/${fileKey}`;
      imageUrls.push(imageUrl);
    }

    // Generate unique tracking ID
    const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
    const itemId = `LF-${new Date().getFullYear()}-${uniqueNumber}`;

    const newItem = await prisma.lostFoundItem.create({
      data: {
        itemId,
        type: validData.type,
        category: validData.category,
        title: validData.title.trim(),
        description: validData.description.trim(),
        ward: validData.ward,
        location: validData.location.trim(),
        lostFoundDate: validData.lostFoundDate,
        lostFoundTime: validData.lostFoundTime || null,
        imageUrl,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        status: "Active",
        contactName: user.name,
        contactPhone: validData.contactPhone.trim(),
        userId: user.id,
      },
      select: {
        id: true,
        itemId: true,
        type: true,
        title: true,
        category: true,
        ward: true,
        location: true,
        lostFoundDate: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        // contactPhone excluded from response
      },
    });

    return NextResponse.json(
      { success: true, message: "Report submitted successfully", item: newItem },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Lost & Found POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Internal server error while submitting report",
      },
      { status: 500 },
    );
  }
}
