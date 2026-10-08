import { Metadata } from "next";
import { requireRole } from "@/lib/rbac";
import { JobsManagementClient } from "./JobsManagementClient";

export const metadata: Metadata = {
  title: "Local Job Vacancies",
  description: "Management and posting of municipal and local employment vacancies",
};

export default async function AdminJobsPage() {
  await requireRole("ADMIN");
  return <JobsManagementClient />;
}
