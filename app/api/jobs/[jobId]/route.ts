import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken, isUserAdmin } from "@/lib/auth";

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

    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      include: {
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, message: "Job vacancy not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        featured: Boolean(job.featured),
      },
    });
  } catch (error) {
    console.error("Failed to fetch job vacancy:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch job vacancy." },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // 1. Authenticate user from session or admin cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let session = null;
    if (token) {
      session = await verifyAuthToken(token);
    }

    // 2. Strict Security: Verify admin authorization
    const isAdmin = await isUserAdmin(session);
    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Only authorized administrators can update the Featured / Sponsored status.",
        },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json().catch(() => ({}));
    if (typeof body.featured !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload: 'featured' must be a boolean (true or false).",
        },
        { status: 400 }
      );
    }

    // 4. Verify target job exists
    const existingJob = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      select: { id: true, role: true, businessName: true, status: true, featured: true },
    });

    if (!existingJob) {
      return NextResponse.json(
        { success: false, message: "Job vacancy not found." },
        { status: 404 }
      );
    }

    // 5. Update only the featured field (preserving approval status and other data)
    const updatedJob = await prisma.jobVacancy.update({
      where: { id: jobId },
      data: {
        featured: Boolean(body.featured),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Job "${updatedJob.role}" at ${updatedJob.businessName} is now ${
        updatedJob.featured ? "marked as Sponsored" : "no longer sponsored"
      }.`,
      data: {
        ...updatedJob,
        featured: Boolean(updatedJob.featured),
      },
    });
  } catch (error) {
    console.error("Failed to update job vacancy featured status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update featured status. Please try again.",
      },
      { status: 500 }
    );
  }
}
