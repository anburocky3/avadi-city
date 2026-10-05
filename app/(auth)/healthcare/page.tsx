import React, { Suspense } from "react";

import { SkeletonLoader } from "@/components/shared-components";
import { HealthcareClient, HealthcareFacility } from "./healthcare-client";
import { initialHealthcareSpots } from "@/data/healthcareSpots";
import { prisma } from "@/lib/prisma";
import { WARD_COORDINATES } from "@/lib/healthcare-discovery";

// Revalidate dynamically to reflect approved facilities
export const revalidate = 0;

export default async function HealthcarePage() {
  let approvedDbFacilities: HealthcareFacility[] = [];

  try {
    const dbFacilities = await prisma.healthcareFacility.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });

    approvedDbFacilities = dbFacilities.map((f) => {
      let parsedServices: string[] = [];
      try {
        if (typeof f.services === "string") {
          parsedServices = JSON.parse(f.services);
        } else if (Array.isArray(f.services)) {
          parsedServices = f.services as string[];
        }
      } catch {
        parsedServices = [];
      }

      const hasEmergencyUnit = f.emergencyAvailable || f.is24x7;
      const typeLower = (f.facilityType || "").toLowerCase();
      const hasPharmacy =
        typeLower.includes("pharmacy") ||
        parsedServices.some((s) => s.toLowerCase().includes("pharmacy"));

      const lat = f.latitude ?? WARD_COORDINATES[f.ward]?.lat ?? 13.1169;
      const lng = f.longitude ?? WARD_COORDINATES[f.ward]?.lng ?? 80.0972;

      return {
        id: f.id,
        name: f.name,
        category: f.category || "Hospitals",
        facilityType: f.facilityType,
        specialty: parsedServices.slice(0, 3).join(", ") || f.facilityType,
        description: f.description,
        address: f.address,
        imageUrl:
          f.imageUrl ||
          "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
        phone: f.phone,
        alternatePhone: f.alternatePhone || undefined,
        rating: 4.8,
        ward: f.ward,
        timings: f.is24x7
          ? "Open 24/7 (24 Hours Emergency)"
          : [f.openingTime, f.closingTime].filter(Boolean).join(" – ") || "9:00 AM – 9:00 PM",
        is24x7: f.is24x7,
        openingTime: f.openingTime,
        closingTime: f.closingTime,
        latitude: lat,
        longitude: lng,
        hasEmergencyUnit,
        ambulancePhone: f.ambulancePhone || undefined,
        services: parsedServices,
        hasPharmacy,
        hasHomeDelivery: f.homeDelivery,
        appointments: f.appointments || undefined,
        status: f.status,
        isVerified: f.status === "APPROVED",
      };
    });
  } catch (error) {
    console.error("Failed to load approved facilities from database:", error);
  }

  // Prepend approved facilities before initial spots, ensuring initial spots have coordinates and verified status
  const mappedSeedFacilities: HealthcareFacility[] = (initialHealthcareSpots as unknown as HealthcareFacility[]).map((spot) => {
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
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <HealthcareClient initialFacilities={facilities} />
    </Suspense>
  );
}
