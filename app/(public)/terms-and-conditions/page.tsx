import React from "react";
import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import TermsAndConditionsPage from "@/features/pages/terms-and-conditions-page";

const description =
  "Read the terms governing access to and use of the Avadi City Portal and its community features.";

export const metadata: Metadata = {
  title: "Terms & Conditions | Avadi City",
  description,
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: {
    title: "Terms & Conditions | Avadi City",
    description,
    url: "/terms-and-conditions",
  },
};

export default function TermsPage() {
  return (
    <>
      <SeoJsonLd
        title="Terms & Conditions | Avadi City"
        description={description}
        path="/terms-and-conditions"
      />
      <TermsAndConditionsPage />
    </>
  );
}
