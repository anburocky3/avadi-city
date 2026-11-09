import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { verifyAuthToken } from "@/lib/auth";
import ApplicantsClient from "@/features/jobs/components/job-applicants";
import { getJobApplicantsPageData } from "@/features/jobs/services/jobs.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Job Applicants",
  description:
    "Review applications for your Avadi City job listing and manage candidates.",
};

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

  const { job, isOwner, applications } = await getJobApplicantsPageData(
    jobId,
    session.userId,
  );

  if (!job) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto md:max-w-full text-center space-y-4 pt-16">
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
  if (!isOwner) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto text-center space-y-4 pt-16">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Access Denied
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have permission to view or manage applicants for this job
          vacancy. Only the employer who posted this vacancy may manage
          candidate applications.
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

  return <ApplicantsClient job={job} initialApplications={applications} />;
}
