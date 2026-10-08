import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SupportManagementClient } from "./SupportManagementClient";

export const metadata: Metadata = {
  title: "Citizen Support & Inquiries",
  description: "Citizen helpdesk inquiries, feedback, and technical support submissions",
};

export default async function AdminSupportPage() {
  await requireRole("ADMIN");

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      category: true,
      wardNumber: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  return <SupportManagementClient initialSubmissions={submissions} />;
}
