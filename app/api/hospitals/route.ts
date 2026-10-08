import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

const createHospitalSchema = zod.object({
  name: zod.string().trim().min(2, "Facility Name must be at least 2 characters").max(120),
  facilityType: zod.string().trim().min(2, "Facility Type is required"),
  category: zod.string().trim().optional(),
  description: zod.string().trim().min(10, "Facility Description must be at least 10 characters").max(3000),
  phone: zod
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  alternatePhone: zod.string().trim().max(15).optional().nullable(),
  email: zod
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(zod.literal(""))
    .nullable(),
  address: zod.string().trim().min(3, "Facility Address must be at least 3 characters").max(400),
  areaLandmark: zod.string().trim().max(150).optional().nullable(),
  ward: zod.coerce.number().int().min(1, "Ward must be between 1 and 48").max(48, "Ward must be between 1 and 48"),
  latitude: zod.coerce.number().optional().nullable(),
  longitude: zod.coerce.number().optional().nullable(),
  is24x7: zod.coerce.boolean().optional(),
  openingTime: zod.string().trim().max(50).optional().nullable(),
  closingTime: zod.string().trim().max(50).optional().nullable(),
  services: zod.string().min(1, "At least one healthcare service is required"),
  emergencyAvailable: zod.coerce.boolean().optional(),
  ambulanceAvailable: zod.coerce.boolean().optional(),
  ambulancePhone: zod.string().trim().max(20).optional().nullable(),
  appointments: zod.string().trim().max(50).optional().nullable(),
  consultationFee: zod.coerce
    .number()
    .min(0, "Consultation fee cannot be negative")
    .optional()
    .nullable(),
  homeDelivery: zod.coerce.boolean().optional(),
  paymentMethods: zod.string().optional().nullable(),
  website: zod.string().trim().max(250).optional().nullable(),
  socialLink: zod.string().trim().max(250).optional().nullable(),
  keyServices: zod.string().optional().nullable(),
  termsAccepted: zod.coerce.boolean().refine((val) => val === true, {
    message: "Please accept the Terms & Conditions before submitting.",
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

    if (myParam === "true" && userId) {
      whereClause.ownerId = userId;
    } else {
      whereClause.status = statusParam;
    }

    if (wardParam) {
      const wardNum = parseInt(wardParam, 10);
      if (!isNaN(wardNum) && wardNum >= 1 && wardNum <= 48) {
        whereClause.ward = wardNum;
      }
    }

    if (categoryParam && categoryParam !== "All") {
      whereClause.facilityType = { contains: categoryParam };
    }

    const facilities =
      (await (prisma as any).healthcareFacility?.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      })) || [];

    return NextResponse.json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch facilities." },
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
        { success: false, message: "Authentication required to submit a healthcare facility." },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required to submit a healthcare facility." },
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
      facilityType: formData.get("facilityType")?.toString() || "",
      category: formData.get("category")?.toString() || undefined,
      description: formData.get("description")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      alternatePhone: formData.get("alternatePhone")?.toString() || null,
      email: formData.get("email")?.toString() || null,
      address: formData.get("address")?.toString() || "",
      areaLandmark: formData.get("areaLandmark")?.toString() || null,
      ward: formData.get("ward"),
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
      is24x7: formData.get("is24x7") === "true",
      openingTime: formData.get("openingTime")?.toString() || null,
      closingTime: formData.get("closingTime")?.toString() || null,
      services: formData.get("services")?.toString() || "",
      emergencyAvailable: formData.get("emergencyAvailable") === "true",
      ambulanceAvailable: formData.get("ambulanceAvailable") === "true",
      ambulancePhone: formData.get("ambulancePhone")?.toString() || null,
      appointments: formData.get("appointments")?.toString() || null,
      homeDelivery: formData.get("homeDelivery") === "true",
      paymentMethods: formData.get("paymentMethods")?.toString() || null,
      website: formData.get("website")?.toString() || null,
      socialLink: formData.get("socialLink")?.toString() || null,
      keyServices: formData.get("keyServices")?.toString() || null,
      termsAccepted: formData.get("termsAccepted") === "true",
    };

    const parsed = createHospitalSchema.safeParse(rawData);
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

    // Opening/Closing time required if not 24 Hours
    if (!valid.is24x7) {
      if (!valid.openingTime) {
        return NextResponse.json(
          { success: false, message: "Opening Time is required when not open 24 hours." },
          { status: 400 }
        );
      }
      if (!valid.closingTime) {
        return NextResponse.json(
          { success: false, message: "Closing Time is required when not open 24 hours." },
          { status: 400 }
        );
      }
    }

    // 3. Process Required Facility Image
    const rawImage = formData.get("image") as File | null;
    if (!rawImage || rawImage.size === 0) {
      return NextResponse.json(
        { success: false, message: "Facility Image is mandatory." },
        { status: 400 }
      );
    }

    const finalImageUrl = await uploadImageFile(rawImage, "healthcare-facilities");

    // Process Optional Additional Images
    const rawAdditionalImages = formData.getAll("additionalImages") as File[];
    const additionalImageUrls: string[] = [];

    for (const addImg of rawAdditionalImages) {
      if (addImg && addImg.size > 0 && addImg.type.startsWith("image/")) {
        const uploadedUrl = await uploadImageFile(addImg, "healthcare-facilities/extra");
        if (uploadedUrl) {
          additionalImageUrls.push(uploadedUrl);
        }
      }
    }

    // Parse services
    let parsedServices: string[] = [];
    try {
      const s = JSON.parse(valid.services);
      parsedServices = Array.isArray(s) ? s.map((x) => String(x).trim()).filter(Boolean) : [valid.services];
    } catch {
      parsedServices = valid.services.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (parsedServices.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one healthcare service." },
        { status: 400 }
      );
    }

    // Parse keyServices
    let parsedKeyServices: string[] = [];
    if (valid.keyServices) {
      try {
        const ks = JSON.parse(valid.keyServices);
        parsedKeyServices = Array.isArray(ks) ? ks.map((x) => String(x).trim()).filter(Boolean) : [];
      } catch {
        parsedKeyServices = valid.keyServices.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    // Parse payment methods
    let parsedPaymentMethods: string[] = [];
    if (valid.paymentMethods) {
      try {
        const pm = JSON.parse(valid.paymentMethods);
        parsedPaymentMethods = Array.isArray(pm) ? pm.map((x) => String(x).trim()).filter(Boolean) : [];
      } catch {
        parsedPaymentMethods = valid.paymentMethods.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    // Resolve category name (e.g. "Hospitals", "Pharmacies", "Clinics", "Diagnostics")
    let categoryName = "Hospitals";
    const typeLower = valid.facilityType.toLowerCase();
    if (typeLower.includes("pharmacy")) categoryName = "Pharmacies";
    else if (typeLower.includes("clinic")) categoryName = "Clinics";
    else if (typeLower.includes("diagnostic")) categoryName = "Diagnostics";
    else if (typeLower.includes("pet hospital")) categoryName = "Pet Hospitals";
    else if (typeLower.includes("pet clinic")) categoryName = "Pet Clinics";
    else categoryName = valid.category || "Hospitals";

    // Structured metadata for additionalDetails
    const structuredMeta = {
      facilityType: valid.facilityType,
      services: parsedServices,
      keyServices: parsedKeyServices,
      paymentMethods: parsedPaymentMethods,
      alternatePhone: valid.alternatePhone || null,
      email: valid.email || null,
      emergencyAvailable: valid.emergencyAvailable || false,
      ambulanceAvailable: valid.ambulanceAvailable || false,
      ambulancePhone: valid.ambulanceAvailable ? valid.ambulancePhone : null,
      appointments: valid.appointments || null,
      consultationFee: valid.consultationFee ?? null,
      homeDelivery: valid.homeDelivery || false,
      is24x7: valid.is24x7 || false,
      openingTime: valid.is24x7 ? "Open 24 Hours" : valid.openingTime,
      closingTime: valid.is24x7 ? "Open 24 Hours" : valid.closingTime,
      additionalImages: additionalImageUrls,
      website: valid.website || null,
      socialLink: valid.socialLink || null,
      areaLandmark: valid.areaLandmark || null,
      latitude: valid.latitude ?? null,
      longitude: valid.longitude ?? null,
    };

    // 4. Save to Database via Prisma (status="PENDING", ownerId=userId)
    const newFacility = await (prisma as any).healthcareFacility.create({
      data: {
        name: valid.name,
        facilityType: valid.facilityType,
        category: categoryName,
        description: valid.description,
        phone: valid.phone,
        alternatePhone: valid.alternatePhone,
        email: valid.email,
        address: valid.address,
        areaLandmark: valid.areaLandmark,
        ward: valid.ward,
        latitude: valid.latitude ?? null,
        longitude: valid.longitude ?? null,
        is24x7: valid.is24x7 || false,
        openingTime: valid.is24x7 ? "Open 24 Hours" : valid.openingTime,
        closingTime: valid.is24x7 ? "Open 24 Hours" : valid.closingTime,
        imageUrl: finalImageUrl,
        additionalImages: additionalImageUrls,
        services: parsedServices,
        emergencyAvailable: valid.emergencyAvailable || false,
        ambulanceAvailable: valid.ambulanceAvailable || false,
        ambulancePhone: valid.ambulanceAvailable ? valid.ambulancePhone : null,
        appointments: valid.appointments || null,
        consultationFee: valid.consultationFee ?? null,
        homeDelivery: valid.homeDelivery || false,
        paymentMethods: parsedPaymentMethods,
        website: valid.website || null,
        socialLink: valid.socialLink || null,
        keyServices: parsedKeyServices,
        additionalDetails: JSON.stringify(structuredMeta),
        ownerId: userId,
        status: "PENDING",
      },
    });

    // 5. Also sync to community_listings if table exists, ensuring existing Admin module retrieves it
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
        newFacility.id,
        "HEALTHCARE",
        newFacility.name,
        newFacility.facilityType,
        newFacility.description,
        newFacility.address,
        newFacility.ward,
        timingsFormatted,
        newFacility.is24x7 ? 1 : 0,
        newFacility.phone,
        newFacility.imageUrl,
        JSON.stringify(structuredMeta),
        "PENDING",
        userId
      );
    } catch {
      // Ignored if community_listings is not present
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${newFacility.name} has been submitted and is waiting for admin review.`,
      facility: newFacility,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "An unexpected error occurred while submitting facility.",
      },
      { status: 500 }
    );
  }
}
