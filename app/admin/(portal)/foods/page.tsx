import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { FoodManagementClient } from "./FoodManagementClient";

export const metadata: Metadata = {
  title: "Food & Dining Management",
  description: "Moderation and approvals for restaurant and food business listings",
};

export default async function AdminFoodsPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const whereClause: any = isSuperAdmin ? {} : { ward: session.wardNumber };

  const listings = await prisma.foodListing.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      address: true,
      ward: true,
      phone: true,
      imageUrl: true,
      openingTime: true,
      closingTime: true,
      foodType: true,
      priceRange: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <FoodManagementClient
      initialListings={listings}
      currentWard={session.wardNumber}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
