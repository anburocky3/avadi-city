import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { RentalsManagementClient } from "./RentalsManagementClient";

export const metadata: Metadata = {
  title: "Rent & Properties Management",
  description: "Moderation and approvals for rental housing and commercial properties",
};

export default async function AdminRentalsPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const whereClause: any = isSuperAdmin ? {} : { ward: session.wardNumber };

  const rentals = await prisma.rentalListing.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return (
    <RentalsManagementClient
      initialRentals={rentals}
      currentWard={session.wardNumber}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
