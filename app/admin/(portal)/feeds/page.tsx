import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { FeedsManagementClient } from "./FeedsManagementClient";

export const metadata: Metadata = {
  title: "Community Feed Moderation",
  description: "Moderation console for community posts, announcements, and emergency notices",
};

export default async function AdminFeedsPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const whereClause: any = isSuperAdmin ? {} : { ward: session.wardNumber };

  const feeds = await prisma.feed.findMany({
    where: whereClause,
    orderBy: { timestamp: "desc" },
    select: {
      id: true,
      authorId: true,
      ward: true,
      text: true,
      imageUrl: true,
      isEmergency: true,
      category: true,
      likesCount: true,
      timestamp: true,
      author: {
        select: {
          name: true,
          email: true,
        },
      },
      comments: {
        select: {
          id: true,
          author: true,
          text: true,
        },
      },
    },
  });

  return (
    <FeedsManagementClient
      initialFeeds={feeds}
      currentWard={session.wardNumber}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
