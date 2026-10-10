import React, { Suspense } from "react";
import { Metadata } from "next";
import { SkeletonLoader } from "@/components/shared-components";
import { getRentalListings } from "@/lib/rentals";
import { parsePropertySlug } from "@/lib/rental-slugs";
import { RentalDetailPageClient } from "@/components/rentals/RentalDetailPageClient";

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
      ? `₹${((property.pricing?.monthlyRent || property.rent || 0) / 100000).toFixed(1)} Lakhs`
      : `₹${(property.pricing?.monthlyRent || property.rent || 0).toLocaleString("en-IN")}/mo`;

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
  const property = rentals.find((r) => r.id === propertyId);
  const similar = rentals.filter((r) => r.id !== propertyId).slice(0, 3);

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-80 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <RentalDetailPageClient
        initialProperty={property || null}
        propertyId={propertyId}
        similarProperties={similar}
      />
    </Suspense>
  );
}
