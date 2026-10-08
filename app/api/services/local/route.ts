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
        { status: 400 },
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
        { status: 400 },
      );
    }

    const fullAddress =
      address ||
      (streetName
        ? `${streetName}, Ward ${servingWard || 14}`
        : `Ward ${servingWard || 14}`);
    const hours =
      startTime && endTime ? `${startTime} - ${endTime}` : undefined;
    const specialty = Array.isArray(services) ? services.join(", ") : undefined;
    const rate = visitingCharge ? String(visitingCharge) : undefined;

    const fullDescription = [
      description ? description.trim() : "",
      fullAddress ? `Address: ${fullAddress}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    let finalImageUrl: string | null = null;
    if (profilePhoto && typeof profilePhoto === "string") {
      if (
        profilePhoto.startsWith("http://") ||
        profilePhoto.startsWith("https://")
      ) {
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
              }),
            );
            finalImageUrl = `${PUBLIC_R2_DOMAIN}/${fileKey}`;
          }
        } catch (uploadErr) {
          console.error("Failed to upload profilePhoto to R2:", uploadErr);
        }
      }
    }

    const resolvedCategory =
      Array.isArray(body.categories) && body.categories.length > 0
        ? body.categories.join(", ")
        : (category || "").trim();

    // Prepare skills with rates
    let skillsList: { name: string; price: number }[] = [];
    if (Array.isArray(services) && services.length > 0) {
      skillsList = services.map((s: string) => ({
        name: String(s).trim(),
        price:
          serviceRates && serviceRates[s] !== undefined
            ? Number(serviceRates[s]) || 100
            : 100,
      }));
    } else if (serviceRates && typeof serviceRates === "object") {
      skillsList = Object.entries(serviceRates).map(([name, price]) => ({
        name: name.trim(),
        price: Number(price) || 100,
      }));
    }

    const formattedRate = rate
      ? String(rate).startsWith("₹")
        ? String(rate)
        : `₹${rate}`
      : undefined;

    // Save into the MySQL service_profiles table
    const serviceWorker = await prisma.localServiceProfile.create({
      data: {
        name: fullName.trim(),
        category: resolvedCategory,
        phone: phone.trim(),
        ward: Number(servingWard) || 14,
        experience: experience ? String(experience) : undefined,
        hours: hours,
        specialty: specialty,
        rate: formattedRate,
        skills: skillsList.length > 0 ? JSON.stringify(skillsList) : null,
        description: fullDescription || undefined,
        imageUrl: finalImageUrl,
        status: "APPROVED",
        submittedById: userId,
      },
    });

    return NextResponse.json({ success: true, serviceWorker }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service worker:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to register service worker" },
      { status: 500 },
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
      where.category = { contains: category };
    }

    const workers = await prisma.localServiceProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formattedWorkers = workers.map((worker) => {
      let parsedSkills: { name: string; price: number }[] = [];
      if (worker.skills) {
        try {
          const parsed = JSON.parse(worker.skills);
          if (Array.isArray(parsed)) {
            parsedSkills = parsed;
          }
        } catch {
          parsedSkills = [];
        }
      }

      // Fallback for existing database records (e.g. registered before skills column)
      if (parsedSkills.length === 0 && worker.specialty) {
        parsedSkills = worker.specialty
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name, price: 100 }));
      }

      const displayRate = worker.rate
        ? String(worker.rate).startsWith("₹")
          ? String(worker.rate)
          : `₹${worker.rate}`
        : "₹350";

      return {
        ...worker,
        rate: displayRate,
        skills: parsedSkills,
      };
    });

    return NextResponse.json(formattedWorkers, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching service workers:", error);
    return NextResponse.json([], { status: 200 });
  }
}
