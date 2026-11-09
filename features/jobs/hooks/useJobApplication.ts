"use client";

import { useState } from "react";
import { submitJobApplication } from "@/features/jobs/services/jobs.service";

export function useJobApplication(jobId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    isSubmitting,
    submitApplication: async (formData: FormData) => {
      setIsSubmitting(true);
      try {
        return await submitJobApplication(jobId, formData);
      } finally {
        setIsSubmitting(false);
      }
    },
  };
}
