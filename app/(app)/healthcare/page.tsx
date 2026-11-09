import React, { Suspense } from "react";
import type { Metadata } from "next";

import { SkeletonLoader } from "@/components/shared-components";
import { HealthcareClient } from "@/features/healthcare/components/healthcare-client";
import type { HealthcareFacility } from "@/features/healthcare/types";
import { WARD_COORDINATES } from "@/lib/healthcare-discovery";
import { initialHealthcareSpots } from "@/data/healthcareSpots";
import { getApprovedHealthcareFacilities } from "@/features/healthcare/services/healthcare.service";

// Revalidate dynamically to reflect approved facilities
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Healthcare in Avadi",
  description:
    "Find verified hospitals, clinics, pharmacies, emergency units, and healthcare services in Avadi.",
};

export default async function HealthcarePage() {
  let approvedDbFacilities: HealthcareFacility[] = [];

  try {
    approvedDbFacilities = await getApprovedHealthcareFacilities();
  } catch (error) {
    console.error("Failed to load approved facilities from database:", error);
  }

  // Prepend approved facilities before initial spots, ensuring initial spots have coordinates and verified status
  const mappedSeedFacilities: HealthcareFacility[] = (
    initialHealthcareSpots as unknown as HealthcareFacility[]
  ).map((spot) => {
    const lat = spot.latitude ?? WARD_COORDINATES[spot.ward]?.lat ?? 13.1169;
    const lng = spot.longitude ?? WARD_COORDINATES[spot.ward]?.lng ?? 80.0972;
    return {
      ...spot,
      latitude: lat,
      longitude: lng,
      status: "APPROVED",
      isVerified: true,
    };
  });

  const facilities: HealthcareFacility[] = [
    ...approvedDbFacilities,
    ...mappedSeedFacilities,
  ];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto md:max-w-full space-y-5">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <HealthcareClient initialFacilities={facilities} />
    </Suspense>
  );
}
