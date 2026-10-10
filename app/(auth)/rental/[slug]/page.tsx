import React, { Suspense } from "react";
import { Metadata } from "next";
import { SkeletonLoader } from "@/components/shared-components";
import { getRentalListings, parsePropertySlug } from "@/lib/rentals";
import { RentalsClient } from "../../rentals/rental-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { propertyId } = parsePropertySlug(slug);
  const rentals = await getRentalListings();
  const property = rentals.find((r) => r.id === propertyId);

  if (!property) {
    return {
      title: "Property Listing | Avadi City",
      description: "Explore verified rental, commercial, and property listings in Avadi, Chennai.",
    };
  }

  const priceText =
    property.transactionType === "Sale"
      ? `₹${((property.pricing?.monthlyRent || 0) / 100000).toFixed(1)} Lakhs`
      : `₹${(property.pricing?.monthlyRent || 0).toLocaleString("en-IN")}/mo`;

  const desc = `${property.propertyTypeTag || property.category} in Ward ${property.ward}, ${
    property.streetName || "Avadi"
  }. Rent/Price: ${priceText}. Zero brokerage on Avadi City Portal.`;

  return {
    title: `${property.title} | ${priceText} | Avadi City`,
    description: desc,
    openGraph: {
      title: `${property.title} - ${priceText}`,
      description: desc,
      images: property.imageUrl ? [{ url: property.imageUrl, width: 800, height: 600 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} - ${priceText}`,
      description: desc,
      images: property.imageUrl ? [property.imageUrl] : [],
    },
  };
}

export default async function RentalSlugPage({ params }: Props) {
  const { slug } = await params;
  const { propertyId } = parsePropertySlug(slug);
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
      <RentalsClient initialRentals={rentals} initialPropertyId={propertyId} />
    </Suspense>
  );
}
