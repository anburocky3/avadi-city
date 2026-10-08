import React, { Suspense } from "react";

import { initialRentalsData } from "@/data/rentalSpots";
import { SkeletonLoader } from "@/components/shared-components";
import { RentalProperty, RentalsClient } from "./rental-client";

// Always fetch fresh data — listings must be real-time across users
export const dynamic = "force-dynamic";

async function fetchRentalsFromDB(): Promise<RentalProperty[]> {
  try {
    // Use absolute URL for server-side fetch in Next.js App Router
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/rentals`, {
      next: { revalidate: 0 }, // always fresh
    });

    if (!res.ok) throw new Error(`API responded ${res.status}`);

    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data as RentalProperty[];
    }
  } catch (err) {
    console.warn("[RentalsPage] Could not fetch from DB, falling back to static data:", err);
  }

  // Fallback to static seed data if DB is empty or unreachable
  return (initialRentalsData || []) as RentalProperty[];
}

export default async function RentalsPage() {
  const rentals = await fetchRentalsFromDB();

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <RentalsClient initialRentals={rentals} />
    </Suspense>
  );
}
