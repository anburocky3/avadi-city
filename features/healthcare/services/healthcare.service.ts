import { prisma } from "@/lib/prisma";
import { WARD_COORDINATES } from "@/lib/healthcare-discovery";
import type { HealthcareFacility } from "@/features/healthcare/types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80";

function parseServices(value: unknown): string[] {
  let services = value;
  if (typeof services === "string") {
    try {
      services = JSON.parse(services);
    } catch {
      return [];
    }
  }
  return Array.isArray(services)
    ? services.filter((service): service is string => typeof service === "string")
    : [];
}

export async function getApprovedHealthcareFacilities(): Promise<
  HealthcareFacility[]
> {
  const facilities = await prisma.healthcareFacility.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  return facilities.map((facility): HealthcareFacility => {
    const services = parseServices(facility.services);
    const hasEmergencyUnit = facility.emergencyAvailable || facility.is24x7;
    const typeLower = facility.facilityType.toLowerCase();
    const hasPharmacy =
      typeLower.includes("pharmacy") ||
      services.some((service) => service.toLowerCase().includes("pharmacy"));
    const coordinates = WARD_COORDINATES[facility.ward];

    return {
      id: facility.id,
      name: facility.name,
      category: facility.category || "Hospitals",
      facilityType: facility.facilityType,
      specialty: services.slice(0, 3).join(", ") || facility.facilityType,
      description: facility.description,
      address: facility.address,
      imageUrl: facility.imageUrl || FALLBACK_IMAGE,
      phone: facility.phone,
      alternatePhone: facility.alternatePhone || undefined,
      rating: 4.8,
      ward: facility.ward,
      timings: facility.is24x7
        ? "Open 24/7 (24 Hours Emergency)"
        : [facility.openingTime, facility.closingTime]
            .filter(Boolean)
            .join(" – ") || "9:00 AM – 9:00 PM",
      is24x7: facility.is24x7,
      openingTime: facility.openingTime,
      closingTime: facility.closingTime,
      latitude: facility.latitude ?? coordinates?.lat ?? 13.1169,
      longitude: facility.longitude ?? coordinates?.lng ?? 80.0972,
      hasEmergencyUnit,
      ambulancePhone: facility.ambulancePhone || undefined,
      services,
      hasPharmacy,
      hasHomeDelivery: facility.homeDelivery,
      appointments: facility.appointments || undefined,
      consultationFee: facility.consultationFee ?? null,
      status: facility.status,
      isVerified: facility.status === "APPROVED",
    };
  });
}
