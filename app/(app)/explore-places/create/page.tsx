import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/explore-places-create-page";

export const metadata: Metadata = {
  title: "Add a Place in Avadi",
  description: "Help residents discover a useful, interesting, or trusted place in Avadi.",
  alternates: { canonical: "/explore-places/create" },
  openGraph: {
    title: "Add a Place in Avadi",
    description: "Help residents discover a useful, interesting, or trusted place in Avadi.",
    url: "/explore-places/create",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Add a Place in Avadi" }],
  },
  twitter: { card: "summary_large_image", title: "Add a Place in Avadi", description: "Help residents discover a useful, interesting, or trusted place in Avadi.", images: ["/logo.png"] },
};

export default function PostPlacePage() {
  return (
    <>
      <SeoJsonLd title="Add a Place in Avadi" description="Help residents discover a useful, interesting, or trusted place in Avadi." path="/explore-places/create" />
      <ClientPage />
    </>
  );
}
