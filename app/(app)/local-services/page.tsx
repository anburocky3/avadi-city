import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonLoader } from "@/components/shared-components";

import { ServicesClient } from "@/features/local-services/components/local-services-client";
import { getApprovedLocalServiceProfiles } from "@/features/local-services/services/local-service.server";
import type { ServiceProvider } from "@/features/local-services/types";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "Local Services in Avadi",
  description:
    "Find trusted local professionals and services for your home and neighborhood in Avadi.",
};

export default async function ServicesPage() {
  let initialProviders: ServiceProvider[] = [];
  let hasLoadError = false;

  try {
    initialProviders = await getApprovedLocalServiceProfiles();
  } catch (error) {
    hasLoadError = true;
    console.error("Failed to load approved local service profiles:", error);
  }

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto md:max-w-full space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <ServicesClient
        initialProviders={initialProviders}
        hasLoadError={hasLoadError}
      />
    </Suspense>
  );
}
