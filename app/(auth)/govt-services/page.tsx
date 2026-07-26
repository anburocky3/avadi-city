import React, { Suspense } from "react";

import { initialGovtServicesData } from "@/data/govtServices";
import { SkeletonLoader } from "@/components/shared-components";
import { GovtServiceItem, GovtServicesClient } from "./govt-services-client";

export const revalidate = 3600; // Cache for 1 hour or set 0 for full dynamic SSR

export default async function GovtServicesPage() {
  const services: GovtServiceItem[] = (initialGovtServicesData ||
    []) as GovtServiceItem[];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <GovtServicesClient initialServices={services} />
    </Suspense>
  );
}
