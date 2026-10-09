import React, { Suspense } from "react";

import { SkeletonLoader } from "@/components/shared-components";
import { getRentalListings } from "@/lib/rentals";
import { RentalsClient } from "./rental-client";

// Always fetch fresh data on request
export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  const rentals = await getRentalListings();

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <RentalsClient initialRentals={rentals} />
    </Suspense>
  );
}
