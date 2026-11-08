import React, { Suspense } from "react";
import type { Metadata } from "next";
import { initialSosContactsData } from "@/data/sosContacts";
import { SkeletonLoader } from "@/components/shared-components";
import {
  EmergencyContact,
  SosClient,
} from "@/features/sos/components/sos-client";

export const revalidate = 3600; // Cache for 1 hour or set 0 for dynamic SSR
export const metadata: Metadata = {
  title: "Emergency SOS Contacts in Avadi",
  description:
    "Access important emergency phone numbers and verified contacts for Avadi residents.",
};

export default async function SosPage() {
  const contacts: EmergencyContact[] = (initialSosContactsData ||
    []) as EmergencyContact[];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <SkeletonLoader type="card" count={2} />
        </div>
      }
    >
      <SosClient initialContacts={contacts} />
    </Suspense>
  );
}
