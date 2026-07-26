import React, { Suspense } from "react";
import { initialJobsData } from "@/data/jobSpots";
import { SkeletonLoader } from "@/components/shared-components";
import { JobsClient, JobVacancy } from "./jobs-client";

export const revalidate = 3600; // 1 hour cache or 0 for dynamic SSR

export default async function JobsPage() {
  const jobs: JobVacancy[] = (initialJobsData || []) as JobVacancy[];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <JobsClient initialJobs={jobs} />
    </Suspense>
  );
}
