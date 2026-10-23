import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPrismaDonationToDonation } from "@/lib/donation-db";

// GET /api/donations/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const donation = await prisma.donationRequest.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
      include: { reports: true },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mapPrismaDonationToDonation(donation), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// PATCH /api/donations/[id] (Update status e.g. fulfilled, approved)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const existing = await prisma.donationRequest.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Donation request not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.donationRequest.update({
      where: { id: existing.id },
      data: { status },
      include: { reports: true },
    });

    return NextResponse.json(mapPrismaDonationToDonation(updated), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// PUT /api/donations/[id] (Full update)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.donationRequest.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Donation request not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.donationRequest.update({
      where: { id: existing.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.type && { type: body.type }),
        ...(body.urgency && { urgency: body.urgency }),
        ...(body.ward && { ward: Number(body.ward) }),
        ...(body.address && { address: body.address }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.items !== undefined && { items: body.items }),
        ...(body.contact && {
          contactName: body.contact.name,
          contactPhone: body.contact.phone,
          contactWhatsapp: body.contact.whatsapp,
        }),
      },
      include: { reports: true },
    });

    return NextResponse.json(mapPrismaDonationToDonation(updated), {
      status: 200,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// DELETE /api/donations/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.donationRequest.findFirst({
      where: {
        OR: [{ id }, { displayId: id }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Donation request not found" },
        { status: 404 },
      );
    }

    await prisma.donationRequest.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
