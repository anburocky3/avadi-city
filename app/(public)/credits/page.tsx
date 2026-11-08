import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/credits-page";

export const metadata: Metadata = {
  title: "Credits | Avadi City",
  description: "Meet the people and community partners who help build Avadi City.",
  alternates: { canonical: "/credits" },
  openGraph: {
    title: "Credits | Avadi City",
    description: "Meet the people and community partners who help build Avadi City.",
    url: "/credits",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Credits | Avadi City" }],
  },
  twitter: { card: "summary_large_image", title: "Credits | Avadi City", description: "Meet the people and community partners who help build Avadi City.", images: ["/logo.png"] },
};

export default function CreditsPage() {
  return (
    <>
      <SeoJsonLd title="Credits | Avadi City" description="Meet the people and community partners who help build Avadi City." path="/credits" />
      <ClientPage />
    </>
  );
}
