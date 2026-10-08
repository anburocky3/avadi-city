import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { ExploreManagementClient } from "./ExploreManagementClient";

export const metadata: Metadata = {
  title: "Explore Places & Landmarks",
  description: "Management and curation of public places and landmarks across Avadi",
};

export default async function AdminExplorePage() {
  await requireRole("ADMIN");
  return <ExploreManagementClient />;
}
