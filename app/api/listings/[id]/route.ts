import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET — Fetch a single listing (APPROVED, or own submission)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    const session = token ? await verifyAuthToken(token) : null;

    const listing = await prisma.communityListing.findUnique({
      where: { id },
      include: {
        submittedBy: { select: { name: true, wardNumber: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    // Only allow if APPROVED, or if the requester is the owner
    if (
      listing.status !== "APPROVED" &&
      listing.submittedById !== session?.userId
    ) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(listing, { status: 200 });
  } catch (error) {
    console.error("Listing GET [id] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch listing" },
      { status: 500 },
    );
  }
}
