import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

const ALLOWED_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string; applicantId: string }> }
) {
  try {
    const { jobId, applicantId } = await params;

    if (!jobId || !applicantId) {
      return NextResponse.json(
        { success: false, message: "Job ID and Applicant ID are required." },
        { status: 400 }
      );
    }

    // 1. Authenticate user from session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to update application status." },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    // 2. Verify job ownership
    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      select: { id: true, ownerId: true },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job vacancy not found." },
        { status: 404 }
      );
    }

    if (job.ownerId !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You do not have permission to manage applications for this job vacancy.",
        },
        { status: 403 }
      );
    }

    // 3. Verify application belongs to this job
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicantId },
      select: { id: true, jobId: true, status: true },
    });

    if (!application || application.jobId !== job.id) {
      return NextResponse.json(
        { success: false, message: "Application record not found for this job." },
        { status: 404 }
      );
    }

    // 4. Validate requested status
    const body = await request.json().catch(() => ({}));
    const newStatus = body?.status;

    if (!newStatus || !ALLOWED_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid application status. Allowed values: ${ALLOWED_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 5. Update application status
    const updated = await prisma.jobApplication.update({
      where: { id: applicantId },
      data: { status: newStatus },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Application status updated to ${newStatus}.`,
      application: updated,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Could not update the application status. Your changes have not been saved.",
      },
      { status: 500 }
    );
  }
}
