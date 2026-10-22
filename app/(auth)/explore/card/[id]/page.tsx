import React, { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SkeletonLoader } from "@/components/shared-components";
import {
  PlaceCardDetailsClient,
  PlaceDetails,
  ReviewStats,
} from "./PlaceCardDetailsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const place = await prisma.explorePlace.findFirst({
      where: { id, status: "APPROVED" },
      select: {
        name: true,
        description: true,
        imageUrl: true,
        category: true,
        ward: true,
      },
    });

    if (!place) {
      return {
        title: "Place Not Found | Explore Avadi",
        description:
          "The requested place could not be found or is not currently available.",
      };
    }

    const shortDesc = place.description
      ? place.description.length > 155
        ? `${place.description.substring(0, 152)}...`
        : place.description
      : `Explore ${place.name} in Ward ${place.ward}, Avadi.`;

    return {
      title: `${place.name} | ${place.category} | Avadi City`,
      description: shortDesc,
      openGraph: {
        title: `${place.name} - Explore Avadi`,
        description: shortDesc,
        images: place.imageUrl ? [{ url: place.imageUrl }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${place.name} - Explore Avadi`,
        description: shortDesc,
        images: place.imageUrl ? [place.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Explore Place | Avadi City",
      description: "Discover verified places, parks, and attractions in Avadi.",
    };
  }
}

type ExplorePlaceRecord = Awaited<
  ReturnType<typeof prisma.explorePlace.findFirst>
>;

export default async function PlaceCardDetailsPage({ params }: PageProps) {
  const { id } = await params;

  let placeRecord: ExplorePlaceRecord = null;
  let statsData: ReviewStats = {
    averageRating: null,
    reviewCount: 0,
  };

  try {
    const [foundPlace, reviewAgg] = await Promise.all([
      prisma.explorePlace.findFirst({
        where: {
          id,
          status: "APPROVED",
        },
      }),
      prisma.placeReview.aggregate({
        where: { placeId: id },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    placeRecord = foundPlace;

    if (reviewAgg._count.id > 0 && reviewAgg._avg.rating !== null) {
      statsData = {
        averageRating: Math.round(reviewAgg._avg.rating * 10) / 10,
        reviewCount: reviewAgg._count.id,
      };
    }
  } catch (err) {
    console.error("Error fetching place details:", err);
  }

  // Not Found State
  if (!placeRecord) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto text-center space-y-4 pt-16 pb-24">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <MapPin size={32} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Place Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          The requested place could not be found, is pending review, or may have
          been removed.
        </p>
        <div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-orange-600 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return to Explore Places</span>
          </Link>
        </div>
      </div>
    );
  }

  // Format activities
  let activitiesArr: string[] = [];
  if (Array.isArray(placeRecord.activities)) {
    activitiesArr = placeRecord.activities as string[];
  } else if (typeof placeRecord.activities === "string") {
    try {
      activitiesArr = JSON.parse(placeRecord.activities);
    } catch {
      activitiesArr = [placeRecord.activities];
    }
  }

  // Format facilities
  let facilitiesArr: string[] = [];
  if (Array.isArray(placeRecord.facilities)) {
    facilitiesArr = placeRecord.facilities as string[];
  } else if (typeof placeRecord.facilities === "string") {
    try {
      facilitiesArr = JSON.parse(placeRecord.facilities);
    } catch {
      facilitiesArr = [placeRecord.facilities];
    }
  }

  // Format additional images
  let additionalImagesArr: string[] = [];
  if (Array.isArray(placeRecord.additionalImages)) {
    additionalImagesArr = placeRecord.additionalImages as string[];
  } else if (typeof placeRecord.additionalImages === "string") {
    try {
      additionalImagesArr = JSON.parse(placeRecord.additionalImages);
    } catch {
      additionalImagesArr = [placeRecord.additionalImages];
    }
  }

  const timingsStr = placeRecord.is24x7
    ? "Open 24 Hours"
    : placeRecord.openingTime && placeRecord.closingTime
      ? `${placeRecord.openingTime} – ${placeRecord.closingTime}`
      : "Timings vary";

  const formattedPlace: PlaceDetails = {
    id: placeRecord.id,
    name: placeRecord.name,
    category: placeRecord.category,
    description: placeRecord.description,
    address: placeRecord.address,
    areaLandmark: placeRecord.areaLandmark,
    ward: placeRecord.ward,
    imageUrl: placeRecord.imageUrl,
    additionalImages: additionalImagesArr,
    timings: timingsStr,
    is24x7: placeRecord.is24x7,
    openingTime: placeRecord.openingTime,
    closingTime: placeRecord.closingTime,
    entryFeeType: placeRecord.entryFeeType,
    entryFeeAmount: placeRecord.entryFeeAmount,
    activities: activitiesArr,
    visitorTypes: Array.isArray(placeRecord.visitorTypes)
      ? (placeRecord.visitorTypes as string[])
      : null,
    facilities: facilitiesArr,
    bestTimeToVisit: placeRecord.bestTimeToVisit,
    guidelines: placeRecord.guidelines,
    phone: placeRecord.phone,
    website: placeRecord.website,
    officialUrl: placeRecord.officialUrl,
    latitude: placeRecord.latitude,
    longitude: placeRecord.longitude,
  };

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-64 sm:h-80 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <PlaceCardDetailsClient
        place={formattedPlace}
        initialReviewStats={statsData}
      />
    </Suspense>
  );
}
