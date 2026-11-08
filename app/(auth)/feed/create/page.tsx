import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/feed-create-page";

export const metadata: Metadata = {
  title: "Create a Community Update",
  description: "Share a local update, announcement, or helpful information with the Avadi community.",
  alternates: { canonical: "/feed/create" },
  openGraph: {
    title: "Create a Community Update",
    description: "Share a local update, announcement, or helpful information with the Avadi community.",
    url: "/feed/create",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Create a Community Update" }],
  },
  twitter: { card: "summary_large_image", title: "Create a Community Update", description: "Share a local update, announcement, or helpful information with the Avadi community.", images: ["/logo.png"] },
};

export default function NewFeedCreationPage() {
  return (
    <>
      <SeoJsonLd title="Create a Community Update" description="Share a local update, announcement, or helpful information with the Avadi community." path="/feed/create" />
      <ClientPage />
    </>
  );
}
