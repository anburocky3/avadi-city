import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import {
  getDbDonations,
  mapPrismaDonationToDonation,
} from "@/lib/donation-db";
import { DonationFormData } from "@/types/donation";

// GET /api/donations
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const urgency = searchParams.get("urgency");

    const donations = await getDbDonations();

    let filtered = donations;
    if (ward && ward !== "all" && ward !== "All") {
      filtered = filtered.filter((d) => String(d.ward) === String(ward));
    }
    if (userId) {
      filtered = filtered.filter((d) => d.createdBy === userId);
    }
    if (type && type !== "All") {
      filtered = filtered.filter((d) => d.type === type);
    }
    if (urgency && urgency !== "All") {
      filtered = filtered.filter((d) => d.urgency === urgency);
    }

    return NextResponse.json(filtered, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/donations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 },
    );
  }
}

// POST /api/donations (Create donation request)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    let sessionUserId = "";
    let sessionUserName = "";
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        sessionUserId = payload.userId;
        sessionUserName = payload.name || "";
      }
    }

    const body = (await request.json()) as DonationFormData;

    const prospectiveUserId = body.createdBy || sessionUserId;
    let validUserId: string | null = null;
    if (prospectiveUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: prospectiveUserId },
        select: { id: true },
      });
      if (userExists) {
        validUserId = userExists.id;
      }
    }

    // Safely generate next displayId by scanning existing records for max numeric suffix
    const existing = await prisma.donationRequest.findMany({
      select: { displayId: true },
    });
    let maxNum = 0;
    for (const item of existing) {
      const match = item.displayId?.match(/AVC-DON-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const displayId = `AVC-DON-${String(maxNum + 1).padStart(4, "0")}`;

    const parsedWard = parseInt(String(body.ward || 1).replace(/\D/g, ""), 10) || 1;
    const authorName =
      body.createdByName ||
      (prospectiveUserId !== "user-avadi-citizen" ? prospectiveUserId : null) ||
      sessionUserName ||
      body.contact?.name ||
      "Avadi Citizen";

    const created = await prisma.donationRequest.create({
      data: {
        displayId,
        userId: validUserId || null,
        createdByName: authorName,
        type: body.type || "Charity Need",
        urgency: body.urgency || "Normal",
        title: body.title || "Community Assistance Request",
        description: body.description || null,
        ward: parsedWard,
        address: body.address || "Avadi, Chennai",
        lat: body.lat ? Number(body.lat) : null,
        lng: body.lng ? Number(body.lng) : null,
        beneficiary: body.beneficiary || "Individual",
        items: (body.items as any) || [],
        target: (body.target as any) || null,
        requiredBy: body.requiredBy || null,
        contactName: body.contact?.name || authorName,
        contactPhone: body.contact?.phone || "",
        contactWhatsapp: body.contact?.whatsapp || body.contact?.phone || "",
        images: (body.images as any) || [],
        organisation: (body.organisation as any) || null,
        supportingProof: body.supportingProof || null,
        status: body.status || "approved",
      },
      include: {
        reports: true,
      },
    });

    return NextResponse.json(mapPrismaDonationToDonation(created), {
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/donations error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create donation request" },
      { status: 500 },
    );
  }
}
