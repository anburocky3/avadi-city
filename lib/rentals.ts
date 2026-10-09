import { prisma } from "@/lib/prisma";
import { initialRentalsData } from "@/data/rentalSpots";
import { RentalProperty } from "@/types/rental";

export async function getRentalListings(): Promise<RentalProperty[]> {
  let dbListings: RentalProperty[] = [];

  try {
    const records = await prisma.rentalListing.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    dbListings = records.map((l) => {
      let meta: Record<string, unknown> = {};
      try {
        if (l.features) meta = JSON.parse(l.features);
      } catch {
        // Fallback for non-JSON or plain text
      }

      const rentAmount = l.rent || Number(meta.rent) || 0;
      const advanceAmount = l.advance || Number(meta.advance) || 0;

      const pricing = (meta.pricing as Record<string, number>) || {
        monthlyRent: rentAmount,
        securityDeposit: advanceAmount,
        estimatedMoveInCost: rentAmount + advanceAmount,
      };

      const rawOwner = (meta.owner as Record<string, unknown>) || {};
      const owner = {
        name: (rawOwner.name as string) || l.ownerName || "Property Owner",
        type: (rawOwner.type as string) || "Owner",
        phone: (rawOwner.phone as string) || l.contact,
        whatsapp: (rawOwner.whatsapp as string)?.trim() || undefined,
        isPhoneVerified: rawOwner.isPhoneVerified ?? true,
        isIdVerified: rawOwner.isIdVerified ?? false,
        isPropertyVerified: rawOwner.isPropertyVerified ?? true,
        memberSince: (rawOwner.memberSince as string) || "Oct 2026",
      };

      const images = (meta.images as string[]) || (l.imageUrl ? [l.imageUrl] : []);
      const coverImage = l.imageUrl || images[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";

      return {
        id: l.id,
        title: l.title,
        description: l.details || (meta.description as string) || "",
        details: l.details || "",
        transactionType: (meta.transactionType as any) || (l.type === "Sale" ? "Sale" : "Rent"),
        category: (meta.category as any) || "Apartment",
        propertyTypeTag: (meta.propertyTypeTag as string) || l.propertyTypeTag || "Apartment",
        bhk: meta.bhk as any,
        bathrooms: (meta.bathrooms as number) || undefined,
        balconies: (meta.balconies as number) || undefined,
        floor: meta.floor as string | undefined,
        builtUpArea: (meta.builtUpArea as number) || undefined,
        carpetArea: (meta.carpetArea as number) || undefined,
        furnishing: meta.furnishing as any,
        facing: meta.facing as any,
        parking: meta.parking as any,
        preferredTenants: meta.preferredTenants as any,
        availability: (meta.availability as any) || "Immediate",
        ward: l.ward,
        streetName: (meta.streetName as string) || undefined,
        location: l.location || `Ward ${l.ward}, Avadi`,
        lat: typeof meta.lat === "number" ? meta.lat : undefined,
        lng: typeof meta.lng === "number" ? meta.lng : undefined,
        pricing: pricing as any,
        pgDetails: meta.pgDetails as any,
        commercialDetails: meta.commercialDetails as any,
        localityIntel: meta.localityIntel as any,
        amenities: (meta.amenities as string[]) || [],
        images: images.length > 0 ? images : [coverImage],
        imageUrl: coverImage,
        owner: owner as any,
        ownerName: l.ownerName || (owner.name as string),
        contact: l.contact,
        type: l.type,
        rent: rentAmount,
        advance: advanceAmount,
        features: (meta.amenities as string[])?.slice(0, 4) || [],
        status: "Available",
        createdAt: l.createdAt.toISOString(),
      } as RentalProperty;
    });
  } catch (err) {
    console.warn("[getRentalListings] Error querying rental listings from DB:", err);
  }

  // Prepend DB listings in front of seed data, avoiding duplicate IDs
  const dbIds = new Set(dbListings.map((item) => item.id));
  const fallbackListings = (initialRentalsData as RentalProperty[]).filter(
    (item) => !dbIds.has(item.id)
  );

  return [...dbListings, ...fallbackListings];
}
