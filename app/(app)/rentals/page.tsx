import { Suspense } from "react";
import type { Metadata } from "next";

import { SkeletonLoader } from "@/components/shared-components";
import { getRentalListings } from "@/features/rentals/services/rental.service";
import { RentalsClient } from "@/features/rentals/components/rental-client";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "Residential & Commercial Properties in Avadi",
  description:
    "Find the best residential and commercial properties for rent or sale in Avadi. Explore a wide range of apartments, houses, and commercial spaces to suit your needs. Discover your ideal property today!",
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
