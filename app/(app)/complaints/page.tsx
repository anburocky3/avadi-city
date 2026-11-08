import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ComplaintsOverviewClient from "@/features/complaints/components/complaints-overview-client";

export const metadata: Metadata = {
  title: "Civic Complaints in Avadi",
  description: "Submit, browse, and track civic complaints across Avadi wards.",
  alternates: { canonical: "/complaints" },
  openGraph: {
    title: "Civic Complaints in Avadi",
    description:
      "Submit, browse, and track civic complaints across Avadi wards.",
    url: "/complaints",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Civic Complaints in Avadi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Civic Complaints in Avadi",
    description:
      "Submit, browse, and track civic complaints across Avadi wards.",
    images: ["/logo.png"],
  },
};

export default function ComplaintsOverview() {
  return (
    <>
      <SeoJsonLd
        title="Civic Complaints in Avadi"
        description="Submit, browse, and track civic complaints across Avadi wards."
        path="/complaints"
      />
      <ComplaintsOverviewClient />
    </>
  );
}
