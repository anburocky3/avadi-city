import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/complaints-active-ward-page";

export const metadata: Metadata = {
  title: "Ward Complaints",
  description: "View civic complaints reported in an Avadi ward.",
  alternates: { canonical: "/complaints/active" },
  openGraph: {
    title: "Ward Complaints",
    description: "View civic complaints reported in an Avadi ward.",
    url: "/complaints/active",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Ward Complaints" }],
  },
  twitter: { card: "summary_large_image", title: "Ward Complaints", description: "View civic complaints reported in an Avadi ward.", images: ["/logo.png"] },
};

export default function NearbyComplaintsPage() {
  return (
    <>
      <SeoJsonLd title="Ward Complaints" description="View civic complaints reported in an Avadi ward." path="/complaints/active" />
      <ClientPage />
    </>
  );
}
