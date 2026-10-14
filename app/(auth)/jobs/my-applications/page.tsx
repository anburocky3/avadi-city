import React from "react";
import { Metadata } from "next";
import JobsPage from "../page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Applications - Jobs in Avadi",
  description: "Track the status of the jobs you have applied for in Avadi.",
};

export default async function MyApplicationsPage() {
  return <JobsPage searchParams={Promise.resolve({ tab: "my-applications" })} />;
}
