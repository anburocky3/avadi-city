import { Suspense } from "react";
import type { Metadata } from "next";
import { SkeletonLoader } from "@/components/shared-components";
import DonationClient from "@/features/donations/components/donation-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Community Donations",
  description:
    "Support Avadi community initiatives and discover local donation opportunities.",
};

export default async function DonationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto md:max-w-full space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <DonationClient />
    </Suspense>
  );
}
