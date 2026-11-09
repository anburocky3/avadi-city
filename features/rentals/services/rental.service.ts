import { prisma } from "@/lib/prisma";
import { initialRentalsData } from "@/data/rentalSpots";
import type { RentalProperty } from "@/types/rental";

function parseMetadata(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function getRentalListings(): Promise<RentalProperty[]> {
  let dbListings: RentalProperty[] = [];

  try {
    const records = await prisma.rentalListing.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    dbListings = records.map((listing): RentalProperty => {
      const meta = parseMetadata(listing.features);
      const rentAmount = listing.rent || Number(meta.rent) || 0;
      const advanceAmount = listing.advance || Number(meta.advance) || 0;
      const rawPricing = asRecord(meta.pricing);
      const pricing = {
        monthlyRent: rentAmount,
        securityDeposit: advanceAmount,
        estimatedMoveInCost: rentAmount + advanceAmount,
        ...rawPricing,
      };
      const rawOwner = asRecord(meta.owner);
      const ownerTypes: RentalProperty["owner"]["type"][] = [
        "Owner",
        "Verified Broker",
        "Builder",
        "Property Manager",
      ];
      const owner: RentalProperty["owner"] = {
        name:
          (typeof rawOwner.name === "string" && rawOwner.name) ||
          listing.ownerName ||
          "Property Owner",
        type: ownerTypes.find((type) => type === rawOwner.type) || "Owner",
        phone:
          (typeof rawOwner.phone === "string" && rawOwner.phone) ||
          listing.contact,
        whatsapp:
          typeof rawOwner.whatsapp === "string"
            ? rawOwner.whatsapp.trim() || undefined
            : undefined,
        isPhoneVerified: rawOwner.isPhoneVerified !== false,
        isIdVerified: rawOwner.isIdVerified === true,
        isPropertyVerified: rawOwner.isPropertyVerified !== false,
        memberSince:
          (typeof rawOwner.memberSince === "string" && rawOwner.memberSince) ||
          "Oct 2026",
      };
      const metadataImages = Array.isArray(meta.images)
        ? meta.images.filter(
            (image): image is string => typeof image === "string",
          )
        : [];
      const images =
        metadataImages.length > 0
          ? metadataImages
          : listing.imageUrl
            ? [listing.imageUrl]
            : [];
      const coverImage =
        listing.imageUrl ||
        images[0] ||
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";
      const amenities = Array.isArray(meta.amenities)
        ? meta.amenities.filter(
            (amenity): amenity is string => typeof amenity === "string",
          )
        : [];

      return {
        id: listing.id,
        title: listing.title,
        description:
          listing.details ||
          (typeof meta.description === "string" ? meta.description : ""),
        details: listing.details,
        transactionType:
          (meta.transactionType as RentalProperty["transactionType"]) ||
          (listing.type === "Sale" ? "Sale" : "Rent"),
        category: (meta.category as RentalProperty["category"]) || "Apartment",
        propertyTypeTag:
          (typeof meta.propertyTypeTag === "string" && meta.propertyTypeTag) ||
          listing.propertyTypeTag ||
          "Apartment",
        bhk: meta.bhk as RentalProperty["bhk"],
        bathrooms:
          typeof meta.bathrooms === "number" ? meta.bathrooms : undefined,
        balconies:
          typeof meta.balconies === "number" ? meta.balconies : undefined,
        floor: typeof meta.floor === "string" ? meta.floor : undefined,
        builtUpArea:
          typeof meta.builtUpArea === "number" ? meta.builtUpArea : undefined,
        carpetArea:
          typeof meta.carpetArea === "number" ? meta.carpetArea : undefined,
        furnishing: meta.furnishing as RentalProperty["furnishing"],
        facing: meta.facing as RentalProperty["facing"],
        parking: meta.parking as RentalProperty["parking"],
        preferredTenants:
          meta.preferredTenants as RentalProperty["preferredTenants"],
        availability:
          (meta.availability as RentalProperty["availability"]) || "Immediate",
        ward: listing.ward,
        streetName:
          typeof meta.streetName === "string" ? meta.streetName : undefined,
        location: listing.location || `Ward ${listing.ward}, Avadi`,
        lat: typeof meta.lat === "number" ? meta.lat : undefined,
        lng: typeof meta.lng === "number" ? meta.lng : undefined,
        pricing: pricing as RentalProperty["pricing"],
        pgDetails: meta.pgDetails as RentalProperty["pgDetails"],
        commercialDetails:
          meta.commercialDetails as RentalProperty["commercialDetails"],
        plotDetails: meta.plotDetails as RentalProperty["plotDetails"],
        localityIntel: meta.localityIntel as RentalProperty["localityIntel"],
        amenities,
        images: images.length > 0 ? images : [coverImage],
        imageUrl: coverImage,
        owner,
        ownerName: listing.ownerName || owner.name,
        contact: listing.contact,
        type: listing.type,
        rent: rentAmount,
        advance: advanceAmount,
        features: amenities.slice(0, 4),
        status: "Available",
        createdAt: listing.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.warn(
      "[getRentalListings] Error querying rental listings from DB:",
      error,
    );
  }

  const dbIds = new Set(dbListings.map((item) => item.id));
  const fallbackListings = (initialRentalsData as RentalProperty[]).filter(
    (item) => !dbIds.has(item.id),
  );

  return [...dbListings, ...fallbackListings];
}

export async function getRentalListingById(
  id: string,
): Promise<RentalProperty | null> {
  const listings = await getRentalListings();
  return listings.find((property) => property.id === id) || null;
}
