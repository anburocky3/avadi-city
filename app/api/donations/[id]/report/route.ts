import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/donations/[id]/report
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { reason, details, reportedBy } = await request.json();

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

    const report = await prisma.donationReport.create({
      data: {
        donationId: existing.id,
        reason,
        details: details || null,
        reportedBy: reportedBy || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
