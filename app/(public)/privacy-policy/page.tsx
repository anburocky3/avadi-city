import React from "react";
import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import PrivacyPolicyPage from "@/features/pages/privacy-policy-page";

const description =
  "Learn what information the Avadi City Portal may collect, how it is used, and the choices available to you.";

export const metadata: Metadata = {
  title: "Privacy Policy | Avadi City",
  description,
  alternates: { canonical: "/privacy-policy" },
  openGraph: {
    title: "Privacy Policy | Avadi City",
    description,
    url: "/privacy-policy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <SeoJsonLd
        title="Privacy Policy | Avadi City"
        description={description}
        path="/privacy-policy"
      />
      <PrivacyPolicyPage />
    </>
  );
}
