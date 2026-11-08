import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ClientPage from "@/features/pages/login-page";

export const metadata: Metadata = {
  title: "Sign in to Avadi City",
  description: "Sign in to access Avadi civic services, ward updates, community feeds, and local resources.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign in to Avadi City",
    description: "Sign in to access Avadi civic services, ward updates, community feeds, and local resources.",
    url: "/login",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Sign in to Avadi City" }],
  },
  twitter: { card: "summary_large_image", title: "Sign in to Avadi City", description: "Sign in to access Avadi civic services, ward updates, community feeds, and local resources.", images: ["/logo.png"] },
};

export default function LoginPage() {
  return (
    <>
      <SeoJsonLd title="Sign in to Avadi City" description="Sign in to access Avadi civic services, ward updates, community feeds, and local resources." path="/login" />
      <ClientPage />
    </>
  );
}
