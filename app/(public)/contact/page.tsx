import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/contact-page";

export const metadata: Metadata = {
  title: "Contact Avadi City",
  description: "Contact the Avadi City team for support, feedback, partnerships, or civic questions.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Avadi City",
    description: "Contact the Avadi City team for support, feedback, partnerships, or civic questions.",
    url: "/contact",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Contact Avadi City" }],
  },
  twitter: { card: "summary_large_image", title: "Contact Avadi City", description: "Contact the Avadi City team for support, feedback, partnerships, or civic questions.", images: ["/logo.png"] },
};

export default function ContactPage() {
  return (
    <>
      <SeoJsonLd title="Contact Avadi City" description="Contact the Avadi City team for support, feedback, partnerships, or civic questions." path="/contact" />
      <ClientPage />
    </>
  );
}
