import React, { Suspense } from "react";
import { initialJobsData } from "@/data/jobSpots";
import { SkeletonLoader } from "@/components/shared-components";
import { JobsClient, JobVacancy } from "./jobs-client";
import { prisma } from "@/lib/prisma";
import Head from "next/head";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs in Avadi - Avadi City Community Portal",
  description:
    "Find the latest job opportunities in and around Avadim that will help you grow your career.",
};

export default async function JobsPage() {
  let jobs: JobVacancy[] = (initialJobsData || []) as JobVacancy[];

  try {
    const dbJobs = await prisma.jobVacancy.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    if (dbJobs && dbJobs.length > 0) {
      const mappedDbJobs: JobVacancy[] = dbJobs.map((j) => {
        let reqs: string[] | undefined = undefined;
        if (j.requirements) {
          try {
            reqs = JSON.parse(j.requirements);
          } catch {
            reqs = j.requirements
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
        return {
          id: j.id,
          role: j.role,
          businessName: j.businessName,
          category: j.category,
          jobType: j.jobType,
          postedTime: "Recently",
          salary: j.salary,
          location: j.location
            ? `${j.location} (Ward ${j.ward})`
            : `Ward ${j.ward}, Avadi`,
          shift: j.shift || undefined,
          contact: j.contact,
          ward: j.ward,
          details: j.details,
          requirements: reqs,
          qualifications: j.qualifications || undefined,
          imageUrl: j.imageUrl || null,
        };
      });

      const dbJobIds = new Set(mappedDbJobs.map((j) => j.id));
      const remainingInitial = ((initialJobsData || []) as JobVacancy[]).filter(
        (ij) => !dbJobIds.has(ij.id),
      );

      jobs = [...mappedDbJobs, ...remainingInitial];
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err?.code === "P2021" || err?.message?.includes("does not exist")) {
      console.warn(
        "Notice: Table `job_vacancies` not yet initialized in database. Displaying default Avadi job vacancies.",
      );
    } else {
      console.warn(
        "Notice: Database unavailable for jobs query. Falling back to default job vacancies.",
        err?.message || error,
      );
    }
    jobs = (initialJobsData || []) as JobVacancy[];
  }

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
