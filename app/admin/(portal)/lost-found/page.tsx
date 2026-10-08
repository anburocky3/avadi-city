import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { LostFoundManagementClient } from "./LostFoundManagementClient";

export const metadata: Metadata = {
  title: "Lost & Found Registry",
  description: "Moderation and claim tracking for civic lost and found items",
};

export default async function AdminLostFoundPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const whereClause: any = isSuperAdmin ? {} : { ward: session.wardNumber };

  const items = await prisma.lostFoundItem.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      itemId: true,
      type: true,
      title: true,
      description: true,
      category: true,
      ward: true,
      location: true,
      lostFoundDate: true,
      status: true,
      imageUrl: true,
      contactName: true,
      claims: {
        select: { id: true },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const formattedItems = items.map((i) => ({
    ...i,
    claimsCount: i.claims.length,
  }));

  return (
    <LostFoundManagementClient
      initialItems={formattedItems}
      currentWard={session.wardNumber}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
