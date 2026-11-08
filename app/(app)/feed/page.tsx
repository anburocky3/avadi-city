import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/feed-page";

export const metadata: Metadata = {
  title: "Community Feed",
  description: "Read and share trusted local updates, civic alerts, and community news from Avadi.",
  alternates: { canonical: "/feed" },
  openGraph: {
    title: "Community Feed",
    description: "Read and share trusted local updates, civic alerts, and community news from Avadi.",
    url: "/feed",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Community Feed" }],
  },
  twitter: { card: "summary_large_image", title: "Community Feed", description: "Read and share trusted local updates, civic alerts, and community news from Avadi.", images: ["/logo.png"] },
};

export default function FeedPage() {
  return (
    <>
      <SeoJsonLd title="Community Feed" description="Read and share trusted local updates, civic alerts, and community news from Avadi." path="/feed" />
      <ClientPage />
    </>
  );
}
