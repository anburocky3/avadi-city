import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/landing-page";

export const metadata: Metadata = {
  title: "Avadi City | Local Services and Civic Updates",
  description: "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Avadi City | Local Services and Civic Updates",
    description: "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.",
    url: "/",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Avadi City | Local Services and Civic Updates" }],
  },
  twitter: { card: "summary_large_image", title: "Avadi City | Local Services and Civic Updates", description: "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.", images: ["/logo.png"] },
};

export default function LandingPage() {
  return (
    <>
      <SeoJsonLd title="Avadi City | Local Services and Civic Updates" description="Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources." path="/" />
      <ClientPage />
    </>
  );
}
