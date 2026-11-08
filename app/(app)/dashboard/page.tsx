import { Metadata } from "next";
import DashboardClient from "@/features/dashboard/components/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Hyperlocal civic services, ward feeds, alerts, and schedules for Avadi residents.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-6">
      <DashboardClient />
    </main>
  );
}
