import React, { Suspense } from "react";
import { initialPlaces } from "@/data/places";
import { SkeletonLoader } from "@/components/shared-components";
import { ExploreClient } from "./ExploreClient";

// Mark route for dynamic rendering if reading search params dynamically on server
export const revalidate = 3600; // Cache page for 1 hour or use 0 for full dynamic SSR

export default async function ExplorePage() {
  // You can perform server-side database fetches or API calls here if needed:
  // const places = await prisma.place.findMany();
  const places = initialPlaces;

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <ExploreClient initialPlaces={places} />
    </Suspense>
  );
}
