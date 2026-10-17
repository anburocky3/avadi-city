import React, { Suspense } from "react";
import { initialPlaces } from "@/data/places";
import { SkeletonLoader } from "@/components/shared-components";
import { ExploreClient, Place } from "./ExploreClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let dbPlaces: Place[] = [];
  const reviewStatsMap: Record<
    string,
    { averageRating: number; reviewCount: number }
  > = {};

  try {
    const [placesFromDb, reviewStats] = await Promise.all([
      prisma.explorePlace.findMany({
        where: {
          status: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.placeReview.groupBy({
        by: ["placeId"],
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    for (const stat of reviewStats) {
      if (stat._count.id > 0 && stat._avg.rating !== null) {
        reviewStatsMap[stat.placeId] = {
          averageRating: Math.round(stat._avg.rating * 10) / 10,
          reviewCount: stat._count.id,
        };
      }
    }

    dbPlaces = placesFromDb.map((p) => {
      let activitiesArr: string[] = [];
      if (Array.isArray(p.activities)) {
        activitiesArr = p.activities as string[];
      }
      let facilitiesArr: string[] = [];
      if (Array.isArray(p.facilities)) {
        facilitiesArr = p.facilities as string[];
      }

      const timingsStr = p.is24x7
        ? "Open 24 Hours"
        : p.openingTime && p.closingTime
        ? `${p.openingTime} – ${p.closingTime}`
        : "Timings vary";

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        address: p.address,
        imageUrl:
          p.imageUrl ||
          "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=60",
        timings: timingsStr,
        ward: p.ward,
        is24x7: p.is24x7,
        phone: p.phone || undefined,
        activities: activitiesArr,
        entryFeeType: p.entryFeeType,
        entryFeeAmount: p.entryFeeAmount || undefined,
        facilities: facilitiesArr,
        guidelines: p.guidelines || undefined,
        website: p.website || undefined,
        officialUrl: p.officialUrl || undefined,
        bestTimeToVisit: p.bestTimeToVisit || undefined,
        latitude: p.latitude || undefined,
        longitude: p.longitude || undefined,
      };
    });
  } catch (err) {
    console.error("Error fetching explore places from database:", err);
  }

  // Combined places list (Database approved places prioritized first, then initialPlaces)
  const places = [...dbPlaces, ...initialPlaces];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <ExploreClient initialPlaces={places} initialReviewStats={reviewStatsMap} />
    </Suspense>
  );
}
