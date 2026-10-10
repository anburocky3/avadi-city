import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import ApplicantsClient, { ApplicantItem, JobMeta } from "./applicants-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobApplicantsPage({ params }: PageProps) {
  const { jobId } = await params;

  // 1. Authenticate user from session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;

  if (!token) {
    redirect(`/login?redirect=/jobs/${jobId}/applicants`);
  }

  const session = await verifyAuthToken(token);
  if (!session?.userId) {
    redirect(`/login?redirect=/jobs/${jobId}/applicants`);
  }

  // 2. Fetch job vacancy and verify ownership
  let dbJob = null;
  try {
    dbJob = await prisma.jobVacancy.findUnique({
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
  }

  if (!dbJob) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto text-center space-y-4 pt-16">
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Job Vacancy Not Found
        </h1>
        <p className="text-xs text-slate-500">
          The requested job vacancy does not exist or may have been removed.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500 text-white text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Return to Job Vacancies</span>
        </Link>
      </div>
    );
  }

  // 3. Security: ensure current user owns this job
  if (dbJob.ownerId !== session.userId) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto text-center space-y-4 pt-16">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Access Denied
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have permission to view or manage applicants for this job vacancy. Only the employer who posted this vacancy may manage candidate applications.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
        >
          <ArrowLeft size={14} />
          <span>Return to Jobs</span>
        </Link>
      </div>
    );
  }

  // 4. Fetch real applications for this job
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
    resumeFileName: string | null;
    status: any;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  try {
    rawApplications = await prisma.jobApplication.findMany({
      where: { jobId: dbJob.id },
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
  } catch (error) {
    console.error("Database error fetching applications:", error);
  }

  const initialApplications: ApplicantItem[] = rawApplications.map((app) => ({
    id: app.id,
    fullName: app.fullName,
    email: app.email,
    phone: app.phone,
    coverLetter: app.coverLetter,
    qualification: app.qualification,
    experience: app.experience,
    skills: app.skills,
    portfolioUrl: app.portfolioUrl,
    resumeFileName: app.resumeFileName,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt?.toISOString(),
  }));

  const jobMeta: JobMeta = {
    id: dbJob.id,
    role: dbJob.role,
    businessName: dbJob.businessName,
    location: dbJob.location,
    ward: dbJob.ward,
    status: dbJob.status,
    jobType: dbJob.jobType,
    workMode: dbJob.workMode,
  };

  return (
    <ApplicantsClient
      job={jobMeta}
      initialApplications={initialApplications}
    />
  );
}
