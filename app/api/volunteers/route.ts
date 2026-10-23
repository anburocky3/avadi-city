import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import {
  getDbVolunteers,
  mapPrismaVolunteerToVolunteer,
} from "@/lib/volunteer-db";
import { VolunteerFormData } from "@/types/volunteer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/volunteers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const userId = searchParams.get("userId");

    const volunteers = await getDbVolunteers();

    let filtered = volunteers;
    if (ward && ward !== "all") {
      filtered = filtered.filter((v) => String(v.ward) === String(ward));
    }
    if (userId) {
      filtered = filtered.filter((v) => v.userId === userId);
    }

    return NextResponse.json(filtered, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("GET /api/volunteers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch volunteers" },
      { status: 500 },
    );
  }
}

// POST /api/volunteers (Register or Update volunteer)
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VolunteerFormData & {
      id?: string;
      status?: any;
    };
    let sessionUserId = "";
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("avadi_session")?.value;
      if (token) {
        const payload = await verifyAuthToken(token);
        if (payload?.userId) {
          sessionUserId = payload.userId;
        }
      }
    } catch {
      // Cookies not accessible or unauthenticated
    }

    const prospectiveUserId = body.userId || sessionUserId;
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

    const cleanMobile = (body.contact?.mobile || "").replace(/\D/g, "");

    // Check if an existing volunteer record exists for this user or phone
    const existing = await prisma.volunteer.findFirst({
      where: {
        OR: [
          ...(validUserId ? [{ userId: validUserId }] : []),
          ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
        ],
      },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.volunteer.update({
        where: { id: existing.id },
        data: {
          fullName: body.fullName,
          ward: Number(body.ward),
          gender: body.gender,
          age: Number(body.age),
          dob: body.dob || null,
          mobile: cleanMobile || existing.mobile,
          whatsapp:
            (body.contact?.whatsapp || "").replace(/\D/g, "") ||
            existing.whatsapp,
          area: body.contact?.area || existing.area,
          showPhonePublic: Boolean(body.contact?.showPhonePublic),
          emergencyName: body.emergencyContact?.name || existing.emergencyName,
          emergencyPhone:
            body.emergencyContact?.phone || existing.emergencyPhone,
          emergencyRelationship:
            body.emergencyContact?.relationship ||
            existing.emergencyRelationship,
          languages: body.languages || existing.languages,
          interests: body.interests || existing.interests,
          skills: body.skills || existing.skills,
          otherSkill: body.otherSkill || null,
          experience: body.experience || existing.experience,
          bio: body.bio || null,
          vehicle: body.vehicle || existing.vehicle,
          availability: (body.availability || existing.availability) as any,
          bloodGroup: body.health?.bloodGroup || existing.bloodGroup,
          willDonateBlood: Boolean(body.health?.willDonateBlood),
          lastDonation: body.health?.lastDonation || null,
          fitness: body.health?.fitness || existing.fitness,
          conditions: body.health?.conditions || null,
          guardian: (body.guardian as any) || null,
          conductConsent: Boolean(body.consents?.conduct ?? true),
          directoryConsent: Boolean(body.consents?.directory ?? true),
          truthfulConsent: Boolean(body.consents?.truthful ?? true),
          status: body.status || existing.status || "pending",
        },
        include: {
          user: {
            select: {
              avatar: true,
            },
          },
        },
      });

      return NextResponse.json(mapPrismaVolunteerToVolunteer(updated), {
        status: 200,
      });
    }

    // Find highest existing displayId number to prevent unique constraint conflicts
    const allExisting = await prisma.volunteer.findMany({
      select: { displayId: true },
    });
    let maxNum = 0;
    for (const v of allExisting) {
      const match = v.displayId?.match(/AVC-VOL-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const displayId = `AVC-VOL-${String(maxNum + 1).padStart(4, "0")}`;

    const created = await prisma.volunteer.create({
      data: {
        displayId,
        userId: validUserId || null,
        fullName: body.fullName,
        ward: Number(body.ward),
        gender: body.gender,
        age: Number(body.age),
        dob: body.dob || null,
        mobile: cleanMobile,
        whatsapp:
          (body.contact?.whatsapp || "").replace(/\D/g, "") || cleanMobile,
        area: body.contact?.area || "",
        showPhonePublic: Boolean(body.contact?.showPhonePublic),
        emergencyName: body.emergencyContact?.name || "",
        emergencyPhone: body.emergencyContact?.phone || "",
        emergencyRelationship: body.emergencyContact?.relationship || "",
        languages: body.languages || [],
        interests: body.interests || [],
        skills: body.skills || [],
        otherSkill: body.otherSkill || null,
        experience: body.experience || "Beginner",
        bio: body.bio || null,
        vehicle: body.vehicle || "None",
        availability: (body.availability || {}) as any,
        bloodGroup: body.health?.bloodGroup || "O+",
        willDonateBlood: Boolean(body.health?.willDonateBlood),
        lastDonation: body.health?.lastDonation || null,
        fitness: body.health?.fitness || "Yes",
        conditions: body.health?.conditions || null,
        guardian: (body.guardian as any) || null,
        conductConsent: Boolean(body.consents?.conduct ?? true),
        directoryConsent: Boolean(body.consents?.directory ?? true),
        truthfulConsent: Boolean(body.consents?.truthful ?? true),
        status: body.status || "pending",
      },
      include: {
        user: {
          select: {
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(mapPrismaVolunteerToVolunteer(created), {
      status: 201,
    });
  } catch (error: any) {
    console.error("POST /api/volunteers error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register volunteer" },
      { status: 500 },
    );
  }
}
