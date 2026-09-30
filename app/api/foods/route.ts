import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

const createFoodSchema = zod.object({
  name: zod.string().trim().min(2, "Shop Name must be at least 2 characters").max(100),
  category: zod.string().trim().optional(),
  cuisines: zod.string().trim().optional(),
  foodTypes: zod.string().trim().optional(),
  otherCategory: zod.string().trim().optional(),
  description: zod.string().trim().min(5, "Shop Description must be at least 5 characters").max(3000),
  address: zod.string().trim().min(3, "Shop Address must be at least 3 characters").max(300),
  ward: zod.coerce.number().int().min(1, "Ward must be between 1 and 48").max(48, "Ward must be between 1 and 48"),
  phone: zod
    .string()
    .trim()
    .min(10, "Contact number must be at least 10 digits")
    .max(15, "Contact number is too long"),
  email: zod
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(zod.literal(""))
    .nullable(),
  openingTime: zod.string().trim().min(1, "Opening Time is required").max(50),
  closingTime: zod.string().trim().min(1, "Closing Time is required").max(50),
  foodType: zod.string().trim().max(100).optional().nullable(),
  priceRange: zod.string().trim().max(50).optional().nullable(),
  website: zod.string().trim().max(200).optional().nullable(),
  socialLink: zod.string().trim().max(200).optional().nullable(),
  areaLandmark: zod.string().trim().max(150).optional().nullable(),
  latitude: zod.coerce.number().optional().nullable(),
  longitude: zod.coerce.number().optional().nullable(),
  additionalDetails: zod.string().trim().max(3000).optional().nullable(),
  isLateNight: zod.coerce.boolean().optional(),
  lateNightStartTime: zod.string().trim().optional().nullable(),
  lateNightEndTime: zod.string().trim().optional().nullable(),
  lateNightDining: zod.coerce.boolean().optional(),
  lateNightTakeaway: zod.coerce.boolean().optional(),
  lateNightDelivery: zod.coerce.boolean().optional(),
  popularItems: zod.string().optional().nullable(),
  homeDelivery: zod.coerce.boolean().optional(),
  takeaway: zod.coerce.boolean().optional(),
  dineIn: zod.coerce.boolean().optional(),
  termsAccepted: zod.coerce.boolean().refine((val) => val === true, {
    message: "Please accept the Terms & Conditions before submitting your shop.",
  }),
});

async function uploadImageFile(file: File | null, folder: string): Promise<string | null> {
  if (!file || file.size === 0 || !file.type.startsWith("image/")) return null;
  const isR2Configured = Boolean(
    BUCKET_NAME &&
    PUBLIC_R2_DOMAIN &&
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  );

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (isR2Configured) {
    try {
      const rawExt = file.type.split("/")[1] || "jpg";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      const fileKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      return `${PUBLIC_R2_DOMAIN}/${fileKey}`;
    } catch {
      return `data:${file.type};base64,${buffer.toString("base64")}`;
    }
  } else {
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wardParam = searchParams.get("ward");

    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let userId: string | null = null;

    if (token) {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        userId = session.userId;
      }
    }

    const whereClause: any = {
      status: "APPROVED",
    };

    if (wardParam) {
      const wardNum = parseInt(wardParam, 10);
      if (!isNaN(wardNum)) {
        whereClause.ward = wardNum;
      }
    }

    const [listings, reviewStats] = await Promise.all([
      prisma.foodListing.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      }),
      prisma.foodReview.groupBy({
        by: ["shopId"],
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const reviewMap = new Map<string, { rating: number | null; count: number }>();
    for (const stat of reviewStats) {
      reviewMap.set(stat.shopId, {
        rating: stat._avg.rating !== null ? Number(stat._avg.rating.toFixed(1)) : null,
        count: stat._count.id || 0,
      });
    }

    const enrichedListings = listings.map((listing) => {
      let meta: any = {};
      if (listing.additionalDetails) {
        try {
          meta = JSON.parse(listing.additionalDetails);
        } catch {
          meta = {};
        }
      }

      const rev = reviewMap.get(listing.id);

      return {
        ...listing,
        rating: rev?.rating ?? null,
        reviewCount: rev?.count ?? 0,
        cuisines: meta.cuisines || null,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        popularItems: meta.popularItems || [],
        isLateNight: meta.isLateNight || Boolean(listing.closingTime?.toLowerCase().includes("midnight") || listing.closingTime?.toLowerCase().includes("am")),
        lateNightStartTime: meta.lateNightStartTime || null,
        lateNightEndTime: meta.lateNightEndTime || null,
        homeDelivery: meta.homeDelivery ?? false,
        takeaway: meta.takeaway ?? false,
        dineIn: meta.dineIn ?? true,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedListings,
      reviewStats: Object.fromEntries(reviewMap),
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to fetch food listings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user from session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to submit a shop." },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required to submit a shop." },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();

    const rawData = {
      name: formData.get("name")?.toString() || "",
      category: formData.get("category")?.toString() || undefined,
      cuisines: formData.get("cuisines")?.toString() || undefined,
      foodTypes: formData.get("foodTypes")?.toString() || undefined,
      otherCategory: formData.get("otherCategory")?.toString() || undefined,
      description: formData.get("description")?.toString() || "",
      address: formData.get("address")?.toString() || "",
      ward: formData.get("ward"),
      phone: formData.get("phone")?.toString() || "",
      email: formData.get("email")?.toString() || null,
      openingTime: formData.get("openingTime")?.toString() || "",
      closingTime: formData.get("closingTime")?.toString() || "",
      foodType: formData.get("foodType")?.toString() || null,
      priceRange: formData.get("priceRange")?.toString() || null,
      website: formData.get("website")?.toString() || null,
      socialLink: formData.get("socialLink")?.toString() || null,
      areaLandmark: formData.get("areaLandmark")?.toString() || null,
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
      additionalDetails: formData.get("additionalDetails")?.toString() || null,
      isLateNight: formData.get("isLateNight") === "true",
      lateNightStartTime: formData.get("lateNightStartTime")?.toString() || null,
      lateNightEndTime: formData.get("lateNightEndTime")?.toString() || null,
      lateNightDining: formData.get("lateNightDining") === "true",
      lateNightTakeaway: formData.get("lateNightTakeaway") === "true",
      lateNightDelivery: formData.get("lateNightDelivery") === "true",
      popularItems: formData.get("popularItems")?.toString() || null,
      homeDelivery: formData.get("homeDelivery") === "true",
      takeaway: formData.get("takeaway") === "true",
      dineIn: formData.get("dineIn") === "true",
      termsAccepted: formData.get("termsAccepted") === "true",
    };

    const parsed = createFoodSchema.safeParse(rawData);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json(
        {
          success: false,
          message: firstErrorMessage,
          errors: fieldErrors,
        },
        { status: 400 }
      );
    }

    const valid = parsed.data;

    // 3. Process Required Images (Shop Image & Menu Card Image)
    const rawImage = formData.get("image") as File | null;
    const rawMenuCard = formData.get("menuCardImage") as File | null;

    if (!rawImage || rawImage.size === 0) {
      return NextResponse.json(
        { success: false, message: "Shop Image is mandatory." },
        { status: 400 }
      );
    }

    if (!rawMenuCard || rawMenuCard.size === 0) {
      return NextResponse.json(
        { success: false, message: "Menu Card Image is mandatory." },
        { status: 400 }
      );
    }

    const finalImageUrl = await uploadImageFile(rawImage, "food-shops");
    const finalMenuCardUrl = await uploadImageFile(rawMenuCard, "food-menus");

    // Resolve category, foodType, and description representation
    const finalCategory =
      valid.category ||
      (valid.cuisines ? valid.cuisines.split(",")[0]?.trim() : "Restaurant");
    const finalFoodType = valid.foodType || valid.foodTypes || "Both Veg & Non-Veg";
    const finalDescription = valid.description;

    const cleanAddr = (valid.address || "").replace(/^,\s*/, "").trim();
    const cleanLandmark = (valid.areaLandmark || "").trim();
    const resolvedAddress =
      cleanAddr && cleanLandmark && !cleanAddr.toLowerCase().includes(cleanLandmark.toLowerCase())
        ? `${cleanAddr}, ${cleanLandmark}`
        : cleanAddr || cleanLandmark || `Ward ${valid.ward}, Avadi`;
    const resolvedWebsite = valid.website || valid.socialLink || null;

    // Parse popular items
    let parsedPopularItems: string[] = [];
    if (valid.popularItems) {
      try {
        const parsedArr = JSON.parse(valid.popularItems);
        if (Array.isArray(parsedArr)) {
          parsedPopularItems = parsedArr.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        parsedPopularItems = valid.popularItems.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    // Pack rich metadata into structured JSON in additionalDetails
    const structuredMeta = {
      cuisines: valid.cuisines,
      foodTypes: valid.foodTypes,
      menuCardUrl: finalMenuCardUrl,
      email: valid.email,
      popularItems: parsedPopularItems,
      isLateNight: valid.isLateNight || false,
      lateNightStartTime: valid.isLateNight ? valid.lateNightStartTime : null,
      lateNightEndTime: valid.isLateNight ? valid.lateNightEndTime : null,
      lateNightDining: valid.isLateNight ? Boolean(valid.lateNightDining) : false,
      lateNightTakeaway: valid.isLateNight ? Boolean(valid.lateNightTakeaway) : false,
      lateNightDelivery: valid.isLateNight ? Boolean(valid.lateNightDelivery) : false,
      homeDelivery: valid.homeDelivery || false,
      takeaway: valid.takeaway || false,
      dineIn: valid.dineIn || false,
      socialLink: valid.socialLink,
      areaLandmark: valid.areaLandmark,
      latitude: valid.latitude ?? null,
      longitude: valid.longitude ?? null,
    };

    // 4. Save to Database via Prisma (Server forcefully sets status="PENDING" and ownerId=userId)
    const newListing = await prisma.foodListing.create({
      data: {
        name: valid.name,
        category: finalCategory,
        description: finalDescription,
        address: resolvedAddress,
        ward: valid.ward,
        phone: valid.phone,
        imageUrl: finalImageUrl,
        openingTime: valid.openingTime,
        closingTime: valid.closingTime,
        foodType: finalFoodType,
        priceRange: valid.priceRange || "Moderate (₹₹)",
        website: resolvedWebsite,
        additionalDetails: JSON.stringify(structuredMeta),
        ownerId: userId,
        status: "PENDING",
      },
    });

    // 5. Also sync to community_listings if table exists, ensuring existing Admin module retrieves it
    try {
      const timingsFormatted = [valid.openingTime, valid.closingTime].filter(Boolean).join(" – ") || null;
      await prisma.$executeRawUnsafe(
        `INSERT INTO community_listings (
          id, type, name, subCategory, description, address, ward, timings, is24x7,
          phone, imageUrl, extraDetails, status, submittedById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE updatedAt = NOW(3)`,
        newListing.id.substring(0, 30),
        "FOOD_DINING",
        valid.name,
        finalCategory,
        finalDescription,
        valid.address,
        valid.ward,
        timingsFormatted,
        valid.isLateNight ? 1 : 0,
        valid.phone,
        finalImageUrl ? finalImageUrl.substring(0, 191) : null,
        JSON.stringify(structuredMeta),
        "PENDING",
        userId.substring(0, 30)
      );
    } catch {
      // Non-blocking: Primary source of truth is food_listings
    }

    return NextResponse.json(
      {
        success: true,
        message: "Shop submitted successfully! Your shop has been sent for review.",
        data: newListing,
      },
      { status: 201 }
    );
  } catch {
    // Return sanitized friendly error message, never expose technical/database details
    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your shop. Please check your details and try again.",
      },
      { status: 500 }
    );
  }
}
