import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// GET — Privacy-protected contact reveal.
// A phone number is ONLY returned when the requesting user has an ACCEPTED claim
// on this item. This replaces the old direct-reveal endpoint.
//
// The owner can still see their own contactPhone via the /my endpoint — not via here.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.lostFoundItem.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        contactName: true,
        contactPhone: true,
        type: true,
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Item not found" }, { status: 404 });
    }

    if (item.status !== "Active") {
      return NextResponse.json(
        { message: "This report is no longer active" },
        { status: 400 },
      );
    }

    // Owners do not need to use this endpoint — they have their own phone
    if (item.userId === session.userId) {
      return NextResponse.json(
        { message: "Use your profile or My Reports to view your own contact" },
        { status: 400 },
      );
    }

    // Check that the requester has an ACCEPTED claim on this item
    const acceptedClaim = await prisma.lostFoundClaim.findUnique({
      where: {
        lostFoundItemId_requesterId: {
          lostFoundItemId: id,
          requesterId: session.userId,
        },
      },
      select: { status: true },
    });

    if (!acceptedClaim || acceptedClaim.status !== "ACCEPTED") {
      return NextResponse.json(
        {
          message:
            "Contact information is only available after the item owner accepts your claim request.",
          requiresClaim: true,
        },
        { status: 403 },
      );
    }

    // Claim is ACCEPTED — safe to reveal owner's phone
    return NextResponse.json(
      {
        contactName: item.contactName,
        contactPhone: item.contactPhone,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Lost & Found contact reveal error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve contact information" },
      { status: 500 },
    );
  }
}
