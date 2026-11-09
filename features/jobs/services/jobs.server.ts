import { initialJobsData } from "@/data/jobSpots";
import { prisma } from "@/lib/prisma";
import type {
  ApplicantItem,
  ApplicationStatusType,
  JobDetailSummary,
  JobMeta,
  JobProfile,
  JobVacancy,
  UserApplication,
} from "@/features/jobs/types";

export interface JobsPageData {
  jobs: JobVacancy[];
  userApplications: UserApplication[];
  appliedCompanies: string[];
}

export interface JobDetailRecord {
  id: string;
  role: string;
  businessName: string;
  category?: string | null;
  jobType?: string | null;
  workMode?: string | null;
  experience?: string | null;
  salary: string;
  salaryType?: string | null;
  details: string;
  requirements?: string | null;
  location?: string | null;
  ward: number;
  address?: string | null;
  contact: string;
  status: string;
  featured?: boolean;
  openings?: number;
  ownerId?: string;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  shift?: string | null;
  workingDays?: string | null;
  qualifications?: string | null;
  _count: { applications: number };
}

export interface JobApplyPageData {
  job: JobDetailSummary | null;
  jobOwnerId: string | null;
  jobOwnerEmail: string | null;
}

export interface ExistingCompanyApplication {
  id: string;
  role?: string;
  businessName?: string;
}

export async function getJobApplicationProfile(
  userId: string,
): Promise<JobProfile | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });
    if (!user) return null;

    return {
      name: user.name || undefined,
      email: user.email || undefined,
      phone: user.phone || undefined,
    };
  } catch (error) {
    console.warn("Could not retrieve logged in user for application form:", error);
    return null;
  }
}

export async function getJobApplyPageData(
  jobId: string,
): Promise<JobApplyPageData> {
  let job: JobDetailSummary | null = null;
  let jobOwnerId: string | null = null;
  let jobOwnerEmail: string | null = null;

  try {
    const record = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      include: { user: { select: { email: true } } },
    });

    if (record?.status === "APPROVED") {
      jobOwnerId = record.ownerId;
      jobOwnerEmail = record.user?.email || null;
      job = {
        id: record.id,
        role: record.role,
        businessName: record.businessName,
        location: record.location
          ? `${record.location} (Ward ${record.ward})`
          : `Ward ${record.ward}, Avadi`,
        salary: record.salary,
        jobType: record.jobType,
        workMode: record.workMode,
        qualifications: record.qualifications || undefined,
        details: record.details,
      };
    }
  } catch (error) {
    console.warn("Could not query Prisma for job vacancy:", error);
  }

  if (!job) {
    const seed = initialJobsData.find((item) => item.id === jobId);
    if (seed) {
      job = {
        id: seed.id,
        role: seed.role,
        businessName: seed.businessName,
        location: seed.location,
        salary: seed.salary,
        jobType: seed.jobType,
        workMode: "On-site",
        qualifications: seed.qualifications,
        details: seed.details,
      };
    }
  }

  return { job, jobOwnerId, jobOwnerEmail };
}

export async function getExistingCompanyApplication(
  userId: string,
  email: string | undefined,
  businessName: string,
): Promise<ExistingCompanyApplication | null> {
  try {
    const application = await prisma.jobApplication.findFirst({
      where: {
        OR: [
          { applicantId: userId },
          ...(email ? [{ email: email.toLowerCase() }] : []),
        ],
        job: { businessName: { equals: businessName.trim() } },
      },
      include: { job: { select: { role: true, businessName: true } } },
    });

    if (!application) return null;
    return {
      id: application.id,
      role: application.job?.role,
      businessName: application.job?.businessName,
    };
  } catch (error) {
    console.warn("Could not check existing company applications:", error);
    return null;
  }
}

export async function getJobApplicantsPageData(
  jobId: string,
  userId: string,
): Promise<{
  job: JobMeta | null;
  isOwner: boolean;
  applications: ApplicantItem[];
}> {
  let record;
  try {
    record = await prisma.jobVacancy.findUnique({
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
  } catch (error) {
    console.error("Database error looking up job:", error);
    return { job: null, isOwner: false, applications: [] };
  }

  if (!record) return { job: null, isOwner: false, applications: [] };

  const job: JobMeta = {
    id: record.id,
    role: record.role,
    businessName: record.businessName,
    location: record.location,
    ward: record.ward,
    status: record.status,
    jobType: record.jobType,
    workMode: record.workMode,
  };
  const isOwner = record.ownerId === userId;
  if (!isOwner) return { job, isOwner, applications: [] };

  let rawApplications: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    coverLetter: string | null;
    qualification: string | null;
    experience: string | null;
    skills: string | null;
    portfolioUrl: string | null;
    resumeUrl: string;
    resumeFileName: string | null;
    status: ApplicationStatusType;
    user: { avatar: string | null } | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    rawApplications = await prisma.jobApplication.findMany({
      where: { jobId: record.id },
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
        resumeUrl: true,
        resumeFileName: true,
        status: true,
        user: { select: { avatar: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Database error fetching applications:", error);
  }

  const missingAvatarEmails = rawApplications
    .filter((application) => !application.user?.avatar && application.email)
    .map((application) => application.email.toLowerCase());
  const emailAvatarMap = new Map<string, string>();

  if (missingAvatarEmails.length > 0) {
    try {
      const users = await prisma.user.findMany({
        where: { email: { in: missingAvatarEmails } },
        select: { email: true, avatar: true },
      });
      users.forEach((user) => {
        if (user.avatar) emailAvatarMap.set(user.email.toLowerCase(), user.avatar);
      });
    } catch (error) {
      console.warn("Could not query user avatars by email:", error);
    }
  }

  return {
    job,
    isOwner,
    applications: rawApplications.map((application) => ({
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      avatar:
        application.user?.avatar ||
        emailAvatarMap.get(application.email.toLowerCase()) ||
        null,
      hasResume: Boolean(application.resumeUrl.trim()),
      coverLetter: application.coverLetter,
      qualification: application.qualification,
      experience: application.experience,
      skills: application.skills,
      portfolioUrl: application.portfolioUrl,
      resumeFileName: application.resumeFileName,
      status: application.status,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    })),
  };
}

export async function hasAppliedToCompany(
  userId: string,
  businessName: string,
  ownerId?: string,
): Promise<boolean> {
  try {
    const application = await prisma.jobApplication.findFirst({
      where: {
        applicantId: userId,
        job: {
          OR: [
            { businessName: { equals: businessName.trim() } },
            ...(ownerId ? [{ ownerId }] : []),
          ],
        },
      },
      select: { id: true },
    });
    return Boolean(application);
  } catch (error) {
    console.warn("Could not check whether user applied to this company:", error);
    return false;
  }
}

export async function getJobsPageData(
  user?: { id: string; email?: string | null } | null,
): Promise<JobsPageData> {
  let userApplications: UserApplication[] = [];
  let appliedCompanies: string[] = [];

  if (user) {
    try {
      const applications = await prisma.jobApplication.findMany({
        where: {
          OR: [
            { applicantId: user.id },
            ...(user.email ? [{ email: user.email.trim().toLowerCase() }] : []),
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

      userApplications = applications.map((application) => ({
        ...application,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      }));
      appliedCompanies = [
        ...new Set(
          applications
            .map((application) =>
              application.job?.businessName.trim().toLowerCase(),
            )
            .filter((name): name is string => Boolean(name)),
        ),
      ];
    } catch (error) {
      console.error("Failed to load user job applications:", error);
    }
  }

  const seedJobs = (initialJobsData || []) as JobVacancy[];
  let jobs = seedJobs;

  try {
    const records = await prisma.jobVacancy.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    const databaseJobs: JobVacancy[] = records.map((job) => {
      let requirements: string[] | undefined;
      if (job.requirements) {
        try {
          const parsed: unknown = JSON.parse(job.requirements);
          requirements = Array.isArray(parsed)
            ? parsed.filter(
                (requirement): requirement is string =>
                  typeof requirement === "string",
              )
            : [];
        } catch {
          requirements = job.requirements
            .split(",")
            .map((requirement) => requirement.trim())
            .filter(Boolean);
        }
      }

      return {
        id: job.id,
        role: job.role,
        businessName: job.businessName,
        category: job.category,
        jobType: job.jobType,
        postedTime: "Recently",
        salary: job.salary,
        location: job.location
          ? `${job.location} (Ward ${job.ward})`
          : `Ward ${job.ward}, Avadi`,
        shift: job.shift || undefined,
        contact: job.contact,
        ward: job.ward,
        details: job.details,
        requirements,
        qualifications: job.qualifications || undefined,
        imageUrl: job.imageUrl || null,
        featured: Boolean(job.featured),
        latitude: job.latitude ?? null,
        longitude: job.longitude ?? null,
        address: job.address || undefined,
        ownerId: job.ownerId,
      };
    });

    const databaseIds = new Set(databaseJobs.map((job) => job.id));
    jobs = [
      ...databaseJobs,
      ...seedJobs.filter((job) => !databaseIds.has(job.id)),
    ];
  } catch (error) {
    console.warn(
      "Database unavailable for jobs query. Falling back to default Avadi job vacancies.",
      error,
    );
  }

  return { jobs, userApplications, appliedCompanies };
}

export async function getJobDetailRecord(
  jobId: string,
): Promise<JobDetailRecord | null> {
  try {
    const record = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      include: { _count: { select: { applications: true } } },
    });
    if (record) {
      return {
        id: record.id,
        role: record.role,
        businessName: record.businessName,
        category: record.category,
        jobType: record.jobType,
        workMode: record.workMode,
        experience: record.experience,
        salary: record.salary,
        salaryType: record.salaryType,
        details: record.details,
        requirements: record.requirements,
        location: record.location,
        ward: record.ward,
        address: record.address,
        contact: record.contact,
        status: record.status,
        featured: record.featured,
        openings: record.openings,
        ownerId: record.ownerId,
        imageUrl: record.imageUrl,
        latitude: record.latitude,
        longitude: record.longitude,
        shift: record.shift,
        workingDays: record.workingDays,
        qualifications: record.qualifications,
        _count: record._count,
      };
    }
  } catch (error) {
    console.error("Error looking up job vacancy:", error);
  }

  const seed = initialJobsData.find((job) => job.id === jobId);
  if (!seed) return null;

  return {
    id: seed.id,
    role: seed.role,
    businessName: seed.businessName,
    category: "Retail",
    jobType: seed.jobType || "Full-Time",
    workMode: "On-site",
    experience: "0–1 Years",
    salary: seed.salary,
    salaryType: "Per Month",
    details: seed.details,
    requirements: JSON.stringify(seed.requirements || []),
    location: seed.location,
    ward: seed.ward,
    address: seed.location,
    contact: seed.contact,
    status: "APPROVED",
    featured: Boolean(seed.featured),
    openings: 1,
    imageUrl: null,
    _count: { applications: 0 },
  };
}
