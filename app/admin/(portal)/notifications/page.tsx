import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { NotificationsManagementClient } from "./NotificationsManagementClient";

export const metadata: Metadata = {
  title: "Civic Push Notifications",
  description: "Broadcast civic push notifications and emergency announcements to residents",
};

export default async function AdminNotificationsPage() {
  const session = await requireRole("ADMIN");
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const totalRegisteredUsers = await prisma.user.count();

  return (
    <NotificationsManagementClient
      totalRegisteredUsers={totalRegisteredUsers}
      currentWard={session.wardNumber}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
