import React, { Suspense } from "react";
import { SkeletonLoader } from "@/components/shared-components";
import { getDbDonations } from "@/lib/donation-db";
import { getDbVolunteers } from "@/lib/volunteer-db";
import DonationRequestClient from "./request/donation-request-client";
import DonationClient from "./donation-client";

export const dynamic = "force-dynamic";

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
