import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

export const dynamic = "force-dynamic";

// --- VALIDATION SCHEMA ---
const serverListingSchema = zod
  .object({
    type: zod.enum(["EXPLORE_PLACE", "FOOD_DINING", "HEALTHCARE"]),
    name: zod.string().min(3, "Name must be at least 3 characters"),
    subCategory: zod.string().min(1, "Sub-category is required"),
    description: zod
      .string()
      .min(15, "Description must be at least 15 characters"),
    address: zod.string().min(5, "Address must be at least 5 characters"),
    ward: zod.coerce.number().min(1).max(48).optional(),
    timings: zod.string().optional(),
    is24x7: zod.coerce.boolean().optional().default(false),
    phone: zod.string().optional(),
    googleMapsUrl: zod
      .string()
      .url("Maps URL must be a valid URL")
      .optional()
      .or(zod.literal("")),
  })
  .strip();

// GET — Public listing of APPROVED entries, filterable by type & ward
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as
      | "EXPLORE_PLACE"
      | "FOOD_DINING"
      | "HEALTHCARE"
      | null;
    const ward = searchParams.get("ward");

    const where: any = { status: "APPROVED" };
    if (type && ["EXPLORE_PLACE", "FOOD_DINING", "HEALTHCARE"].includes(type)) {
      where.type = type;
    }
    if (ward && ward !== "all") {
      where.ward = parseInt(ward);
    }

    const listings = await prisma.communityListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        name: true,
        subCategory: true,
        description: true,
        address: true,
        ward: true,
        timings: true,
        is24x7: true,
        phone: true,
        imageUrl: true,
        googleMapsUrl: true,
        extraDetails: true,
        createdAt: true,
        submittedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(listings, { status: 200 });
  } catch (error) {
    console.error("Listings GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch listings" },
      { status: 500 },
    );
  }
}

// POST — Authenticated user submits a new listing (multipart/form-data)
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

    // Parse multipart form data
    const formData = await request.formData();

    const rawData = {
      type: formData.get("type")?.toString() ?? "",
      name: formData.get("name")?.toString() ?? "",
      subCategory: formData.get("subCategory")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      address: formData.get("address")?.toString() ?? "",
      ward: formData.get("ward") ?? undefined,
      timings: formData.get("timings")?.toString() || undefined,
      is24x7: formData.get("is24x7")?.toString() ?? "false",
      phone: formData.get("phone")?.toString() || undefined,
      googleMapsUrl: formData.get("googleMapsUrl")?.toString() || undefined,
    };

    const validationResult = serverListingSchema.safeParse(rawData);
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

    const data = validationResult.data;

    // --- Helper: upload a single image File to R2 ---
    const uploadToR2 = async (file: File): Promise<string> => {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const rawExt = file.type.split("/")[1] || "jpg";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      const fileKey = `listings/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: inputBuffer,
          ContentType: file.type,
        }),
      );
      return `${PUBLIC_R2_DOMAIN}/${fileKey}`;
    };

    // --- Upload cover photo (image) → imageUrl column ---
    const rawFile = formData.get("image") as File | null;
    let imageUrl: string | null = null;

    if (rawFile && rawFile.size > 0 && rawFile.type.startsWith("image/")) {
      if (rawFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: "Cover photo must be smaller than 5 MB." },
          { status: 400 },
        );
      }
      imageUrl = await uploadToR2(rawFile);
    }

    // --- Upload inner photo (image2) & board photo (image3) → extraDetails ---
    const extraPhotoUrls: { image2Url?: string; image3Url?: string } = {};
    for (const [slot, key] of [["image2", "image2Url"], ["image3", "image3Url"]] as const) {
      const f = formData.get(slot) as File | null;
      if (f && f.size > 0 && f.type.startsWith("image/")) {
        if (f.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, message: `${slot === "image2" ? "Inner" : "Board"} photo must be smaller than 5 MB.` },
            { status: 400 },
          );
        }
        extraPhotoUrls[key] = await uploadToR2(f);
      }
    }

    // --- Reconstruct extraDetails from flat formData keys ---
    // Client sends: extraDetails[mustTryDishes], extraDetails[priceRange], etc.
    const extraDetails: Record<string, unknown> = { ...extraPhotoUrls };
    for (const [key, value] of formData.entries()) {
      const match = key.match(/^extraDetails\[(.+)\]$/);
      if (match) {
        const field = match[1];
        // Coerce booleans
        if (value === "true") extraDetails[field] = true;
        else if (value === "false") extraDetails[field] = false;
        else extraDetails[field] = value.toString();
      }
    }

    const listing = await prisma.communityListing.create({
      data: {
        type: data.type,
        name: data.name.trim(),
        subCategory: data.subCategory,
        description: data.description.trim(),
        address: data.address.trim(),
        ward: data.ward,
        timings: data.timings || null,
        is24x7: data.is24x7 ?? false,
        phone: data.phone || null,
        imageUrl,
        googleMapsUrl: data.googleMapsUrl || null,
        extraDetails:
          Object.keys(extraDetails).length > 0
            ? (extraDetails as Prisma.InputJsonValue)
            : undefined,
        status: "PENDING",
        submittedById: session.userId,
      },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your listing has been submitted and is pending admin review.",
        listing,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Listings POST error:", error);
    const friendlyMessage =
      error?.code === "P2002"
        ? "A listing with these details already exists."
        : error?.message && !error.message.includes("TURBOPACK") && !error.message.includes("prisma")
        ? error.message
        : "Failed to submit listing. Please try again.";

    return NextResponse.json(
      {
        success: false,
        message: friendlyMessage,
      },
      { status: 500 },
    );
  }
}
