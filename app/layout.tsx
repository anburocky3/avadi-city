import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";

export const metadata: Metadata = {
  title: "Avadi City App",
  description:
    "Explore things to do in Avadi, Chennai. Discover local attractions, events, and activities in Avadi. Plan your visit and make the most of your time in this vibrant city.",
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en" className={` h-full antialiased`} suppressHydrationWarning>
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
          <RegisterServiceWorker />
          <ThemeProvider>{children}</ThemeProvider>
          <PwaInstallBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
