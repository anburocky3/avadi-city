import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string; applicantId: string }> }
) {
  try {
    const { jobId, applicantId } = await params;
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true";

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
        { success: false, message: "Authentication required to view resumes." },
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
          message: "Forbidden: You do not have permission to view resumes for this job vacancy.",
        },
        { status: 403 }
      );
    }

    // 3. Fetch application record
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicantId },
      select: {
        id: true,
        jobId: true,
        resumeUrl: true,
        resumeFileName: true,
      },
    });

    if (!application || application.jobId !== job.id) {
      return NextResponse.json(
        { success: false, message: "Application record not found for this job." },
        { status: 404 }
      );
    }

    if (!application.resumeUrl) {
      return NextResponse.json(
        { success: false, message: "No resume attached to this application." },
        { status: 404 }
      );
    }

    const fileName = application.resumeFileName || "resume.pdf";
    const dispositionType = isDownload ? "attachment" : "inline";
    const contentDisposition = `${dispositionType}; filename="${encodeURIComponent(fileName)}"`;

    // 4. Handle base64 Data URI
    if (application.resumeUrl.startsWith("data:")) {
      const commaIdx = application.resumeUrl.indexOf(",");
      const meta = application.resumeUrl.substring(5, commaIdx);
      const base64Data = application.resumeUrl.substring(commaIdx + 1);

      const mimeType = meta.split(";")[0] || "application/pdf";
      const buffer = Buffer.from(base64Data, "base64");

      return new Response(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": contentDisposition,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // 5. Handle external or R2 URL: fetch and pipe with authorized headers
    try {
      const externalRes = await fetch(application.resumeUrl);
      if (!externalRes.ok) {
        throw new Error(`Failed to fetch file from remote storage: ${externalRes.status}`);
      }

      const contentType = externalRes.headers.get("content-type") || "application/pdf";
      const arrayBuffer = await externalRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Response(buffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": contentDisposition,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch (fetchErr) {
      console.error("Error streaming resume from remote storage:", fetchErr);
      return NextResponse.json(
        { success: false, message: "The resume could not be opened. Please try again." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error serving candidate resume:", error);
    return NextResponse.json(
      { success: false, message: "The resume could not be opened. Please try again." },
      { status: 500 }
    );
  }
}
