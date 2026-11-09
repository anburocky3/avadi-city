import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import FoodNewListingWizardPage from "@/features/food-and-dining/components/food-create-client";

export const metadata: Metadata = {
  title: "List a Food Business",
  description: "Add a restaurant, cafe, or food service to Avadi City.",
  alternates: { canonical: "/food-and-dining/create" },
  openGraph: {
    title: "List a Food Business",
    description: "Add a restaurant, cafe, or food service to Avadi City.",
    url: "/food-and-dining/create",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "List a Food Business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "List a Food Business",
    description: "Add a restaurant, cafe, or food service to Avadi City.",
    images: ["/logo.png"],
  },
};

export default function NewListingWizardPage() {
  return (
    <>
      <SeoJsonLd
        title="List a Food Business"
        description="Add a restaurant, cafe, or food service to Avadi City."
        path="/food-and-dining/create"
      />
      <FoodNewListingWizardPage />
    </>
  );
}
