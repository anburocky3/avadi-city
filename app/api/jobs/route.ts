import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as zod from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { r2Client, BUCKET_NAME, PUBLIC_R2_DOMAIN } from "@/lib/r2";

const createJobSchema = zod.object({
  role: zod.string().trim().min(2, "Job Title must be at least 2 characters").max(120),
  category: zod.string().trim().min(2, "Job Category is required"),
  jobType: zod.string().trim().min(2, "Employment Type is required"),
  workMode: zod.string().trim().default("On-site"),
  experience: zod.string().trim().min(1, "Experience Required is required"),
  salary: zod.string().trim().min(2, "Salary information is required"),
  minSalary: zod.coerce.number().optional().nullable(),
  maxSalary: zod.coerce.number().optional().nullable(),
  salaryType: zod.string().trim().optional().nullable(),

  businessName: zod.string().trim().min(2, "Company / Employer Name must be at least 2 characters").max(150),
  companyDescription: zod.string().trim().max(3000).optional().nullable(),
  details: zod.string().trim().min(10, "Job Description must be at least 10 characters").max(4000),
  requirements: zod.string().optional().nullable(),
  qualifications: zod.string().trim().optional().nullable(),
  openings: zod.coerce.number().int().min(1, "Number of openings must be at least 1").default(1),
  gender: zod.string().trim().default("Any"),
  minAge: zod.coerce.number().int().min(18).optional().nullable(),
  maxAge: zod.coerce.number().int().max(100).optional().nullable(),

  location: zod.string().trim().min(2, "Area / Street is required"),
  ward: zod.coerce.number().int().min(1, "Ward must be between 1 and 48").max(48, "Ward must be between 1 and 48"),
  address: zod.string().trim().min(3, "Detailed Address must be at least 3 characters").max(400),
  latitude: zod.coerce.number().optional().nullable(),
  longitude: zod.coerce.number().optional().nullable(),
  workingDays: zod.string().optional().nullable(),
  shift: zod.string().trim().optional().nullable(),

  applicationMethods: zod.string().optional().nullable(),
  contact: zod
    .string()
    .trim()
    .min(10, "Contact Phone must be at least 10 digits")
    .max(15, "Contact Phone is too long"),
  email: zod
    .string()
    .trim()
    .email("Please enter a valid email address")
    .optional()
    .or(zod.literal(""))
    .nullable(),
  website: zod.string().trim().max(250).optional().nullable(),
  interviewAddress: zod.string().trim().max(400).optional().nullable(),
  interviewContactPerson: zod.string().trim().max(100).optional().nullable(),
  interviewDate: zod.string().trim().optional().nullable(),
  interviewTime: zod.string().trim().optional().nullable(),
  deadline: zod.string().trim().optional().nullable(),
  startDate: zod.string().trim().optional().nullable(),
  additionalInfo: zod.string().trim().max(3000).optional().nullable(),
  termsAccepted: zod.coerce.boolean().refine((val) => val === true, {
    message: "Please accept the Terms & Conditions before posting the vacancy.",
  }),
});

async function uploadImageFile(file: File | null, folder: string): Promise<string | null> {
  if (!file || file.size === 0 || !file.type.startsWith("image/")) return null;
  const isR2Configured = Boolean(
    BUCKET_NAME &&
    PUBLIC_R2_DOMAIN &&
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  );

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (isR2Configured) {
    try {
      const rawExt = file.type.split("/")[1] || "jpg";
      const ext = rawExt === "jpeg" ? "jpg" : rawExt;
      const fileKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      return `${PUBLIC_R2_DOMAIN}/${fileKey}`;
    } catch {
      return `data:${file.type};base64,${buffer.toString("base64")}`;
    }
  } else {
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wardParam = searchParams.get("ward");
    const categoryParam = searchParams.get("category");
    const typeParam = searchParams.get("type");
    const statusParam = searchParams.get("status") || "APPROVED";
    const myParam = searchParams.get("my");

    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;
    let currentUserId: string | null = null;

    if (token) {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        currentUserId = session.userId;
      }
    }

    const whereClause: any = {};

    if (myParam === "true") {
      if (!currentUserId) {
        return NextResponse.json(
          { success: false, message: "Authentication required to view your job postings." },
          { status: 401 }
        );
      }
      whereClause.ownerId = currentUserId;
    } else {
      whereClause.status = statusParam;
    }

    if (wardParam) {
      const wardNum = parseInt(wardParam, 10);
      if (!isNaN(wardNum)) {
        whereClause.ward = wardNum;
      }
    }

    if (categoryParam && categoryParam !== "All") {
      whereClause.category = categoryParam;
    }

    if (typeParam && typeParam !== "All") {
      whereClause.jobType = typeParam;
    }

    const jobs = await prisma.jobVacancy.findMany({
      where: whereClause,
      include: {
        applications: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedJobs = jobs.map((job) => {
      const apps = job.applications || [];
      const totalApplications = apps.length;
      const newApplications = apps.filter((a) => a.status === "SUBMITTED").length;
      const { applications: _apps, ...rest } = job;
      return {
        ...rest,
        totalApplications,
        newApplications,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedJobs,
    });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch job vacancies." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user from session cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("avadi_session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required to post a job vacancy." },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required to post a job vacancy." },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();

    const rawData = {
      role: formData.get("role")?.toString() || "",
      category: formData.get("category")?.toString() || "",
      jobType: formData.get("jobType")?.toString() || "",
      workMode: formData.get("workMode")?.toString() || "On-site",
      experience: formData.get("experience")?.toString() || "",
      salary: formData.get("salary")?.toString() || "",
      minSalary: formData.get("minSalary") ? Number(formData.get("minSalary")) : null,
      maxSalary: formData.get("maxSalary") ? Number(formData.get("maxSalary")) : null,
      salaryType: formData.get("salaryType")?.toString() || "Per Month",

      businessName: formData.get("businessName")?.toString() || "",
      companyDescription: formData.get("companyDescription")?.toString() || null,
      details: formData.get("details")?.toString() || "",
      requirements: formData.get("requirements")?.toString() || null,
      qualifications: formData.get("qualifications")?.toString() || null,
      openings: formData.get("openings") ? Number(formData.get("openings")) : 1,
      gender: formData.get("gender")?.toString() || "Any",
      minAge: formData.get("minAge") ? Number(formData.get("minAge")) : null,
      maxAge: formData.get("maxAge") ? Number(formData.get("maxAge")) : null,

      location: formData.get("location")?.toString() || "",
      ward: formData.get("ward") ? Number(formData.get("ward")) : 1,
      address: formData.get("address")?.toString() || "",
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
      workingDays: formData.get("workingDays")?.toString() || null,
      shift: formData.get("shift")?.toString() || null,

      applicationMethods: formData.get("applicationMethods")?.toString() || null,
      contact: formData.get("contact")?.toString() || "",
      email: formData.get("email")?.toString() || null,
      website: formData.get("website")?.toString() || null,
      interviewAddress: formData.get("interviewAddress")?.toString() || null,
      interviewContactPerson: formData.get("interviewContactPerson")?.toString() || null,
      interviewDate: formData.get("interviewDate")?.toString() || null,
      interviewTime: formData.get("interviewTime")?.toString() || null,
      deadline: formData.get("deadline")?.toString() || null,
      startDate: formData.get("startDate")?.toString() || null,
      additionalInfo: formData.get("additionalInfo")?.toString() || null,
      termsAccepted: formData.get("termsAccepted") === "true",
    };

    const parsed = createJobSchema.safeParse(rawData);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json(
        {
          success: false,
          message: firstErrorMessage,
          errors: fieldErrors,
        },
        { status: 400 }
      );
    }

    const valid = parsed.data;

    // 3. Handle image upload if provided
    let finalImageUrl: string | null = null;
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      finalImageUrl = await uploadImageFile(imageFile, "jobs");
    }

    // 4. Save to Database via Prisma (status="PENDING", ownerId=userId)
    const newJob = await prisma.jobVacancy.create({
      data: {
        role: valid.role,
        category: valid.category,
        jobType: valid.jobType,
        workMode: valid.workMode || "On-site",
        experience: valid.experience,
        salary: valid.salary,
        minSalary: valid.minSalary || null,
        maxSalary: valid.maxSalary || null,
        salaryType: valid.salaryType || "Per Month",

        businessName: valid.businessName,
        companyDescription: valid.companyDescription || null,
        details: valid.details,
        requirements: valid.requirements || null,
        qualifications: valid.qualifications || null,
        openings: valid.openings || 1,
        gender: valid.gender || "Any",
        minAge: valid.minAge || null,
        maxAge: valid.maxAge || null,

        location: valid.location,
        ward: valid.ward,
        address: valid.address,
        latitude: valid.latitude || null,
        longitude: valid.longitude || null,
        workingDays: valid.workingDays || null,
        shift: valid.shift || null,

        applicationMethods: valid.applicationMethods || null,
        contact: valid.contact,
        email: valid.email || null,
        website: valid.website || null,
        interviewAddress: valid.interviewAddress || null,
        interviewContactPerson: valid.interviewContactPerson || null,
        interviewDate: valid.interviewDate || null,
        interviewTime: valid.interviewTime || null,
        deadline: valid.deadline || null,
        startDate: valid.startDate || null,
        imageUrl: finalImageUrl,
        additionalInfo: valid.additionalInfo || null,

        status: "PENDING",
        ownerId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: newJob,
      message: `${valid.role} at ${valid.businessName} has been submitted and is waiting for admin review.`,
    });
  } catch (error: any) {
    console.error("Failed to create job vacancy:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error while saving job vacancy.",
      },
      { status: 500 }
    );
  }
}
