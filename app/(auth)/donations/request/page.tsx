import React, { Suspense } from "react";
import { Metadata } from "next";
import { DonationRequestClient } from "./donation-request-client";

export const metadata: Metadata = {
  title: "Request Donation | Avadi City",
  description:
    "Post a charitable need or community assistance request in Avadi City.",
};

export default function DonationRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-2xl mx-auto md:max-w-full space-y-4">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <div className="p-3 sm:p-6 max-w-2xl mx-auto md:max-w-full pb-28 pt-2 sm:pt-4">
        <DonationRequestClient />
      </div>
    </Suspense>
  );
}
