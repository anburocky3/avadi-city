// src/app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avadi City",
    short_name: "Avadi City",
    description:
      "Your one-stop app for municipal services, healthcare, food, rentals, and jobs in Avadi.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a", // Slate 900 dark background
    theme_color: "#f97316", // Primary Accent
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/img/splash.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Avadi City Desktop Home",
      },
      {
        src: "/img/splash.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Avadi City Mobile View",
      },
    ],
    categories: ["government", "utilities", "lifestyle", "productivity"],
  };
}
