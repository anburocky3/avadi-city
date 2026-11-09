import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import JobCreateClient from "@/features/jobs/components/jobs-create-client";

export const metadata: Metadata = {
  title: "Post a Job in Avadi",
  description:
    "Help local talent find work by posting a job opportunity in Avadi.",
  alternates: { canonical: "/jobs/create" },
  openGraph: {
    title: "Post a Job in Avadi",
    description:
      "Help local talent find work by posting a job opportunity in Avadi.",
    url: "/jobs/create",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Post a Job in Avadi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Post a Job in Avadi",
    description:
      "Help local talent find work by posting a job opportunity in Avadi.",
    images: ["/logo.png"],
  },
};

export default function PostJobVacancyPage() {
  return (
    <>
      <SeoJsonLd
        title="Post a Job in Avadi"
        description="Help local talent find work by posting a job opportunity in Avadi."
        path="/jobs/create"
      />
      <JobCreateClient />
    </>
  );
}
