import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { StringDecoder } from "node:string_decoder";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const complaintId = id;

    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAuthToken(token);
    const userId = payload?.userId;
    if (!userId)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // 1. Check if the user already upvoted this complaint
    const existingUpvote = await prisma.complaintUpvote.findUnique({
      where: {
        complaintId_userId: {
          complaintId,
          userId,
        },
      },
    });

    if (existingUpvote) {
      // 2a. If they already upvoted, REMOVE the upvote (Toggle Off)
      await prisma.$transaction([
        prisma.complaintUpvote.delete({
          where: { id: existingUpvote.id },
        }),
        prisma.complaint.update({
          where: { id: complaintId },
          data: { upvotes: { decrement: 1 } },
        }),
      ]);

      return NextResponse.json({ success: true, action: "removed" });
    } else {
      // 2b. If they haven't upvoted, ADD the upvote (Toggle On)
      await prisma.$transaction([
        prisma.complaintUpvote.create({
          data: { complaintId, userId },
        }),
        prisma.complaint.update({
          where: { id: complaintId },
          data: { upvotes: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({ success: true, action: "added" });
    }
  } catch (error) {
    console.error("Complaint Upvote Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
