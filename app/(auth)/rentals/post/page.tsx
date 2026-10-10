import React, { Suspense } from "react";
import { Metadata } from "next";
import { RentalsPostClient } from "./rentals-post-client";

export const metadata: Metadata = {
  title: "Post Property for Rent, Lease or Sale | Avadi City",
  description:
    "List apartments, independent houses, PG/hostels, commercial spaces, and plots for rent, lease or sale across Avadi wards.",
};

export default function RentalsPostPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <RentalsPostClient />
    </Suspense>
  );
}
