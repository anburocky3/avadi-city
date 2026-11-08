import React, { Suspense } from "react";
import type { Metadata } from "next";

import { SkeletonLoader } from "@/components/shared-components";
import { getRentalListings } from "@/lib/rentals";
import { RentalsClient } from "@/features/rentals/components/rental-client";

// Always fetch fresh data on request
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rentals in Avadi",
  description:
    "Browse current rental homes and properties available across Avadi.",
};

export default async function RentalsPage() {
  const rentals = await getRentalListings();

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto md:max-w-full space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <RentalsClient initialRentals={rentals} />
    </Suspense>
  );
}
