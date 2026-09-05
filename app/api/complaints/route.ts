import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";
import sharp from "sharp";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";
import { ALL_AVADI_STREETS } from "@/lib/wards";

// --- SERVER-SIDE VALIDATION SCHEMA ---
const serverComplaintSchema = zod.object({
  category: zod.string().min(1, "Category is required"),
  subCategory: zod
    .string()
    .min(3, "Sub-category must be at least 3 characters"),
  streetName: zod.string().min(3, "Street name must be at least 3 characters"),
  userWard: zod.coerce.number().min(1).max(48),
  shareOnFeed: zod.coerce.boolean().default(true),
  lat: zod
    .number({ message: "Latitude is required" })
    .min(13.01, "Location latitude is outside Avadi Corporation limits")
    .max(13.22, "Location latitude is outside Avadi Corporation limits"),
  lng: zod
    .number({ message: "Longitude is required" })
    .min(79.99, "Location longitude is outside Avadi Corporation limits")
    .max(80.2, "Location longitude is outside Avadi Corporation limits"),
  title: zod.string().min(6, "Title must be at least 6 characters long"),
  description: zod
    .string()
    .min(15, "Description must be at least 15 characters long"),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    let userId: string | null = null;
    let authorName = "Avadi Resident";

    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        userId = payload.userId;
        authorName = payload.name || authorName;
      }
    }

    const formData = await request.formData();

    const rawData = {
      category: formData.get("category")?.toString() || "",
      subCategory: formData.get("subCategory")?.toString() || "",
      userWard: formData.get("userWard"),
      shareOnFeed: formData.get("shareOnFeed") === "true",
      streetName: formData.get("streetName")?.toString() || "",
      lat: Number(formData.get("lat")),
      lng: Number(formData.get("lng")),
      title: formData.get("title")?.toString() || "",
      description: formData.get("description")?.toString() || "",
    };

    const validationResult = serverComplaintSchema.safeParse(rawData);

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

    // Resolve Incident Ward based on Street Selection
    const matchedStreet = ALL_AVADI_STREETS.find(
      (s) => s.streetName.toLowerCase() === validData.streetName.toLowerCase(),
    );
    const incidentWard = matchedStreet?.wardNo || validData.userWard;

    // Process Images
    const rawFiles = formData.getAll("images") as File[];
    const validImageFiles = rawFiles
      .filter((file) => file && file.size > 0 && file.type.startsWith("image/"))
      .slice(0, 3);

    const imageUrls: string[] = [];

    for (const file of validImageFiles) {
      const inputBuffer = Buffer.from(await file.arrayBuffer());

      let compressedBuffer = await sharp(inputBuffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      if (compressedBuffer.length > 1024 * 1024) {
        compressedBuffer = await sharp(inputBuffer)
          .resize(1280, 1280, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 65 })
          .toBuffer();
      }

      const fileKey = `complaints/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: compressedBuffer,
          ContentType: "image/webp",
        }),
      );

      imageUrls.push(`${PUBLIC_R2_DOMAIN}/${fileKey}`);
    }

    // Generate unique 6-digit Issue ID to fix the NaN problem
    const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
    const issueId = `AVD-${new Date().getFullYear()}-${uniqueNumber}`;

    // Execute Database Transaction
    const [newComplaint] = await prisma.$transaction(async (tx) => {
      // 1. Create Complaint
      const complaint = await tx.complaint.create({
        data: {
          issueId: issueId,
          category: validData.category,
          subCategory: validData.subCategory,
          incidentWard: incidentWard,
          userWard: validData.userWard,
          address: validData.streetName,
          lat: validData.lat,
          lng: validData.lng,
          title: validData.title.trim(),
          description: validData.description.trim(),
          imageUrl: imageUrls[0] || null,
          imageUrls: imageUrls,
          author: authorName,
          userId: userId,
          shareOnFeed: validData.shareOnFeed,
          status: "Submitted",
        },
      });

      // 2. Create Community Feed Post (Linked directly to the complaint)
      if (validData.shareOnFeed && userId) {
        await tx.feed.create({
          data: {
            authorId: userId,
            ward: incidentWard, // Ward is stored as Int in your updated schema
            text: `🚨 **Civic Issue Reported [${issueId}]**\n\n**${validData.title.trim()}**\n${validData.description.trim()}`,
            imageUrl: imageUrls[0] || null,
            category: "complaint", // Custom category for frontend filtering
            isEmergency: false,
            complaintId: complaint.id, // Direct relational link
          },
        });

        await tx.feed.create({
          data: {
            authorId: userId,
            ward: incidentWard,
            // Pass a system flag since your Prisma schema requires the text field
            text: "SYSTEM_GENERATED_COMPLAINT_POINTER",
            imageUrl: null, // DO NOT DUPLICATE THE IMAGE
            category: "complaint",
            isEmergency: false,
            complaintId: complaint.id, // THE ONLY THING THAT MATTERS
          },
        });
      }

      return [complaint];
    });

    return NextResponse.json(
      {
        success: true,
        message: "Grievance registered successfully",
        complaint: newComplaint,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Complaint Submission Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Internal server error occurred while processing grievance.",
      },
      { status: 500 },
    );
  }
}
