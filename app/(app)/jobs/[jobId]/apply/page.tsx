import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { verifyAuthToken } from "@/lib/auth";
import { JobApplyClient } from "@/features/jobs/components/job-apply";
import {
  getExistingCompanyApplication,
  getJobApplicationProfile,
  getJobApplyPageData,
} from "@/features/jobs/services/jobs.server";
import type { JobProfile } from "@/features/jobs/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Apply for a Job in Avadi",
  description:
    "Submit an application for a local job opportunity listed on Avadi City.",
};

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobApplyPage({ params }: PageProps) {
  const { jobId } = await params;

  // 1. Fetch authenticated user profile to auto-populate email and phone (FIX 4)
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;
  let userProfile: JobProfile | null = null;
  let currentUserId: string | null = null;

  if (token) {
    try {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        currentUserId = session.userId;
        userProfile = await getJobApplicationProfile(session.userId);
      }
    } catch (authErr) {
      console.warn(
        "Could not retrieve logged in user for application form:",
        authErr,
      );
    }
  }

  const { job, jobOwnerId, jobOwnerEmail } = await getJobApplyPageData(jobId);

  // If not found, display clear not-found message
  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4">
        <div className="max-w-md mx-auto md:max-w-full text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Job Vacancy Unavailable
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This job vacancy is no longer accepting applications or the link has
            expired.
          </p>
          <div className="pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition shadow-lg shadow-orange-500/20"
            >
              <ArrowLeft size={16} />
              <span>Explore Other Avadi Jobs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is the owner/employer who posted this job vacancy
  const isOwner = Boolean(
    (currentUserId && jobOwnerId && currentUserId === jobOwnerId) ||
    (userProfile?.email &&
      jobOwnerEmail &&
      userProfile.email.trim().toLowerCase() ===
        jobOwnerEmail.trim().toLowerCase()),
  );

  if (isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4">
        <div className="max-w-md mx-auto md:max-w-full text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Users size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Your Own Job Posting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You posted this job vacancy for{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {job.businessName}
            </strong>
            . Employers cannot apply to their own job vacancies. You can manage
            and review candidates who applied for this role under Manage
            Applicants.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/jobs/${job.id}/applicants`}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Users size={16} />
              <span>Manage Applicants</span>
            </Link>
            <Link
              href="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Jobs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if authenticated user has already applied to this company
  let existingCompanyApp: {
    id: string;
    role?: string;
    businessName?: string;
  } | null = null;
  if (currentUserId && job?.businessName) {
    existingCompanyApp = await getExistingCompanyApplication(
      currentUserId,
      userProfile?.email,
      job.businessName,
    );
  }

  if (existingCompanyApp) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Already Applied to {job.businessName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You have already applied to a vacancy at this company
            {existingCompanyApp.role ? ` (${existingCompanyApp.role})` : ""}.
            You can track your existing application under My Applications.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/jobs?tab=my-applications"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs transition shadow-lg shadow-primary/20"
            >
              <span>View My Applications</span>
            </Link>
            <Link
              href="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs transition"
            >
              <span>Explore Vacancies</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <JobApplyClient job={job} initialProfile={userProfile} />;
}
