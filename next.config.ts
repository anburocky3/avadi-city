import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["sharp"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@icons-pack/react-simple-icons",
      "framer-motion",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/food/add",
        destination: "/foods/add",
      },
      {
        source: "/food",
        destination: "/foods",
      },
      {
        source: "/hospitals",
        destination: "/healthcare",
      },
      {
        source: "/rental",
        destination: "/rentals",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
