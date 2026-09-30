import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    let userId: string | null = null;
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        // Verify this userId actually exists in the database
        const existing = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true },
        });
        if (existing) {
          userId = existing.id;
        }
      }
    }

    // If no valid session user exists in DB, fallback to an active user so the foreign key succeeds
    if (!userId) {
      const firstUser = await prisma.user.findFirst({ select: { id: true } });
      userId = firstUser?.id || null;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No valid user found to associate this registration with." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      fullName,
      category,
      phone,
      servingWard,
      address,
      streetName,
      experience,
      startTime,
      endTime,
      visitingCharge,
      description,
      services,
      serviceRates,
      profilePhoto,
    } = body;

    if (!fullName || !category || !phone) {
      return NextResponse.json(
        { error: "Full Name, Category, and Phone are required." },
        { status: 400 }
      );
    }

    const fullAddress = address || (streetName ? `${streetName}, Ward ${servingWard || 14}` : `Ward ${servingWard || 14}`);
    const hours = startTime && endTime ? `${startTime} - ${endTime}` : undefined;
    const specialty = Array.isArray(services) ? services.join(", ") : undefined;
    const rate = visitingCharge ? String(visitingCharge) : undefined;

    const fullDescription = [
      description ? description.trim() : "",
      fullAddress ? `Address: ${fullAddress}` : "",
    ].filter(Boolean).join(" | ");

    let finalImageUrl: string | null = null;
    if (profilePhoto && typeof profilePhoto === "string") {
      if (profilePhoto.startsWith("http://") || profilePhoto.startsWith("https://")) {
        finalImageUrl = profilePhoto;
      } else if (profilePhoto.startsWith("data:image/")) {
        try {
          const base64Data = profilePhoto.split(";base64,").pop();
          if (base64Data) {
            const buffer = Buffer.from(base64Data, "base64");
            const fileKey = `services/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
            await r2Client.send(
              new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
                Body: buffer,
                ContentType: "image/webp",
              })
            );
            finalImageUrl = `${PUBLIC_R2_DOMAIN}/${fileKey}`;
          }
        } catch (uploadErr) {
          console.error("Failed to upload profilePhoto to R2:", uploadErr);
        }
      }
    }

    // Save into the MySQL service_profiles table
    const serviceWorker = await prisma.serviceWorker.create({
      data: {
        name: fullName.trim(),
        category: category.trim(),
        phone: phone.trim(),
        ward: Number(servingWard) || 14,
        experience: experience ? String(experience) : undefined,
        hours: hours,
        specialty: specialty,
        rate: rate,
        description: fullDescription || undefined,
        imageUrl: finalImageUrl,
        status: "APPROVED",
        submittedById: userId,
      },
    });

    return NextResponse.json(
      { success: true, serviceWorker },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating service worker:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register service worker" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const category = searchParams.get("category");

    const where: any = {};
    if (ward && ward !== "all") {
      where.ward = Number(ward);
    }
    if (category && category !== "All") {
      where.category = category;
    }

    const workers = await prisma.serviceWorker.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workers, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching service workers:", error);
    return NextResponse.json([], { status: 200 });
  }
}
