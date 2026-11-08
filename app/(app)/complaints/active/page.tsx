import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/complaints-active-page";

export const metadata: Metadata = {
  title: "My Complaints",
  description: "Track civic complaints and follow their progress in Avadi.",
  alternates: { canonical: "/complaints/active" },
  openGraph: {
    title: "My Complaints",
    description: "Track civic complaints and follow their progress in Avadi.",
    url: "/complaints/active",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "My Complaints" }],
  },
  twitter: { card: "summary_large_image", title: "My Complaints", description: "Track civic complaints and follow their progress in Avadi.", images: ["/logo.png"] },
};

export default function MyComplaintsPage() {
  return (
    <>
      <SeoJsonLd title="My Complaints" description="Track civic complaints and follow their progress in Avadi." path="/complaints/active" />
      <ClientPage />
    </>
  );
}
