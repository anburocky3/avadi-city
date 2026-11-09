"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMyApplications,
  getMyJobs,
} from "@/features/jobs/services/jobs.service";
import type {
  JobVacancy,
  UserApplication,
} from "@/features/jobs/types";

interface UseJobsDashboardOptions {
  isAuthenticated: boolean;
  activeTab: "explore" | "my-applications" | "my-jobs";
  initialApplications: UserApplication[];
  initialAppliedCompanies: string[];
}

export function useJobsDashboard({
  isAuthenticated,
  activeTab,
  initialApplications,
  initialAppliedCompanies,
}: UseJobsDashboardOptions) {
  const [myApplications, setMyApplications] =
    useState<UserApplication[]>(initialApplications);
  const [appliedCompanies, setAppliedCompanies] = useState<string[]>(
    initialAppliedCompanies,
  );
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [hasLoadedApplications, setHasLoadedApplications] = useState(
    initialApplications.length > 0,
  );
  const [myJobs, setMyJobs] = useState<JobVacancy[]>([]);
  const [isLoadingMyJobs, setIsLoadingMyJobs] = useState(false);
  const [hasLoadedMyJobs, setHasLoadedMyJobs] = useState(false);

  const fetchMyApplications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingApplications(true);
    try {
      const result = await getMyApplications();
      setMyApplications(result.applications);
      setAppliedCompanies(result.appliedCompanies);
    } catch (error) {
      console.error("Failed to load user applications:", error);
    } finally {
      setIsLoadingApplications(false);
      setHasLoadedApplications(true);
    }
  }, [isAuthenticated]);

  const fetchMyJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingMyJobs(true);
    try {
      setMyJobs(await getMyJobs());
    } catch (error) {
      console.error("Failed to load user jobs:", error);
    } finally {
      setIsLoadingMyJobs(false);
      setHasLoadedMyJobs(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (
      isAuthenticated &&
      (activeTab === "my-applications" || activeTab === "explore") &&
      !hasLoadedApplications
    ) {
      void fetchMyApplications();
    }
  }, [
    activeTab,
    fetchMyApplications,
    hasLoadedApplications,
    isAuthenticated,
  ]);

  useEffect(() => {
    if (activeTab === "my-jobs" && !hasLoadedMyJobs && isAuthenticated) {
      void fetchMyJobs();
    }
  }, [activeTab, fetchMyJobs, hasLoadedMyJobs, isAuthenticated]);

  return {
    myApplications,
    setMyApplications,
    appliedCompanies,
    isLoadingApplications,
    hasLoadedApplications,
    fetchMyApplications,
    myJobs,
    setMyJobs,
    isLoadingMyJobs,
    hasLoadedMyJobs,
    fetchMyJobs,
  };
}
