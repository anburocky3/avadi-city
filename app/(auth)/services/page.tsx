import React, { Suspense } from "react";
import { SkeletonLoader } from "@/components/shared-components";

// Import dataset and ward mapping
import { initialServices } from "@/data/services";
import { wards } from "@/data/wards";
import { ServiceProvider, ServicesClient } from "./services-client";

export const revalidate = 3600; // Cache for 1 hour or set 0 for dynamic SSR

export default async function ServicesPage() {
  const providers: ServiceProvider[] = (initialServices ||
    []) as ServiceProvider[];
  const wardsList = (wards || []).map((w) => ({
    id: Number(w.id),
    name: w.name,
  }));

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <ServicesClient initialProviders={providers} wardsList={wardsList} />
    </Suspense>
  );
}
