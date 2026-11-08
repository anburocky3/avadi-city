import React from "react";

const siteUrl = "https://avadi.vercel.app";

export function SeoJsonLd({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Avadi City",
    url: siteUrl,
    description,
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/explore-places?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Avadi City",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description:
      "A hyperlocal civic platform connecting Avadi residents with local services, updates, and community resources.",
    areaServed: {
      "@type": "City",
      name: "Avadi",
      containedInPlace: {
        "@type": "State",
        name: "Tamil Nadu",
      },
    },
  };

  const page = {
    ...website,
    name: title,
    url: `${siteUrl}${path}`,
    description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(page) }}
      />
    </>
  );
}
