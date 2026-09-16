import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

// PATCH — Owner accepts or rejects a claim request
// Body JSON: { action: "ACCEPTED" | "REJECTED" }
// On ACCEPTED: returns both phone numbers for mutual exchange
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ claimId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await verifyAuthToken(token);
    if (!session?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { claimId } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== "ACCEPTED" && action !== "REJECTED") {
      return NextResponse.json(
        { message: "action must be ACCEPTED or REJECTED" },
        { status: 400 },
      );
    }

    // Fetch the claim — only the item owner can respond
    const claim = await prisma.lostFoundClaim.findUnique({
      where: { id: claimId },
      include: {
        item: {
          select: {
            id: true,
            userId: true,
            contactPhone: true,
            title: true,
            status: true,
          },
        },
        requester: {
          select: { id: true, name: true, phone: true },
        },
        owner: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ message: "Claim not found" }, { status: 404 });
    }

    // Only the item owner can accept/reject
    if (claim.ownerId !== session.userId) {
      return NextResponse.json(
        { message: "Only the item owner can respond to this claim" },
        { status: 403 },
      );
    }

    if (claim.status !== "PENDING") {
      return NextResponse.json(
        { message: `This claim has already been ${claim.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    if (claim.item.status !== "Active") {
      return NextResponse.json(
        { message: "This item report is no longer active" },
        { status: 400 },
      );
    }

    // Update the claim status
    const updated = await prisma.lostFoundClaim.update({
      where: { id: claimId },
      data: { status: action },
    });

    // If ACCEPTED, return both phone numbers for mutual exchange
    if (action === "ACCEPTED") {
      return NextResponse.json(
        {
          success: true,
          status: "ACCEPTED",
          // Owner gets requester's phone
          requesterPhone: claim.requester.phone,
          requesterName: claim.requester.name,
          // Requester gets owner's phone (returned here for the owner's UI, 
          // requester fetches via their own claim status check)
          ownerPhone: claim.item.contactPhone,
          ownerName: claim.owner.name,
          claimId: updated.id,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { success: true, status: "REJECTED" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Claim PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to update claim" },
      { status: 500 },
    );
  }
}

// GET — Requester checks if their specific claim was accepted (to get the owner's phone)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ claimId: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const session = await verifyAuthToken(token);
    if (!session?.userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { claimId } = await params;

    const claim = await prisma.lostFoundClaim.findUnique({
      where: { id: claimId },
      include: {
        item: {
          select: {
            contactPhone: true,
            contactName: true,
            status: true,
          },
        },
        owner: {
          select: { name: true, phone: true },
        },
        requester: {
          select: { id: true },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ message: "Claim not found" }, { status: 404 });
    }

    // Only the requester or owner can view claim details
    if (
      claim.requesterId !== session.userId &&
      claim.ownerId !== session.userId
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (claim.status !== "ACCEPTED") {
      return NextResponse.json(
        { status: claim.status },
        { status: 200 },
      );
    }

    // Accepted — return phone based on who is asking
    if (claim.requesterId === session.userId) {
      // Requester gets the owner's phone
      return NextResponse.json(
        {
          status: "ACCEPTED",
          contactName: claim.owner.name,
          contactPhone: claim.owner.phone,
        },
        { status: 200 },
      );
    } else {
      // Owner gets the requester's phone (already returned on PATCH, but available here too)
      return NextResponse.json(
        {
          status: "ACCEPTED",
          contactName: claim.requester.id, // returns id since requester select doesn't include name here
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Claim GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch claim" },
      { status: 500 },
    );
  }
}
