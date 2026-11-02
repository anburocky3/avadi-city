import React from "react";
import { Metadata } from "next";
import SupportView from "@/components/support/SupportView";

export const metadata: Metadata = {
  title: "Support & Feedback | Avadi City",
  description:
    "Report bugs, suggest new civic features, track ticket history, and monitor resolution status directly from the Avadi City Municipal Tech Team.",
};

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto md:max-w-full space-y-6 font-sans">
      <SupportView />
    </div>
  );
}
