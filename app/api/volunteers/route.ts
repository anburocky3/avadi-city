import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import {
  getDbVolunteers,
  mapPrismaVolunteerToVolunteer,
} from "@/lib/volunteer-db";
import { VolunteerFormData } from "@/types/volunteer";

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

    return NextResponse.json(filtered, { status: 200 });
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
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    let sessionUserId = "";
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload?.userId) {
        sessionUserId = payload.userId;
      }
    }

    const body = (await request.json()) as VolunteerFormData;

    const targetUserId = body.userId || sessionUserId;

    // Check if an existing volunteer record exists for this user or phone
    const existing = await prisma.volunteer.findFirst({
      where: {
        OR: [
          ...(targetUserId ? [{ userId: targetUserId }] : []),
          ...(body.contact?.mobile ? [{ mobile: body.contact.mobile }] : []),
          ...(body.id ? [{ displayId: body.id }] : []),
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
          mobile: body.contact.mobile,
          whatsapp: body.contact.whatsapp,
          area: body.contact.area,
          showPhonePublic: body.contact.showPhonePublic,
          emergencyName: body.emergencyContact.name,
          emergencyPhone: body.emergencyContact.phone,
          emergencyRelationship: body.emergencyContact.relationship,
          languages: body.languages,
          interests: body.interests,
          skills: body.skills,
          otherSkill: body.otherSkill || null,
          experience: body.experience,
          bio: body.bio || null,
          vehicle: body.vehicle,
          availability: body.availability as any,
          bloodGroup: body.health.bloodGroup,
          willDonateBlood: body.health.willDonateBlood,
          lastDonation: body.health.lastDonation || null,
          fitness: body.health.fitness,
          conditions: body.health.conditions || null,
          guardian: (body.guardian as any) || null,
          conductConsent: body.consents.conduct,
          directoryConsent: body.consents.directory,
          truthfulConsent: body.consents.truthful,
          status: body.status || existing.status,
        },
      });

      return NextResponse.json(mapPrismaVolunteerToVolunteer(updated), {
        status: 200,
      });
    }

    // Create new record
    const totalCount = await prisma.volunteer.count();
    const displayId = `AVC-VOL-${String(totalCount + 1).padStart(4, "0")}`;

    const created = await prisma.volunteer.create({
      data: {
        displayId,
        userId: targetUserId || null,
        fullName: body.fullName,
        ward: Number(body.ward),
        gender: body.gender,
        age: Number(body.age),
        dob: body.dob || null,
        mobile: body.contact.mobile,
        whatsapp: body.contact.whatsapp,
        area: body.contact.area,
        showPhonePublic: body.contact.showPhonePublic,
        emergencyName: body.emergencyContact.name,
        emergencyPhone: body.emergencyContact.phone,
        emergencyRelationship: body.emergencyContact.relationship,
        languages: body.languages,
        interests: body.interests,
        skills: body.skills,
        otherSkill: body.otherSkill || null,
        experience: body.experience,
        bio: body.bio || null,
        vehicle: body.vehicle,
        availability: body.availability as any,
        bloodGroup: body.health.bloodGroup,
        willDonateBlood: body.health.willDonateBlood,
        lastDonation: body.health.lastDonation || null,
        fitness: body.health.fitness,
        conditions: body.health.conditions || null,
        guardian: (body.guardian as any) || null,
        conductConsent: body.consents.conduct,
        directoryConsent: body.consents.directory,
        truthfulConsent: body.consents.truthful,
        status: body.status || "pending",
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
