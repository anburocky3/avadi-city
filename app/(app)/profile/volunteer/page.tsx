import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/volunteer-profile-page";

export const metadata: Metadata = {
  title: "Volunteer Profile",
  description: "Manage your Avadi City volunteer profile and community contributions.",
  alternates: { canonical: "/profile/volunteer" },
  openGraph: {
    title: "Volunteer Profile",
    description: "Manage your Avadi City volunteer profile and community contributions.",
    url: "/profile/volunteer",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Volunteer Profile" }],
  },
  twitter: { card: "summary_large_image", title: "Volunteer Profile", description: "Manage your Avadi City volunteer profile and community contributions.", images: ["/logo.png"] },
};

export default function VolunteerProfilePage() {
  return (
    <>
      <SeoJsonLd title="Volunteer Profile" description="Manage your Avadi City volunteer profile and community contributions." path="/profile/volunteer" />
      <ClientPage />
    </>
  );
}
