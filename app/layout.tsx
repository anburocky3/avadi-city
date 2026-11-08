import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import QueryProvider from "@/providers/QueryProvider";
import { WardProvider } from "@/context/wardContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { SeoJsonLd } from "@/components/seo/seo-json-ld";
import RouteProgress from "@/components/navigation/RouteProgress";

export const metadata: Metadata = {
  metadataBase: new URL("https://avadi.vercel.app"),
  title: {
    default: "Avadi City | Local Services and Civic Updates",
    template: "%s | Avadi City",
  },
  description:
    "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.",
  applicationName: "Avadi City",
  authors: [{ name: "Avadi City" }],
  creator: "Avadi City",
  publisher: "Avadi City",
  category: "community",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Avadi City",
    title: "Avadi City | Local Services and Civic Updates",
    description:
      "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.",
    url: "https://avadi.vercel.app",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Avadi City",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Avadi City | Local Services and Civic Updates",
    description:
      "Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Avadi City",
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="en"
      className={` h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Enable Web App Standalone Mode on iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* iOS Startup Splash Screen referencing your public path */}
        <link rel="apple-touch-startup-image" href="/img/splash.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <WardProvider>
              <SeoJsonLd
                title="Avadi City | Local Services and Civic Updates"
                description="Connect with Avadi through local services, civic updates, community feeds, emergency contacts, and trusted resources."
              />
              <RegisterServiceWorker />
              <RouteProgress />
              <ThemeProvider>
                <ToastProvider>{children}</ToastProvider>
              </ThemeProvider>
              <PwaInstallBanner />

              {/* Vercel Web Analytics & Core Web Vitals Speed Insights */}
              <Analytics />
              <SpeedInsights />
              <PageViewTracker />
            </WardProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
