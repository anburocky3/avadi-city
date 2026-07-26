import React, { Suspense } from "react";
import { initialFoodSpots } from "@/data/foodSpots";
import { SkeletonLoader } from "@/components/shared-components";
import { FoodClient, FoodSpot } from "./foods-client";

// Cache/revalidate interval for static generation or dynamic SSR
export const revalidate = 3600; // 1 hour cache, or 0 for dynamic

export default async function FoodPage() {
  // SSR Data source fetch (Prisma query or local dataset import)
  const spots: FoodSpot[] = initialFoodSpots as FoodSpot[];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <FoodClient initialSpots={spots} />
    </Suspense>
  );
}
