import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/healthcare-create-page";

export const metadata: Metadata = {
  title: "Register a Healthcare Facility",
  description: "Register a hospital, clinic, pharmacy, or healthcare facility in Avadi.",
  alternates: { canonical: "/healthcare/create" },
  openGraph: {
    title: "Register a Healthcare Facility",
    description: "Register a hospital, clinic, pharmacy, or healthcare facility in Avadi.",
    url: "/healthcare/create",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Register a Healthcare Facility" }],
  },
  twitter: { card: "summary_large_image", title: "Register a Healthcare Facility", description: "Register a hospital, clinic, pharmacy, or healthcare facility in Avadi.", images: ["/logo.png"] },
};

export default function CreateFacilityPage() {
  return (
    <>
      <SeoJsonLd title="Register a Healthcare Facility" description="Register a hospital, clinic, pharmacy, or healthcare facility in Avadi." path="/healthcare/create" />
      <ClientPage />
    </>
  );
}
