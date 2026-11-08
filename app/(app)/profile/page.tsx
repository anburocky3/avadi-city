import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/profile-page";

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your Avadi City profile, ward details, and community preferences.",
  alternates: { canonical: "/profile" },
  openGraph: {
    title: "My Profile",
    description: "Manage your Avadi City profile, ward details, and community preferences.",
    url: "/profile",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "My Profile" }],
  },
  twitter: { card: "summary_large_image", title: "My Profile", description: "Manage your Avadi City profile, ward details, and community preferences.", images: ["/logo.png"] },
};

export default function ProfilePage() {
  return (
    <>
      <SeoJsonLd title="My Profile" description="Manage your Avadi City profile, ward details, and community preferences." path="/profile" />
      <ClientPage />
    </>
  );
}
