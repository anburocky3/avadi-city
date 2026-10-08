import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { HealthcareManagementClient } from "./HealthcareManagementClient";

export const metadata: Metadata = {
  title: "Hospitals & Healthcare Directory",
  description: "Management of hospitals, 24x7 emergency clinics, and certified pharmacies in Avadi",
};

export default async function AdminHealthcarePage() {
  await requireRole("ADMIN");
  return <HealthcareManagementClient />;
}
