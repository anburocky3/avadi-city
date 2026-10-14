import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { initialJobsData } from "@/data/jobSpots";
import { SkeletonLoader } from "@/components/shared-components";
import { JobsClient, JobVacancy, UserApplication } from "./jobs-client";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

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
  let appliedCompanies: string[] = [];
  let userApplications: UserApplication[] = [];

  if (token) {
    try {
      const session = await verifyAuthToken(token);
      if (session?.userId) {
        const apps = await prisma.jobApplication.findMany({
          where: {
            OR: [
              { applicantId: session.userId },
              ...(session.email ? [{ email: session.email.trim().toLowerCase() }] : []),
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

        userApplications = apps.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        }));

        const set = new Set<string>();
        apps.forEach((a) => {
          if (a.job?.businessName) {
            set.add(a.job.businessName.trim().toLowerCase());
          }
        });
        appliedCompanies = Array.from(set);
      }
    } catch {
      // ignore
    }
  }

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
          featured: Boolean(j.featured),
          latitude: j.latitude ?? null,
          longitude: j.longitude ?? null,
          address: j.address || undefined,
          ownerId: j.ownerId,
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
      <JobsClient
        initialJobs={jobs}
        initialTab={requestedTab}
        initialApplications={userApplications}
        initialAppliedCompanies={appliedCompanies}
      />
    </Suspense>
  );
}
