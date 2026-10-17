import { prisma } from "@/lib/prisma";
import { DonationRequest } from "@/types/donation";
import { seedDonationRequests } from "@/data/seed";

export function mapPrismaDonationToDonation(d: any): DonationRequest {
  return {
    id: d.displayId || d.id,
    createdBy: d.userId || d.createdByName || "anonymous",
    createdByName: d.createdByName || undefined,
    type: d.type,
    urgency: d.urgency,
    title: d.title,
    description: d.description || undefined,
    ward: d.ward,
    address: d.address,
    lat: d.lat ?? undefined,
    lng: d.lng ?? undefined,
    beneficiary: d.beneficiary || "Individual",
    items: Array.isArray(d.items) ? d.items : [],
    target: d.target || null,
    requiredBy: d.requiredBy || "",
    contact: {
      name: d.contactName,
      phone: d.contactPhone,
      whatsapp: d.contactWhatsapp,
    },
    images: Array.isArray(d.images) ? d.images : [],
    organisation: d.organisation || null,
    supportingProof: d.supportingProof || null,
    status: d.status || "approved",
    reports: Array.isArray(d.reports)
      ? d.reports.map((r: any) => ({
          reason: r.reason,
          reportedAt:
            typeof r.createdAt === "string"
              ? r.createdAt
              : r.createdAt?.toISOString?.() || new Date().toISOString(),
          reportedBy: r.reportedBy || undefined,
        }))
      : [],
    createdAt:
      typeof d.createdAt === "string"
        ? d.createdAt
        : d.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt:
      typeof d.updatedAt === "string"
        ? d.updatedAt
        : d.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

export async function getDbDonations(): Promise<DonationRequest[]> {
  try {
    const list = await prisma.donationRequest.findMany({
      include: { reports: true },
      orderBy: { createdAt: "desc" },
    });

    if (list.length > 0) {
      return list.map(mapPrismaDonationToDonation);
    }

    // Auto-seed initial donations into MySQL if table is currently empty
    for (const sd of seedDonationRequests) {
      await prisma.donationRequest.create({
        data: {
          displayId: sd.id,
          userId: null,
          createdByName: sd.createdByName || null,
          type: sd.type,
          urgency: sd.urgency,
          title: sd.title,
          description: sd.description || null,
          ward: sd.ward,
          address: sd.address,
          lat: sd.lat || null,
          lng: sd.lng || null,
          beneficiary: sd.beneficiary,
          items: (sd.items as any) || [],
          target: (sd.target as any) || null,
          requiredBy: sd.requiredBy || null,
          contactName: sd.contact.name,
          contactPhone: sd.contact.phone,
          contactWhatsapp: sd.contact.whatsapp,
          images: (sd.images as any) || [],
          organisation: (sd.organisation as any) || null,
          supportingProof: sd.supportingProof || null,
          status: sd.status,
        },
      });
    }

    const seeded = await prisma.donationRequest.findMany({
      include: { reports: true },
      orderBy: { createdAt: "desc" },
    });
    return seeded.map(mapPrismaDonationToDonation);
  } catch (error) {
    console.error("Database query failed in getDbDonations:", error);
    return seedDonationRequests;
  }
}
