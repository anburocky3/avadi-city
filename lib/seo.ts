import type { Metadata } from "next";

export const SITE_URL = "https://avadi.vercel.app";
export const SITE_NAME = "Avadi City";
export const DEFAULT_DESCRIPTION =
  "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.";
export const DEFAULT_IMAGE = "/logo.png";

export function createPageMetadata(
  title: string,
  description: string,
  path = "/",
  image = DEFAULT_IMAGE,
): Metadata {
  const absoluteImage = image.startsWith("http")
    ? image
    : `${SITE_URL}${image}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    keywords: [
      "Avadi",
      "Avadi City",
      "Avadi civic services",
      "Avadi local services",
      "Chennai",
    ],
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImage],
    },
  };
}
