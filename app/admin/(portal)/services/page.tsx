import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ServicesManagementClient } from "./ServicesManagementClient";

export const metadata: Metadata = {
  title: "Local Services Directory Management",
  description: "Moderation and verification of local tradespeople and service providers",
};

export default async function AdminServicesPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const whereClause: any = isSuperAdmin ? {} : { ward: session.wardNumber };

  const profiles = await prisma.localServiceProfile.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      ward: true,
      experience: true,
      hours: true,
      description: true,
      specialty: true,
      rate: true,
      imageUrl: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <ServicesManagementClient
      initialProfiles={profiles}
      currentWard={session.wardNumber}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
