import React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { initialJobsData } from "@/data/jobSpots";
import { JobApplyClient, JobDetailSummary } from "./job-apply-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobApplyPage({ params }: PageProps) {
  const { jobId } = await params;

  let job: JobDetailSummary | null = null;

  try {
    // 1. Look up in Prisma database
    const dbJob = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
    });

    if (dbJob && dbJob.status === "APPROVED") {
      job = {
        id: dbJob.id,
        role: dbJob.role,
        businessName: dbJob.businessName,
        location: dbJob.location
          ? `${dbJob.location} (Ward ${dbJob.ward})`
          : `Ward ${dbJob.ward}, Avadi`,
        salary: dbJob.salary,
        jobType: dbJob.jobType,
        workMode: dbJob.workMode,
        qualifications: dbJob.qualifications || undefined,
        details: dbJob.details,
      };
    }
  } catch (err) {
    console.warn("Could not query Prisma for job vacancy:", err);
  }

  // 2. Fallback to initial seed jobs
  if (!job) {
    const seed = initialJobsData.find((j) => j.id === jobId);
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

  // If not found, display clear not-found message
  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Job Vacancy Unavailable
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            This job vacancy is no longer accepting applications or the link has expired.
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

  return <JobApplyClient job={job} />;
}
