import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/notifications-page";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Stay informed about your Avadi City updates, complaints, and community activity.",
  alternates: { canonical: "/notifications" },
  openGraph: {
    title: "Notifications",
    description: "Stay informed about your Avadi City updates, complaints, and community activity.",
    url: "/notifications",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Notifications" }],
  },
  twitter: { card: "summary_large_image", title: "Notifications", description: "Stay informed about your Avadi City updates, complaints, and community activity.", images: ["/logo.png"] },
};

export default function NotificationsPage() {
  return (
    <>
      <SeoJsonLd title="Notifications" description="Stay informed about your Avadi City updates, complaints, and community activity." path="/notifications" />
      <ClientPage />
    </>
  );
}
