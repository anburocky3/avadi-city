"use client";

import { useState } from "react";
import { updateApplicantStatus } from "@/features/jobs/services/jobs.service";
import type { ApplicationStatusType } from "@/features/jobs/types";

export function useApplicantStatus(jobId: string) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  return {
    updatingId,
    updateStatus: async (
      applicantId: string,
      status: ApplicationStatusType,
    ) => {
      setUpdatingId(applicantId);
      try {
        await updateApplicantStatus(jobId, applicantId, status);
      } finally {
        setUpdatingId(null);
      }
    },
  };
}
