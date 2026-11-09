import { prisma } from "@/lib/prisma";
import type { ServiceProvider } from "@/features/local-services/types";

export async function getApprovedLocalServiceProfiles(): Promise<
  ServiceProvider[]
> {
  const profiles = await prisma.localServiceProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  return profiles.map((profile): ServiceProvider => ({
    id: profile.id,
    name: profile.name,
    category: profile.category,
    phone: profile.phone,
    ward: profile.ward,
    experience: profile.experience || undefined,
    hours: profile.hours || undefined,
    specialty: profile.specialty || undefined,
    rate: profile.rate || undefined,
    description: profile.description || undefined,
    imageUrl: profile.imageUrl || undefined,
    verified: profile.status === "APPROVED",
    address:
      profile.description?.match(/(?:^|\s*\|\s*)Address:\s*(.*)$/)?.[1] ||
      undefined,
  }));
}
