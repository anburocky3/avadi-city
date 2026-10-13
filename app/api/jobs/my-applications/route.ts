import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Authenticate user from session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required to view your job applications.",
          data: [],
          appliedCompanies: [],
          appliedJobIds: [],
        },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required to view your job applications.",
          data: [],
          appliedCompanies: [],
          appliedJobIds: [],
        },
        { status: 401 }
      );
    }

    const userEmail = session.email?.trim().toLowerCase();

    // 2. Query Prisma for all applications submitted by this authenticated user
    const applications = await prisma.jobApplication.findMany({
      where: {
        OR: [
          { applicantId: session.userId },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
      include: {
        job: {
          select: {
            id: true,
            role: true,
            businessName: true,
            category: true,
            jobType: true,
            workMode: true,
            salary: true,
            location: true,
            ward: true,
            imageUrl: true,
            status: true,
            ownerId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Compile list of normalized company names and job IDs the user has applied to
    const companySet = new Set<string>();
    const jobIdSet = new Set<string>();

    applications.forEach((app) => {
      if (app.job?.businessName) {
        companySet.add(app.job.businessName.trim().toLowerCase());
      }
      if (app.jobId) {
        jobIdSet.add(app.jobId);
      }
    });

    return NextResponse.json({
      success: true,
      data: applications,
      appliedCompanies: Array.from(companySet),
      appliedJobIds: Array.from(jobIdSet),
    });
  } catch (error) {
    console.error("Failed to fetch user job applications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load job applications.",
        data: [],
        appliedCompanies: [],
        appliedJobIds: [],
      },
      { status: 500 }
    );
  }
}
