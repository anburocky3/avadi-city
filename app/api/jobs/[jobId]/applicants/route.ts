import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "Job ID is required." },
        { status: 400 }
      );
    }

    // 1. Authenticate user from session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to manage job applicants." },
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

    // 2. Look up job vacancy and verify ownership
    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        role: true,
        businessName: true,
        location: true,
        ward: true,
        status: true,
        jobType: true,
        workMode: true,
        ownerId: true,
      },
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
          message: "Forbidden: You do not have permission to view or manage applicants for this job vacancy.",
        },
        { status: 403 }
      );
    }

    // 3. Fetch applications for this vacancy
    const applications = await prisma.jobApplication.findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        coverLetter: true,
        qualification: true,
        experience: true,
        skills: true,
        portfolioUrl: true,
        resumeFileName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        role: job.role,
        businessName: job.businessName,
        location: job.location,
        ward: job.ward,
        status: job.status,
        jobType: job.jobType,
        workMode: job.workMode,
      },
      applications,
    });
  } catch (error) {
    console.error("Error fetching job applicants:", error);
    return NextResponse.json(
      { success: false, message: "Could not load applications. Please try again." },
      { status: 500 }
    );
  }
}
