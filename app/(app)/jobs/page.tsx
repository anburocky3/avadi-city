import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { SkeletonLoader } from "@/components/shared-components";
import { JobsClient } from "@/features/jobs/components/jobs-client";
import { verifyAuthToken } from "@/lib/auth";
import { Metadata } from "next";
import { getJobsPageData } from "@/features/jobs/services/jobs.server";

export const metadata: Metadata = {
  title: "Jobs in Avadi - Avadi City Community Portal",
  description:
    "Find the latest job opportunities in and around Avadi that will help you grow your career.",
};

interface JobsPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedTab =
    resolvedSearchParams?.tab === "my-applications"
      ? "my-applications"
      : resolvedSearchParams?.tab === "my-jobs"
        ? "my-jobs"
        : "explore";

  // Pre-load authenticated user application info if logged in
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;
  let user: { id: string; email?: string | null } | null = null;

  if (token) {
    try {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        user = { id: session.userId, email: session.email };
      }
    } catch (error) {
      console.error("Failed to verify session for job dashboard:", error);
    }
  }

  const { jobs, userApplications, appliedCompanies } =
    await getJobsPageData(user);

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto md:max-w-full space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <JobsClient
        initialJobs={jobs}
        initialTab={requestedTab}
        initialApplications={userApplications}
        initialAppliedCompanies={appliedCompanies}
      />
    </Suspense>
  );
}
