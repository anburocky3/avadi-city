import React, { Suspense } from "react";

import { SkeletonLoader } from "@/components/shared-components";
import { HealthcareClient, HealthcareFacility } from "./healthcare-client";
import { initialHealthcareSpots } from "@/data/healthcareSpots";

// SSR Revalidation interval (Cache for 1 hour or set 0 for dynamic)
export const revalidate = 3600;

export default async function HealthcarePage() {
  // Fetch from database/Prisma or use static seed data on the server
  const facilities: HealthcareFacility[] =
    initialHealthcareSpots as HealthcareFacility[];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <HealthcareClient initialFacilities={facilities} />
    </Suspense>
  );
}
