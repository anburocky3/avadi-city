import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { VolunteersManagementClient } from "./VolunteersManagementClient";

export const metadata: Metadata = {
  title: "Volunteers & Civic Causes",
  description: "Management and organization of civic volunteering initiatives and charity drives in Avadi",
};

export default async function AdminVolunteersPage() {
  await requireRole("ADMIN");
  return <VolunteersManagementClient />;
}
