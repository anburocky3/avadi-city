import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";
import { initialJobsData } from "@/data/jobSpots";

// Server-side validation schema for candidate details (FIX 5 - Uppercase Full Name)
const applySchema = zod.object({
  fullName: zod
    .string()
    .min(1, "Please enter your full name.")
    .refine((val) => val.trim().length > 0, {
      message: "Please enter your full name.",
    })
    .refine((val) => /^[A-Z]/.test(val.trim()), {
      message: "Please start your name with an uppercase letter.",
    })
    .max(120, "Full Name is too long"),
  email: zod
    .string()
    .trim()
    .email("Please provide a valid email address"),
  phone: zod
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number"),
  coverLetter: zod.string().trim().max(3000).optional().nullable(),
  qualification: zod.string().trim().max(100).optional().nullable(),
  experience: zod.string().trim().max(500).optional().nullable(),
  skills: zod.string().trim().max(500).optional().nullable(),
  portfolioUrl: zod
    .string()
    .trim()
    .url("Portfolio or profile must be a valid URL")
    .optional()
    .or(zod.literal(""))
    .nullable(),
});

// Helper to upload resume to Cloudflare R2 or persistent data URI fallback (FIX 3 - PDF only)
async function uploadResumeFile(file: File): Promise<{ url: string; fileName: string }> {
  const allowedExtensions = [".pdf"];
  const fileName = file.name || "resume.pdf";
  const fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

  if (!allowedExtensions.includes(fileExt) || (file.type && file.type !== "application/pdf")) {
    throw new Error("Please upload a PDF file only.");
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    throw new Error("Resume file exceeds 5MB size limit. Please upload a smaller file.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const isR2Configured = Boolean(
    BUCKET_NAME &&
    PUBLIC_R2_DOMAIN &&
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  );

  if (isR2Configured) {
    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileKey = `resumes/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        })
      );

      return {
        url: `${PUBLIC_R2_DOMAIN}/${fileKey}`,
        fileName,
      };
    } catch (err) {
      console.warn("R2 upload error, falling back to data URI storage:", err);
      const mime = file.type || "application/pdf";
      return {
        url: `data:${mime};base64,${buffer.toString("base64")}`,
        fileName,
      };
    }
  }

  const mime = file.type || "application/pdf";
  return {
    url: `data:${mime};base64,${buffer.toString("base64")}`,
    fileName,
  };
}

export async function POST(
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

    // 1. Authenticate user if session cookie is present
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let userId: string | null = null;

    if (token) {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        userId = session.userId;
      }
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const rawData = {
      fullName: (formData.get("fullName") as string) || "",
      email: (formData.get("email") as string) || "",
      phone: (formData.get("phone") as string) || "",
      coverLetter: (formData.get("coverLetter") as string) || null,
      qualification: (formData.get("qualification") as string) || null,
      experience: (formData.get("experience") as string) || null,
      skills: (formData.get("skills") as string) || null,
      portfolioUrl: (formData.get("portfolioUrl") as string) || null,
    };

    const validated = applySchema.safeParse(rawData);
    if (!validated.success) {
      const formattedErrors: Record<string, string> = {};
      validated.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString() || "form";
        formattedErrors[path] = issue.message;
      });
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required fields correctly.",
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // 3. Resume file is optional (FIX 5)
    const resumeFile = formData.get("resume") as File | null;

    // 4. Ensure target Job exists and is active
    let targetJob = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
    });

    if (!targetJob) {
      // Check if this is an approved seed job from initialJobsData
      const seedJob = initialJobsData.find((j) => j.id === jobId);
      if (seedJob) {
        try {
          const systemUser = await prisma.user.findFirst();
          if (systemUser) {
            targetJob = await prisma.jobVacancy.upsert({
              where: { id: seedJob.id },
              update: {},
              create: {
                id: seedJob.id,
                role: seedJob.role,
                category: "Retail",
                jobType: seedJob.jobType || "Full-Time",
                workMode: "On-site",
                experience: "0–1 Years",
                salary: seedJob.salary,
                businessName: seedJob.businessName,
                details: seedJob.details,
                requirements: JSON.stringify(seedJob.requirements || []),
                location: seedJob.location || "Avadi",
                ward: seedJob.ward || 22,
                address: seedJob.location || "Avadi",
                contact: seedJob.contact,
                status: "APPROVED",
                openings: 1,
                ownerId: systemUser.id,
              },
            });
          }
        } catch (seedErr) {
          console.warn("Could not upsert seed job into db:", seedErr);
        }
      }
    }

    if (!targetJob) {
      return NextResponse.json(
        {
          success: false,
          message: "The requested job vacancy was not found or is no longer available.",
        },
        { status: 404 }
      );
    }

    if (targetJob.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          message: "This job vacancy is currently not accepting applications.",
        },
        { status: 400 }
      );
    }

    // 4b. Prevent employer from applying to their own job vacancy
    if (userId && targetJob.ownerId && targetJob.ownerId === userId) {
      return NextResponse.json(
        {
          success: false,
          isOwner: true,
          message:
            "You cannot apply to your own job vacancy. You can review candidate applications under My Job Postings.",
        },
        { status: 403 }
      );
    }

    if (targetJob.ownerId) {
      const ownerUser = await prisma.user.findUnique({
        where: { id: targetJob.ownerId },
        select: { email: true },
      });
      if (
        ownerUser?.email &&
        ownerUser.email.trim().toLowerCase() === validated.data.email.trim().toLowerCase()
      ) {
        return NextResponse.json(
          {
            success: false,
            isOwner: true,
            message:
              "You cannot apply to your own job vacancy. You can review candidate applications under My Job Postings.",
          },
          { status: 403 }
        );
      }
    }

    // 5. Check for duplicate application (CRITICAL: One application per company restriction)
    const applicantEmail = validated.data.email.trim().toLowerCase();

    // Query for any existing application by this applicant (by userId or email)
    // to ANY vacancy belonging to this company (matched by normalized businessName or employer ownerId)
    const existingCompanyApplication = await prisma.jobApplication.findFirst({
      where: {
        OR: [
          ...(userId ? [{ applicantId: userId }] : []),
          { email: applicantEmail },
        ],
        job: {
          OR: [
            { businessName: { equals: targetJob.businessName.trim() } },
            ...(targetJob.ownerId ? [{ ownerId: targetJob.ownerId }] : []),
          ],
        },
      },
      include: {
        job: {
          select: {
            id: true,
            role: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    if (existingCompanyApplication) {
      return NextResponse.json(
        {
          success: false,
          alreadyApplied: true,
          message:
            "You have already applied to a vacancy at this company. You can track your existing application under My Applications.",
          existingApplication: {
            id: existingCompanyApplication.id,
            jobId: existingCompanyApplication.jobId,
            role: existingCompanyApplication.job?.role,
            businessName: existingCompanyApplication.job?.businessName,
            status: existingCompanyApplication.status,
          },
        },
        { status: 409 }
      );
    }

    // 6. Upload Resume (if provided - FIX 3)
    let uploadedResume: { url: string; fileName: string } | null = null;
    if (resumeFile && resumeFile.size > 0 && typeof resumeFile !== "string") {
      try {
        uploadedResume = await uploadResumeFile(resumeFile);
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error
            ? uploadErr.message
            : "Please upload a PDF file only.";
        return NextResponse.json(
          {
            success: false,
            message: msg,
            errors: { resume: msg },
          },
          { status: 400 }
        );
      }
    }

    // Determine applicant account ID
    let linkedUserId = userId;
    if (!linkedUserId && validated.data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.data.email.toLowerCase() },
        select: { id: true },
      });
      if (existingUser) {
        linkedUserId = existingUser.id;
      }
    }

    // 7. Persist application in Prisma
    const application = await prisma.jobApplication.create({
      data: {
        jobId: targetJob.id,
        applicantId: linkedUserId || null,
        fullName: validated.data.fullName,
        email: validated.data.email.toLowerCase(),
        phone: validated.data.phone,
        resumeUrl: uploadedResume?.url || "",
        resumeFileName: uploadedResume?.fileName || null,
        coverLetter: validated.data.coverLetter || null,
        qualification: validated.data.qualification || null,
        experience: validated.data.experience || null,
        skills: validated.data.skills || null,
        portfolioUrl: validated.data.portfolioUrl || null,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `✅ Application submitted successfully! Your application for ${targetJob.role} at ${targetJob.businessName} has been received.`,
      applicationId: application.id,
      jobRole: targetJob.role,
      businessName: targetJob.businessName,
    });
  } catch (error) {
    console.error("Error submitting job application:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected server error occurred while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}
