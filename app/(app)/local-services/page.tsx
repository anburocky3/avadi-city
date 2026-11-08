import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonLoader } from "@/components/shared-components";

import { ServicesClient } from "@/features/local-services/components/local-services-client";

export const revalidate = 3600; // Cache for 1 hour or set 0 for dynamic SSR
export const metadata: Metadata = {
  title: "Local Services in Avadi",
  description:
    "Find trusted local professionals and services for your home and neighborhood in Avadi.",
};

export default async function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto md:max-w-full space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <ServicesClient />
    </Suspense>
  );
}
