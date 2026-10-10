import React, { Suspense } from "react";
import { SkeletonLoader } from "@/components/shared-components";
import { ExploreClient, Place } from "./ExploreClient";
import { prisma } from "@/lib/prisma";

// Revalidate every 60s so new approvals surface quickly
export const revalidate = 60;

export default async function ExplorePage() {
  // Fetch ONLY DB-approved community submissions
  let places: Place[] = [];
  try {
    const dbListings = prisma.communityListing
      ? await prisma.communityListing.findMany({
          where: { type: "EXPLORE_PLACE", status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        })
      : [];

    places = dbListings.map((l, idx) => ({
      id: -1000 - idx,
      name: l.name,
      category: l.subCategory || "Famous Spots",
      description: l.description,
      address: l.address,
      imageUrl: l.imageUrl || "/img/default-place.jpg",
      timings: l.timings || "Contact for timings",
      ward: l.ward || undefined,
      is24x7: l.is24x7,
      phone: l.phone || undefined,
      extraDetails: (l.extraDetails as any) ?? null,
    }));
  } catch (err: any) {
    console.warn("Could not fetch DB explore listings:", err?.message || err);
  }

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
