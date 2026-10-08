import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { TransportManagementClient } from "./TransportManagementClient";

export const metadata: Metadata = {
  title: "Travel & Transport Infrastructure",
  description: "Management and schedule curation of MTC buses, trains, and verified auto stands",
};

export default async function AdminTransportPage() {
  await requireRole("ADMIN");
  return <TransportManagementClient />;
}
