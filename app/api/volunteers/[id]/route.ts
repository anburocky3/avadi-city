import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPrismaVolunteerToVolunteer } from "@/lib/volunteer-db";

// GET /api/volunteers/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const volunteer = await prisma.volunteer.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
    });

    if (!volunteer) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapPrismaVolunteerToVolunteer(volunteer), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// PUT /api/volunteers/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.volunteer.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.volunteer.update({
      where: { id: existing.id },
      data: {
        ...(body.fullName && { fullName: body.fullName }),
        ...(body.ward && { ward: Number(body.ward) }),
        ...(body.gender && { gender: body.gender }),
        ...(body.age && { age: Number(body.age) }),
        ...(body.status && { status: body.status }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.skills && { skills: body.skills }),
        ...(body.interests && { interests: body.interests }),
        ...(body.availability && { availability: body.availability }),
        ...(body.health && {
          bloodGroup: body.health.bloodGroup,
          willDonateBlood: body.health.willDonateBlood,
          fitness: body.health.fitness,
        }),
      },
    });

    return NextResponse.json(mapPrismaVolunteerToVolunteer(updated), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// DELETE /api/volunteers/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.volunteer.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Volunteer not found" },
        { status: 404 },
      );
    }

    await prisma.volunteer.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
