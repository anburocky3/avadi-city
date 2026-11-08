import type { Metadata } from "next";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import ReportModalInterceptClient from "@/features/complaints/components/complaints-report-modal";

export const metadata: Metadata = {
  title: "Report a Civic Issue",
  description:
    "Report a civic issue in Avadi and help improve your neighborhood.",
  alternates: { canonical: "/complaints/report" },
  openGraph: {
    title: "Report a Civic Issue",
    description:
      "Report a civic issue in Avadi and help improve your neighborhood.",
    url: "/complaints/report",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Report a Civic Issue",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Report a Civic Issue",
    description:
      "Report a civic issue in Avadi and help improve your neighborhood.",
    images: ["/logo.png"],
  },
};

export default function ReportModalIntercept() {
  return (
    <>
      <SeoJsonLd
        title="Report a Civic Issue"
        description="Report a civic issue in Avadi and help improve your neighborhood."
        path="/complaints/report"
      />
      <ReportModalInterceptClient />
    </>
  );
}
