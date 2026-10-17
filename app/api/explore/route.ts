import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

const createPlaceSchema = zod.object({
  name: zod.string().trim().min(2, "Place Name must be at least 2 characters").max(150),
  category: zod.string().trim().min(2, "Please select a Place Category"),
  activities: zod.string().min(1, "Please select at least one Activity/Attraction"),
  description: zod
    .string()
    .trim()
    .min(10, "About This Place must be at least 10 characters")
    .max(3000),
  visitorTypes: zod.string().optional().nullable(),
  streetArea: zod.string().trim().min(2, "Area / Street Location is required"),
  address: zod.string().trim().min(3, "Place Address is required").max(400),
  ward: zod.coerce.number().int().min(1, "Ward must be between 1 and 48").max(48, "Ward must be between 1 and 48"),
  latitude: zod.coerce.number().optional().nullable(),
  longitude: zod.coerce.number().optional().nullable(),
  is24x7: zod.coerce.boolean().optional(),
  openingTime: zod.string().trim().max(50).optional().nullable(),
  closingTime: zod.string().trim().max(50).optional().nullable(),
  entryFeeType: zod.string().trim().default("Free Entry"),
  entryFeeAmount: zod.coerce.number().min(0).optional().nullable(),
  phone: zod
    .string()
    .trim()
    .max(20)
    .optional()
    .or(zod.literal(""))
    .nullable(),
  website: zod
    .string()
    .trim()
    .max(250)
    .optional()
    .or(zod.literal(""))
    .nullable(),
  officialUrl: zod
    .string()
    .trim()
    .max(250)
    .optional()
    .or(zod.literal(""))
    .nullable(),
  facilities: zod.string().optional().nullable(),
  bestTimeToVisit: zod.string().trim().max(50).optional().nullable(),
  guidelines: zod.string().trim().max(2000).optional().nullable(),
  termsAccepted: zod.coerce.boolean().refine((val) => val === true, {
    message: "Please confirm that the information provided is accurate.",
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
    const categoryParam = searchParams.get("category");
    const statusParam = searchParams.get("status") || "APPROVED";
    const myParam = searchParams.get("my");

    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let userId: string | null = null;

    if (token) {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        userId = session.userId;
      }
    }

    const whereClause: any = {};

    if (myParam === "true") {
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "Authentication required to view your listings." },
          { status: 401 }
        );
      }
      whereClause.ownerId = userId;
    } else {
      whereClause.status = statusParam;
    }

    if (wardParam) {
      const wardNum = parseInt(wardParam, 10);
      if (!isNaN(wardNum)) {
        whereClause.ward = wardNum;
      }
    }

    if (categoryParam && categoryParam !== "All") {
      whereClause.category = categoryParam;
    }

    const places = await prisma.explorePlace.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: places,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to fetch explore places." },
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
        { success: false, message: "Authentication required to submit a place." },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required to submit a place." },
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
      category: formData.get("category")?.toString() || "",
      activities: formData.get("activities")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      visitorTypes: formData.get("visitorTypes")?.toString() || null,
      streetArea: formData.get("streetArea")?.toString() || "",
      address: formData.get("address")?.toString() || "",
      ward: formData.get("ward"),
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
      is24x7: formData.get("is24x7") === "true",
      openingTime: formData.get("openingTime")?.toString() || null,
      closingTime: formData.get("closingTime")?.toString() || null,
      entryFeeType: formData.get("entryFeeType")?.toString() || "Free Entry",
      entryFeeAmount: formData.get("entryFeeAmount") ? Number(formData.get("entryFeeAmount")) : null,
      phone: formData.get("phone")?.toString() || null,
      website: formData.get("website")?.toString() || null,
      officialUrl: formData.get("officialUrl")?.toString() || null,
      facilities: formData.get("facilities")?.toString() || null,
      bestTimeToVisit: formData.get("bestTimeToVisit")?.toString() || null,
      guidelines: formData.get("guidelines")?.toString() || null,
      termsAccepted: formData.get("termsAccepted") === "true",
    };

    const parsed = createPlaceSchema.safeParse(rawData);
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

    // Additional validations
    if (!valid.is24x7 && (!valid.openingTime || !valid.closingTime)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please specify both opening and closing times, or select Open 24 Hours.",
          errors: { openingTime: ["Opening and closing times are required when not open 24 hours"] },
        },
        { status: 400 }
      );
    }

    if (valid.entryFeeType === "Paid Entry" && (!valid.entryFeeAmount || valid.entryFeeAmount <= 0)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid admission fee amount for Paid Entry.",
          errors: { entryFeeAmount: ["Fee amount must be greater than 0"] },
        },
        { status: 400 }
      );
    }

    // 3. Process Required Cover Image
    const rawImage = formData.get("image") as File | null;
    if (!rawImage || rawImage.size === 0) {
      return NextResponse.json(
        { success: false, message: "Place Cover Image is mandatory." },
        { status: 400 }
      );
    }

    const finalImageUrl = await uploadImageFile(rawImage, "explore-places");
    if (!finalImageUrl) {
      return NextResponse.json(
        { success: false, message: "Failed to process cover image. Please try again." },
        { status: 400 }
      );
    }

    // Process optional additional images (up to 3 photos)
    const additionalImagesUrls: string[] = [];
    const additionalFiles = (formData.getAll("additionalImages") as File[]).slice(0, 3);
    for (const f of additionalFiles) {
      if (f && f.size > 0 && f.type.startsWith("image/")) {
        const uploadedUrl = await uploadImageFile(f, "explore-places/gallery");
        if (uploadedUrl) additionalImagesUrls.push(uploadedUrl);
      }
    }

    // Parse JSON arrays safely
    let parsedActivities: string[] = [];
    try {
      parsedActivities = JSON.parse(valid.activities);
      if (!Array.isArray(parsedActivities)) parsedActivities = [valid.activities];
    } catch {
      parsedActivities = valid.activities.split(",").map((s) => s.trim()).filter(Boolean);
    }

    let parsedVisitorTypes: string[] = [];
    if (valid.visitorTypes) {
      try {
        parsedVisitorTypes = JSON.parse(valid.visitorTypes);
        if (!Array.isArray(parsedVisitorTypes)) parsedVisitorTypes = [valid.visitorTypes];
      } catch {
        parsedVisitorTypes = valid.visitorTypes.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    let parsedFacilities: string[] = [];
    if (valid.facilities) {
      try {
        parsedFacilities = JSON.parse(valid.facilities);
        if (!Array.isArray(parsedFacilities)) parsedFacilities = [valid.facilities];
      } catch {
        parsedFacilities = valid.facilities.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    // Metadata payload
    const structuredMeta = {
      activities: parsedActivities,
      visitorTypes: parsedVisitorTypes,
      facilities: parsedFacilities,
      areaLandmark: valid.streetArea,
      officialUrl: valid.officialUrl,
      bestTimeToVisit: valid.bestTimeToVisit,
      guidelines: valid.guidelines,
    };

    // 4. Save to Database via Prisma (status="PENDING" and ownerId=userId)
    const newPlace = await prisma.explorePlace.create({
      data: {
        name: valid.name,
        category: valid.category,
        description: valid.description,
        address: valid.address,
        areaLandmark: valid.streetArea,
        ward: valid.ward,
        latitude: valid.latitude ?? null,
        longitude: valid.longitude ?? null,
        is24x7: valid.is24x7 || false,
        openingTime: valid.is24x7 ? "Open 24 Hours" : valid.openingTime,
        closingTime: valid.is24x7 ? "Open 24 Hours" : valid.closingTime,
        entryFeeType: valid.entryFeeType,
        entryFeeAmount: valid.entryFeeType === "Paid Entry" ? valid.entryFeeAmount : 0,
        imageUrl: finalImageUrl,
        additionalImages: additionalImagesUrls.length > 0 ? additionalImagesUrls : undefined,
        activities: parsedActivities,
        visitorTypes: parsedVisitorTypes,
        facilities: parsedFacilities,
        bestTimeToVisit: valid.bestTimeToVisit || null,
        guidelines: valid.guidelines || null,
        phone: valid.phone || null,
        website: valid.website || null,
        officialUrl: valid.officialUrl || null,
        additionalDetails: JSON.stringify(structuredMeta),
        ownerId: userId,
        status: "PENDING",
      },
    });

    // 5. Also sync to community_listings if table exists
    try {
      const timingsFormatted = valid.is24x7
        ? "Open 24 Hours"
        : [valid.openingTime, valid.closingTime].filter(Boolean).join(" – ") || null;

      await prisma.$executeRawUnsafe(
        `INSERT INTO community_listings (
          id, type, name, subCategory, description, address, ward, timings, is24x7,
          phone, imageUrl, extraDetails, status, submittedById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE updatedAt = NOW(3)`,
        newPlace.id.substring(0, 30),
        "EXPLORE_PLACE",
        valid.name,
        valid.category,
        valid.description,
        valid.address,
        valid.ward,
        timingsFormatted,
        valid.is24x7 ? 1 : 0,
        valid.phone || null,
        finalImageUrl ? finalImageUrl.substring(0, 191) : null,
        JSON.stringify(structuredMeta),
        "PENDING",
        userId.substring(0, 30)
      );
    } catch {
      // Non-blocking
    }

    return NextResponse.json(
      {
        success: true,
        message: `${valid.name} has been submitted and is waiting for admin review.`,
        data: newPlace,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating explore place:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your place. Please check your details and try again.",
      },
      { status: 500 }
    );
  }
}
